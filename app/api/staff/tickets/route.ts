import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import User from "@/models/User";
import Department from "@/models/Department";
import { getSessionUserId } from "@/lib/auth";

const STAFF_ROLES = ["STAFF", "MANAGER", "ADMIN"] as const;

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

const SLA_HOURS: Record<string, number> = {
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

function getAge(createdAt: Date | string) {
  const created = new Date(createdAt).getTime();

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

function getSlaStatus(ticket: any) {
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

    /*
     * Importing Department above registers the model
     * before Ticket.populate("departmentId") is used.
     *
     * This prevents:
     *
     * Schema hasn't been registered for model "Department"
     */
    void Department;

    // ---------------------------------------------
    // CURRENT USER
    // ---------------------------------------------

    const currentUser = await User.findById(userId)
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

    if (
      !STAFF_ROLES.includes(
        currentUser.role as (typeof STAFF_ROLES)[number],
      )
    ) {
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

    const query: Record<string, any> = {};

    /*
     * STAFF:
     * Only tickets belonging to their department.
     *
     * MANAGER / ADMIN:
     * Can see all tickets.
     */

    if (currentUser.role === "STAFF") {
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

      query.departmentId = currentUser.department;
    }

    // ---------------------------------------------
    // STATUS FILTER
    // ---------------------------------------------

    if (
      status !== "ALL" &&
      VALID_STATUSES.includes(
        status as (typeof VALID_STATUSES)[number],
      )
    ) {
      query.status = status;
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
      query.priority = priority;
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

    const tickets = await Ticket.find(query)
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
      .lean();

    // ---------------------------------------------
    // ENRICH TICKETS
    // ---------------------------------------------

    const enrichedTickets = tickets.map(
      (ticket: any) => {
        let resolutionDueAt =
          ticket.sla?.resolutionDueAt;

        /*
         * Existing/old tickets may not have SLA data.
         * Generate a fallback from priority.
         */

        if (!resolutionDueAt) {
          const hours =
            SLA_HOURS[ticket.priority] ||
            SLA_HOURS.MEDIUM;

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
            ...ticket,
            sla,
          });

        return {
          ...ticket,

          _id: ticket._id.toString(),

          ticketNumber:
            ticket.ticketNumber,

          subject: ticket.subject,

          description:
            ticket.description,

          category:
            ticket.category,

          priority:
            ticket.priority,

          status:
            ticket.status,

          createdAt:
            ticket.createdAt,

          updatedAt:
            ticket.updatedAt,

          age: getAge(
            ticket.createdAt,
          ),

          sla,

          slaStatus,

          studentId:
            ticket.studentId
              ? {
                  _id:
                    ticket.studentId._id
                      ?.toString(),

                  name:
                    ticket.studentId.name,

                  email:
                    ticket.studentId.email,
                }
              : null,

          assignedTo:
            ticket.assignedTo
              ? {
                  _id:
                    ticket.assignedTo._id
                      ?.toString(),

                  name:
                    ticket.assignedTo.name,

                  email:
                    ticket.assignedTo.email,

                  role:
                    ticket.assignedTo.role,
                }
              : null,

          departmentId:
            ticket.departmentId
              ? {
                  _id:
                    ticket.departmentId._id
                      ?.toString(),

                  name:
                    ticket.departmentId.name,
                }
              : null,
        };
      },
    );

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

      tickets:
        enrichedTickets,
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
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 },
    );
  }
}
