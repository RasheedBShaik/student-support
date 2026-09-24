import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import TicketActivity from "@/models/TicketActivity";
import User from "@/models/User";
import Department from "@/models/Department";
import { getSessionUserId } from "@/lib/auth";

const STAFF_ROLES = ["STAFF"] as const;

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

type TicketStatus = (typeof VALID_STATUSES)[number];
type TicketPriority = (typeof VALID_PRIORITIES)[number];

type ActivityType =
  | "CREATED"
  | "ASSIGNED"
  | "RESOLVED"
  | "CLOSED"
  | "REASSIGNED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "COMMENT_ADDED"
  | "PENDING"
  | "RESUMED"
  | "REOPENED"
  | "ESCALATED";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type TicketActivityInput = {
  type: ActivityType;
  comment: string;
};

type TicketBody = {
  status?: unknown;
  priority?: unknown;
  assignedTo?: unknown;
  departmentId?: unknown;
  comment?: unknown;
  resolutionSummary?: unknown;
};

type PopulatedPerson = {
  _id?: unknown;
  name?: string;
  email?: string;
  role?: string;
  department?: unknown;
};

type PopulatedDepartment = {
  _id?: unknown;
  name?: string;
  description?: string;
};

type TicketLike = {
  _id?: unknown;
  createdAt: Date | string;
  status: string;
  priority: string;
  studentId?: PopulatedPerson | unknown | null;
  assignedTo?: PopulatedPerson | unknown | null;
  departmentId?: PopulatedDepartment | unknown | null;
  sla?: {
    responseDueAt?: Date | string | null;
    resolutionDueAt?: Date | string | null;
    respondedAt?: Date | string | null;
    resolvedAt?: Date | string | null;
    [key: string]: unknown;
  } | null;
  resolution?: {
    resolvedBy?: unknown;
    resolvedAt?: Date | string | null;
    summary?: string;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(
    role as (typeof STAFF_ROLES)[number],
  );
}

function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function isTicketStatus(value: unknown): value is TicketStatus {
  return (
    typeof value === "string" &&
    VALID_STATUSES.includes(value as TicketStatus)
  );
}

function isTicketPriority(
  value: unknown,
): value is TicketPriority {
  return (
    typeof value === "string" &&
    VALID_PRIORITIES.includes(value as TicketPriority)
  );
}

function getIdString(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_id" in value
  ) {
    const objectWithId = value as { _id?: unknown };

    if (objectWithId._id) {
      return String(objectWithId._id);
    }
  }

  return String(value);
}

function calculateAge(createdAt: Date | string): string {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return "0m";
  }

  const difference = Math.max(0, Date.now() - createdTime);

  const totalMinutes = Math.floor(
    difference / (1000 * 60),
  );

  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function calculateSlaStatus(
  ticket: TicketLike,
): string {
  if (
    ticket.status === "RESOLVED" ||
    ticket.status === "CLOSED"
  ) {
    return "COMPLETED";
  }

  const dueAt = ticket.sla?.resolutionDueAt;

  if (!dueAt) {
    return "NO_SLA";
  }

  const dueTime = new Date(dueAt).getTime();

  if (Number.isNaN(dueTime)) {
    return "NO_SLA";
  }

  const now = Date.now();

  if (dueTime <= now) {
    return "BREACHED";
  }

  const remainingHours =
    (dueTime - now) / (1000 * 60 * 60);

  if (remainingHours <= 4) {
    return "AT_RISK";
  }

  return "ON_TRACK";
}

function getFallbackResolutionDueAt(
  createdAt: Date | string,
  priority: string,
): Date {
  const hours =
    SLA_HOURS[priority] ?? SLA_HOURS.MEDIUM;

  const createdTime =
    new Date(createdAt).getTime();

  return new Date(
    createdTime +
      hours * 60 * 60 * 1000,
  );
}

function getPopulatedPerson(
  value: unknown,
): {
  _id?: string;
  name: string;
  email: string;
  role: string;
} | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const person = value as PopulatedPerson;

  return {
    _id: person._id
      ? String(person._id)
      : undefined,
    name: person.name ?? "",
    email: person.email ?? "",
    role: person.role ?? "",
  };
}

function getPopulatedDepartment(
  value: unknown,
): {
  _id?: string;
  name: string;
  description: string;
} | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const department =
    value as PopulatedDepartment;

  return {
    _id: department._id
      ? String(department._id)
      : undefined,
    name: department.name ?? "",
    description:
      department.description ?? "",
  };
}

function serializeTicket(
  ticket: TicketLike,
) {
  const resolutionDueAt =
    ticket.sla?.resolutionDueAt ??
    getFallbackResolutionDueAt(
      ticket.createdAt,
      ticket.priority,
    );

  const serialized = {
    ...ticket,

    _id: ticket._id
      ? String(ticket._id)
      : undefined,

    studentId: getPopulatedPerson(
      ticket.studentId,
    ),

    assignedTo: getPopulatedPerson(
      ticket.assignedTo,
    ),

    departmentId:
      getPopulatedDepartment(
        ticket.departmentId,
      ),

    sla: {
      ...(ticket.sla ?? {}),
      responseDueAt:
        ticket.sla?.responseDueAt ?? null,
      resolutionDueAt,
      respondedAt:
        ticket.sla?.respondedAt ?? null,
      resolvedAt:
        ticket.sla?.resolvedAt ?? null,
    },

    age: calculateAge(
      ticket.createdAt,
    ),
  };

  return {
    ...serialized,
    slaStatus:
      calculateSlaStatus(
        serialized,
      ),
  };
}

async function getCurrentUser() {
  const userId =
    await getSessionUserId();

  if (!userId) {
    return {
      userId: null,
      user: null,
    };
  }

  const user =
    await User.findById(userId)
      .select(
        "_id name email role department isActive",
      )
      .lean();

  return {
    userId,
    user,
  };
}

function canAccessTicket(
  user: {
    _id: unknown;
    role: string;
    department?: unknown;
  } | null,
  ticket: {
    studentId?: unknown;
    departmentId?: unknown;
  } | null,
): boolean {
  if (!user || !ticket) {
    return false;
  }

  const userId = String(user._id);

  const studentId =
    getIdString(ticket.studentId);

  const departmentId =
    getIdString(ticket.departmentId);

  const userDepartment =
    getIdString(user.department);

  if (user.role === "STUDENT") {
    return studentId === userId;
  }

  if (user.role === "STAFF") {
    if (!userDepartment || !departmentId) {
      return false;
    }

    return departmentId === userDepartment;
  }

  return false;
}

function addActivity(
  activities: TicketActivityInput[],
  type: ActivityType,
  comment: string,
): void {
  activities.push({
    type,
    comment,
  });
}

function getReadableStatus(
  status: string,
): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase();
}

/*
|--------------------------------------------------------------------------
| GET /api/tickets/[id]
|--------------------------------------------------------------------------
*/
export async function GET(
  request: Request,
  context: RouteContext,
) {
  void request;

  try {
    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ticket ID is required",
        },
        { status: 400 },
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid ticket ID",
        },
        { status: 400 },
      );
    }

    const {
      userId,
      user,
    } = await getCurrentUser();

    if (!userId || !user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to view this ticket",
        },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is not active",
        },
        { status: 403 },
      );
    }

    await connectDB();

    const ticket =
      await Ticket.findById(id)
        .populate(
          "studentId",
          "name email role",
        )
        .populate(
          "assignedTo",
          "name email role department",
        )
        .populate(
          "departmentId",
          "name description",
        )
        .lean();

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found",
        },
        { status: 404 },
      );
    }

    if (
      !canAccessTicket(
        user,
        ticket,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to view this ticket",
        },
        { status: 403 },
      );
    }

    const activities =
      await TicketActivity.find({
        ticketId: ticket._id,
      })
        .populate(
          "actorId",
          "name email role",
        )
        .sort({
          createdAt: 1,
        })
        .lean();

    const serializedActivities =
      activities.map((activity) => {
        const actor =
          getPopulatedPerson(
            activity.actorId,
          );

        return {
          ...activity,
          _id: String(activity._id),
          ticketId: String(
            activity.ticketId,
          ),
          actorId: actor,
        };
      });

    return NextResponse.json({
      success: true,

      ticket: serializeTicket(
        ticket as unknown as TicketLike,
      ),

      activities:
        serializedActivities,

      currentUser: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        department:
          user.department
            ? String(user.department)
            : null,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/tickets/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load ticket",
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

/*
|--------------------------------------------------------------------------
| PATCH /api/tickets/[id]
|--------------------------------------------------------------------------
*/
export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ticket ID is required",
        },
        { status: 400 },
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid ticket ID",
        },
        { status: 400 },
      );
    }

    const {
      userId,
      user,
    } = await getCurrentUser();

    if (!userId || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login",
        },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is not active",
        },
        { status: 403 },
      );
    }

    await connectDB();

    const ticket =
      await Ticket.findById(id);

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found",
        },
        { status: 404 },
      );
    }

    if (
      !canAccessTicket(
        user,
        ticket,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to update this ticket",
        },
        { status: 403 },
      );
    }

    const body =
      (await request.json()) as TicketBody;

    const {
      status,
      priority,
      assignedTo,
      departmentId,
      comment,
      resolutionSummary,
    } = body;

    const activities: TicketActivityInput[] =
      [];

    /*
     * ----------------------------------------------------
     * STATUS
     * ----------------------------------------------------
     */
    if (
      status !== undefined &&
      status !== ticket.status
    ) {
      if (!isTicketStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid ticket status",
          },
          { status: 400 },
        );
      }

      if (user.role === "STUDENT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Students cannot change ticket status",
          },
          { status: 403 },
        );
      }

      const oldStatus =
        ticket.status;

      ticket.status = status;

      if (status === "RESOLVED") {
        const now = new Date();

        ticket.sla = {
          ...(ticket.sla ?? {}),
          resolvedAt: now,
        };

        ticket.resolution = {
          ...(ticket.resolution ?? {}),
          resolvedBy: user._id,
          resolvedAt: now,
          summary:
            typeof resolutionSummary ===
              "string"
              ? resolutionSummary.trim()
              : ticket.resolution
                  ?.summary ?? "",
        };

        addActivity(
          activities,
          "RESOLVED",
          `Ticket resolved. Previous status: ${oldStatus}.`,
        );
      } else if (
        status === "CLOSED"
      ) {
        addActivity(
          activities,
          "CLOSED",
          `Ticket closed. Previous status: ${oldStatus}.`,
        );
      } else if (
        status ===
          "PENDING_STUDENT" ||
        status ===
          "PENDING_INTERNAL"
      ) {
        addActivity(
          activities,
          "PENDING",
          `Ticket moved to ${getReadableStatus(status)}.`,
        );
      } else if (
        oldStatus === "RESOLVED" ||
        oldStatus === "CLOSED"
      ) {
        addActivity(
          activities,
          "REOPENED",
          `Ticket reopened and moved to ${getReadableStatus(status)}.`,
        );
      } else if (
        oldStatus ===
          "PENDING_STUDENT" ||
        oldStatus ===
          "PENDING_INTERNAL"
      ) {
        addActivity(
          activities,
          "RESUMED",
          `Ticket resumed and moved to ${getReadableStatus(status)}.`,
        );
      } else {
        addActivity(
          activities,
          "STATUS_CHANGED",
          `Status changed from ${getReadableStatus(oldStatus)} to ${getReadableStatus(status)}.`,
        );
      }
    }

    /*
     * ----------------------------------------------------
     * PRIORITY
     * ----------------------------------------------------
     */
    if (
      priority !== undefined &&
      priority !== ticket.priority
    ) {
      if (!isTicketPriority(priority)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid ticket priority",
          },
          { status: 400 },
        );
      }

      if (user.role === "STUDENT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Students cannot change ticket priority",
          },
          { status: 403 },
        );
      }

      const oldPriority =
        ticket.priority;

      ticket.priority = priority;

      if (
        ticket.status !== "RESOLVED" &&
        ticket.status !== "CLOSED"
      ) {
        ticket.sla = {
          ...(ticket.sla ?? {}),
          resolutionDueAt:
            new Date(
              new Date(
                ticket.createdAt,
              ).getTime() +
                SLA_HOURS[priority] *
                  60 *
                  60 *
                  1000,
            ),
        };
      }

      addActivity(
        activities,
        "PRIORITY_CHANGED",
        `Priority changed from ${oldPriority} to ${priority}.`,
      );
    }

    /*
     * ----------------------------------------------------
     * ASSIGNMENT
     * ----------------------------------------------------
     */
    if (
      assignedTo !== undefined
    ) {
      if (user.role === "STUDENT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Students cannot assign tickets",
          },
          { status: 403 },
        );
      }

      const newAssignedTo =
        assignedTo
          ? String(assignedTo)
          : null;

      const oldAssignedTo =
        ticket.assignedTo
          ? String(ticket.assignedTo)
          : null;

      if (
        oldAssignedTo !==
        newAssignedTo
      ) {
        if (newAssignedTo) {
          if (
            !isValidObjectId(
              newAssignedTo,
            )
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Invalid staff ID",
              },
              { status: 400 },
            );
          }

          const assignedUser =
            await User.findById(
              newAssignedTo,
            )
              .select(
                "_id name email role department isActive",
              )
              .lean();

          if (!assignedUser) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Assigned staff member not found",
              },
              { status: 404 },
            );
          }

          if (!assignedUser.isActive) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Assigned staff member is inactive",
              },
              { status: 400 },
            );
          }

          if (
            !isStaffRole(
              assignedUser.role,
            )
          ) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Tickets can only be assigned to staff members",
              },
              { status: 400 },
            );
          }

          if (user.role === "STAFF") {
            if (!user.department) {
              return NextResponse.json(
                {
                  success: false,
                  message:
                    "Staff account has no department",
                },
                { status: 403 },
              );
            }

            if (
              !assignedUser.department ||
              String(
                assignedUser.department,
              ) !==
                String(user.department)
            ) {
              return NextResponse.json(
                {
                  success: false,
                  message:
                    "You can only assign tickets to staff in your department",
                },
                { status: 403 },
              );
            }
          }

          ticket.assignedTo =
            assignedUser._id;

          if (
            ticket.status === "NEW"
          ) {
            ticket.status = "ASSIGNED";

            addActivity(
              activities,
              "STATUS_CHANGED",
              "Ticket automatically moved to ASSIGNED after staff assignment.",
            );
          }

          addActivity(
            activities,
            oldAssignedTo
              ? "REASSIGNED"
              : "ASSIGNED",
            oldAssignedTo
              ? `Ticket reassigned to ${assignedUser.name}.`
              : `Ticket assigned to ${assignedUser.name}.`,
          );
        } else {
          ticket.assignedTo =
            undefined;

          addActivity(
            activities,
            "REASSIGNED",
            "Ticket assignment removed.",
          );
        }
      }
    }

    /*
     * ----------------------------------------------------
     * DEPARTMENT
     * ----------------------------------------------------
     */
    if (
      departmentId !== undefined &&
      String(
        departmentId ?? "",
      ) !==
        String(
          ticket.departmentId ?? "",
        )
    ) {
      if (user.role === "STUDENT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Students cannot change ticket department",
          },
          { status: 403 },
        );
      }

      if (departmentId) {
        const newDepartmentId =
          String(departmentId);

        if (
          !isValidObjectId(
            newDepartmentId,
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Invalid department ID",
            },
            { status: 400 },
          );
        }

        const department =
          await Department.findById(
            newDepartmentId,
          )
            .select(
              "_id name isActive",
            )
            .lean();

        if (!department) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Department not found",
            },
            { status: 404 },
          );
        }

        if (
          department.isActive ===
          false
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Department is inactive",
            },
            { status: 400 },
          );
        }

        if (
          user.role === "STAFF" &&
          (
            !user.department ||
            String(
              user.department,
            ) !==
              String(
                department._id,
              )
          )
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Staff cannot transfer tickets to another department",
            },
            { status: 403 },
          );
        }

        ticket.departmentId =
          department._id;

        if (ticket.assignedTo) {
          const assignedUser =
            await User.findById(
              ticket.assignedTo,
            )
              .select(
                "_id department",
              )
              .lean();

          if (
            assignedUser &&
            assignedUser.department &&
            String(
              assignedUser.department,
            ) !==
              String(
                department._id,
              )
          ) {
            ticket.assignedTo =
              undefined;

            addActivity(
              activities,
              "REASSIGNED",
              "Existing assignment removed because the ticket moved to another department.",
            );
          }
        }

        addActivity(
          activities,
          "REASSIGNED",
          `Ticket moved to ${department.name} department.`,
        );
      } else {
        ticket.departmentId =
          undefined;

        ticket.assignedTo =
          undefined;

        addActivity(
          activities,
          "REASSIGNED",
          "Ticket department removed.",
        );
      }
    }

    /*
     * ----------------------------------------------------
     * RESOLUTION SUMMARY
     * ----------------------------------------------------
     */
    if (
      resolutionSummary !==
        undefined &&
      resolutionSummary !== null
    ) {
      if (user.role === "STUDENT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Students cannot update the resolution summary",
          },
          { status: 403 },
        );
      }

      const summary =
        String(
          resolutionSummary,
        ).trim();

      if (
        summary &&
        summary !==
          ticket.resolution
            ?.summary
      ) {
        ticket.resolution = {
          ...(ticket.resolution ?? {}),
          summary,
        };
      }
    }

    /*
     * ----------------------------------------------------
     * COMMENT
     * ----------------------------------------------------
     */
    if (
      comment !== undefined &&
      comment !== null
    ) {
      const cleanComment =
        String(comment).trim();

      if (cleanComment) {
        addActivity(
          activities,
          "COMMENT_ADDED",
          cleanComment,
        );
      }
    }

    /*
     * ----------------------------------------------------
     * RESOLVED SAFETY
     * ----------------------------------------------------
     */
    if (
      ticket.status === "RESOLVED"
    ) {
      const now = new Date();

      ticket.sla = {
        ...(ticket.sla ?? {}),
        resolvedAt:
          ticket.sla?.resolvedAt ??
          now,
      };

      ticket.resolution = {
        ...(ticket.resolution ?? {}),
        resolvedBy:
          ticket.resolution
            ?.resolvedBy ??
          user._id,
        resolvedAt:
          ticket.resolution
            ?.resolvedAt ??
          now,
        summary:
          ticket.resolution
            ?.summary ?? "",
      };
    }

    /*
     * ----------------------------------------------------
     * RESPONSE SLA
     * ----------------------------------------------------
     */
    if (
      ticket.status !== "NEW" &&
      !ticket.sla?.respondedAt
    ) {
      ticket.sla = {
        ...(ticket.sla ?? {}),
        respondedAt: new Date(),
      };
    }

    /*
     * ----------------------------------------------------
     * SAVE
     * ----------------------------------------------------
     */
    await ticket.save();

    if (activities.length > 0) {
      await TicketActivity.insertMany(
        activities.map(
          (activity) => ({
            ticketId:
              ticket._id,
            actorId:
              user._id,
            type:
              activity.type,
            comment:
              activity.comment,
          }),
        ),
      );
    }

    /*
     * ----------------------------------------------------
     * RELOAD POPULATED TICKET
     * ----------------------------------------------------
     */
    const updatedTicket =
      await Ticket.findById(id)
        .populate(
          "studentId",
          "name email role",
        )
        .populate(
          "assignedTo",
          "name email role department",
        )
        .populate(
          "departmentId",
          "name description",
        )
        .lean();

    if (!updatedTicket) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ticket could not be reloaded after update",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Ticket updated successfully",
      ticket: serializeTicket(
        updatedTicket as unknown as TicketLike,
      ),
    });
  } catch (error) {
    console.error(
      "PATCH /api/tickets/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update ticket",
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

/*
|--------------------------------------------------------------------------
| DELETE /api/tickets/[id]
|--------------------------------------------------------------------------
*/
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  void request;

  try {
    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ticket ID is required",
        },
        { status: 400 },
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid ticket ID",
        },
        { status: 400 },
      );
    }

    const {
      userId,
      user,
    } = await getCurrentUser();

    if (!userId || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login",
        },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is not active",
        },
        { status: 403 },
      );
    }

    await connectDB();

    const ticket =
      await Ticket.findById(id);

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Ticket not found",
        },
        { status: 404 },
      );
    }

    if (
      !canAccessTicket(
        user,
        ticket,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to delete this ticket",
        },
        { status: 403 },
      );
    }

    await Ticket.findByIdAndDelete(id);

    await TicketActivity.deleteMany({
      ticketId: ticket._id,
    });

    return NextResponse.json({
      success: true,
      message:
        "Ticket deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /api/tickets/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete ticket",
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
