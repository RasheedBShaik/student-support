import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import User from "@/models/User";
import Department from "@/models/Department";
import { getSessionUserId } from "@/lib/auth";

const VALID_STATUSES = [
  "NEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_STUDENT",
  "PENDING_INTERNAL",
  "RESOLVED",
  "CLOSED",
] as const;

const VALID_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

const SLA_HOURS: Record<
  (typeof VALID_PRIORITIES)[number],
  number
> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  URGENT: 8,
};

const EMPTY_STATS = {
  total: 0,
  new: 0,
  assigned: 0,
  inProgress: 0,
  pending: 0,
  resolved: 0,
  closed: 0,
  urgent: 0,
  slaBreached: 0,
  slaAtRisk: 0,
};

type PopulatedUser = {
  _id: unknown;
  name?: string;
  email?: string;
  role?: string;
  department?: unknown;
};

type PopulatedDepartment = {
  _id: unknown;
  name?: string;
};

type PopulatedTicket = {
  _id: unknown;
  ticketNumber?: string;
  subject?: string;
  description?: string;
  category?: string;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  sla?: {
    responseDueAt?: Date | string | null;
    resolutionDueAt?: Date | string | null;
    respondedAt?: Date | string | null;
    resolvedAt?: Date | string | null;
  };
  studentId?: PopulatedUser | null;
  assignedTo?: PopulatedUser | null;
  departmentId?: PopulatedDepartment | null;
};

type SlaTicket = {
  status: string;
  sla?: {
    resolutionDueAt?: Date | string | null;
  };
};

type TicketQuery = {
  departmentId?: unknown;
  status?: (typeof VALID_STATUSES)[number];
  priority?: (typeof VALID_PRIORITIES)[number];
  $or?: Array<{
    ticketNumber?: {
      $regex: string;
      $options: "i";
    };
    subject?: {
      $regex: string;
      $options: "i";
    };
    description?: {
      $regex: string;
      $options: "i";
    };
  }>;
};

function getAge(createdAt: Date | string) {
  const created = new Date(createdAt).getTime();

  if (Number.isNaN(created)) {
    return "0h";
  }

  const difference = Math.max(
    0,
    Date.now() - created,
  );

  const totalHours = Math.floor(
    difference / (1000 * 60 * 60),
  );

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  return `${hours}h`;
}

function getSlaStatus(ticket: SlaTicket) {
  if (
    ticket.status === "RESOLVED" ||
    ticket.status === "CLOSED"
  ) {
    return "COMPLETED";
  }

  const due = ticket.sla?.resolutionDueAt;

  if (!due) {
    return "NO_SLA";
  }

  const dueTime = new Date(due).getTime();

  if (Number.isNaN(dueTime)) {
    return "NO_SLA";
  }

  const now = Date.now();

  if (dueTime <= now) {
    return "BREACHED";
  }

  const hoursRemaining =
    (dueTime - now) / (1000 * 60 * 60);

  if (hoursRemaining <= 4) {
    return "AT_RISK";
  }

  return "ON_TRACK";
}

function getIdString(value: unknown) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_id" in value
  ) {
    const objectWithId = value as {
      _id: unknown;
    };

    return objectWithId._id
      ? String(objectWithId._id)
      : "";
  }

  return String(value);
}

export async function GET(request: Request) {
  try {
    // ---------------------------------------------
    // AUTHENTICATION
    // ---------------------------------------------

    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to access the staff dashboard",
        },
        { status: 401 },
      );
    }

    // ---------------------------------------------
    // DATABASE
    // ---------------------------------------------

    await connectDB();

    // Department is imported so Mongoose registers
    // the model before populate() is used.
    void Department;

    // ---------------------------------------------
    // CURRENT USER
    // ---------------------------------------------

    const currentUser =
      await User.findById(userId)
        .select(
          "_id name email role department isActive",
        )
        .lean();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    if (!currentUser.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not active",
        },
        { status: 403 },
      );
    }

    if (currentUser.role !== "STAFF") {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to access the staff dashboard",
        },
        { status: 403 },
      );
    }

    // ---------------------------------------------
    // QUERY PARAMETERS
    // ---------------------------------------------

    const { searchParams } = new URL(
      request.url,
    );

    const status =
      searchParams.get("status") || "ALL";

    const priority =
      searchParams.get("priority") || "ALL";

    const search =
      searchParams.get("search")?.trim() || "";

    // ---------------------------------------------
    // BUILD QUERY
    // ---------------------------------------------

    const query: TicketQuery = {};

    if (!currentUser.department) {
      return NextResponse.json({
        success: true,

        user: {
          id: currentUser._id.toString(),
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
        },

        stats: EMPTY_STATS,

        tickets: [],
      });
    }

    query.departmentId =
      currentUser.department;

    // ---------------------------------------------
    // STATUS FILTER
    // ---------------------------------------------

    if (
      status !== "ALL" &&
      VALID_STATUSES.includes(
        status as (typeof VALID_STATUSES)[number],
      )
    ) {
      query.status =
        status as (typeof VALID_STATUSES)[number];
    }

    // ---------------------------------------------
    // PRIORITY FILTER
    // ---------------------------------------------

    if (
      priority !== "ALL" &&
      VALID_PRIORITIES.includes(
        priority as (typeof VALID_PRIORITIES)[number],
      )
    ) {
      query.priority =
        priority as (typeof VALID_PRIORITIES)[number];
    }

    // ---------------------------------------------
    // SEARCH
    // ---------------------------------------------

    if (search) {
      query.$or = [
        {
          ticketNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          subject: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ---------------------------------------------
    // FETCH TICKETS
    // ---------------------------------------------

    const tickets =
      (await Ticket.find(query as Parameters<typeof Ticket.find>[0])
        .populate(
          "studentId",
          "name email",
        )
        .populate(
          "assignedTo",
          "name email role",
        )
        .populate(
          "departmentId",
          "name",
        )
        .sort({
          createdAt: -1,
        })
        .lean()) as unknown as PopulatedTicket[];

    // ---------------------------------------------
    // ENRICH TICKETS
    // ---------------------------------------------

    const enrichedTickets =
      tickets.map((ticket) => {
        let resolutionDueAt =
          ticket.sla?.resolutionDueAt;

        if (!resolutionDueAt) {
          const priorityKey =
            VALID_PRIORITIES.includes(
              ticket.priority as (typeof VALID_PRIORITIES)[number],
            )
              ? (ticket.priority as (typeof VALID_PRIORITIES)[number])
              : "MEDIUM";

          const hours =
            SLA_HOURS[priorityKey];

          resolutionDueAt = new Date(
            new Date(
              ticket.createdAt,
            ).getTime() +
              hours *
                60 *
                60 *
                1000,
          );
        }

        const sla = {
          ...(ticket.sla || {}),
          resolutionDueAt,
        };

        const slaStatus =
          getSlaStatus({
            status: ticket.status,
            sla,
          });

        return {
          ...ticket,

          _id: String(ticket._id),

          age: getAge(
            ticket.createdAt,
          ),

          sla,

          slaStatus,

          studentId:
            ticket.studentId
              ? {
                  _id: getIdString(
                    ticket.studentId._id,
                  ),
                  name:
                    ticket.studentId.name ||
                    "",
                  email:
                    ticket.studentId.email ||
                    "",
                }
              : null,

          assignedTo:
            ticket.assignedTo
              ? {
                  _id: getIdString(
                    ticket.assignedTo._id,
                  ),
                  name:
                    ticket.assignedTo.name ||
                    "",
                  email:
                    ticket.assignedTo.email ||
                    "",
                  role:
                    ticket.assignedTo.role ||
                    "",
                }
              : null,

          departmentId:
            ticket.departmentId
              ? {
                  _id: getIdString(
                    ticket.departmentId._id,
                  ),
                  name:
                    ticket.departmentId.name ||
                    "",
                }
              : null,
        };
      });

    // ---------------------------------------------
    // STATS
    // ---------------------------------------------

    const stats = {
      total:
        enrichedTickets.length,

      new:
        enrichedTickets.filter(
          (ticket) =>
            ticket.status === "NEW",
        ).length,

      assigned:
        enrichedTickets.filter(
          (ticket) =>
            ticket.status ===
            "ASSIGNED",
        ).length,

      inProgress:
        enrichedTickets.filter(
          (ticket) =>
            ticket.status ===
            "IN_PROGRESS",
        ).length,

      pending:
        enrichedTickets.filter(
          (ticket) =>
            ticket.status ===
              "PENDING_STUDENT" ||
            ticket.status ===
              "PENDING_INTERNAL",
        ).length,

      resolved:
        enrichedTickets.filter(
          (ticket) =>
            ticket.status ===
            "RESOLVED",
        ).length,

      closed:
        enrichedTickets.filter(
          (ticket) =>
            ticket.status ===
            "CLOSED",
        ).length,

      urgent:
        enrichedTickets.filter(
          (ticket) =>
            ticket.priority ===
            "URGENT",
        ).length,

      slaBreached:
        enrichedTickets.filter(
          (ticket) =>
            ticket.slaStatus ===
            "BREACHED",
        ).length,

      slaAtRisk:
        enrichedTickets.filter(
          (ticket) =>
            ticket.slaStatus ===
            "AT_RISK",
        ).length,
    };

    // ---------------------------------------------
    // RESPONSE
    // ---------------------------------------------

    return NextResponse.json({
      success: true,

      user: {
        id: currentUser._id.toString(),
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },

      stats,

      tickets: enrichedTickets,
    });
  } catch (error) {
    console.error(
      "GET /api/staff/tickets error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load staff tickets",
        error:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}