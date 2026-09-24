import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import TicketActivity from "@/models/TicketActivity";
import User from "@/models/User";
import Department from "@/models/Department";
import { getSessionUserId } from "@/lib/auth";

const STAFF_ROLES = [
  "STAFF",
  "MANAGER",
  "ADMIN",
] as const;

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

const ACTIVITY_TYPES = [
  "CREATED",
  "ASSIGNED",
  "RESOLVED",
  "CLOSED",
  "REASSIGNED",
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "COMMENT_ADDED",
  "PENDING",
  "RESUMED",
  "REOPENED",
  "ESCALATED",
] as const;

const SLA_HOURS: Record<string, number> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  URGENT: 8,
};

type ActivityType = (typeof ACTIVITY_TYPES)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isStaffRole(role: string) {
  return STAFF_ROLES.includes(
    role as (typeof STAFF_ROLES)[number],
  );
}

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function calculateAge(createdAt: Date | string) {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return "0m";
  }

  const difference = Math.max(
    0,
    Date.now() - createdTime,
  );

  const totalMinutes = Math.floor(
    difference / (1000 * 60),
  );

  const totalHours = Math.floor(
    totalMinutes / 60,
  );

  const days = Math.floor(
    totalHours / 24,
  );

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

function calculateSlaStatus(ticket: any) {
  if (
    ticket.status === "RESOLVED" ||
    ticket.status === "CLOSED"
  ) {
    return "COMPLETED";
  }

  const dueAt =
    ticket.sla?.resolutionDueAt;

  if (!dueAt) {
    return "NO_SLA";
  }

  const dueTime =
    new Date(dueAt).getTime();

  if (Number.isNaN(dueTime)) {
    return "NO_SLA";
  }

  const now = Date.now();

  if (dueTime <= now) {
    return "BREACHED";
  }

  const remainingHours =
    (dueTime - now) /
    (1000 * 60 * 60);

  if (remainingHours <= 4) {
    return "AT_RISK";
  }

  return "ON_TRACK";
}

function getFallbackResolutionDueAt(
  createdAt: Date | string,
  priority: string,
) {
  const hours =
    SLA_HOURS[priority] ||
    SLA_HOURS.MEDIUM;

  const createdTime =
    new Date(createdAt).getTime();

  return new Date(
    createdTime +
      hours *
        60 *
        60 *
        1000,
  );
}

function serializeTicket(ticket: any) {
  const resolutionDueAt =
    ticket.sla?.resolutionDueAt ||
    getFallbackResolutionDueAt(
      ticket.createdAt,
      ticket.priority,
    );

  const serialized = {
    ...ticket,

    _id: ticket._id
      ? ticket._id.toString()
      : undefined,

    studentId: ticket.studentId
      ? {
          _id: ticket.studentId._id
            ? ticket.studentId._id.toString()
            : undefined,
          name:
            ticket.studentId.name || "",
          email:
            ticket.studentId.email || "",
          role:
            ticket.studentId.role || "STUDENT",
        }
      : null,

    assignedTo: ticket.assignedTo
      ? {
          _id: ticket.assignedTo._id
            ? ticket.assignedTo._id.toString()
            : undefined,
          name:
            ticket.assignedTo.name || "",
          email:
            ticket.assignedTo.email || "",
          role:
            ticket.assignedTo.role || "",
        }
      : null,

    departmentId: ticket.departmentId
      ? {
          _id: ticket.departmentId._id
            ? ticket.departmentId._id.toString()
            : undefined,
          name:
            ticket.departmentId.name || "",
          description:
            ticket.departmentId.description ||
            "",
        }
      : null,

    sla: {
      ...(ticket.sla || {}),
      responseDueAt:
        ticket.sla?.responseDueAt || null,
      resolutionDueAt,
      respondedAt:
        ticket.sla?.respondedAt || null,
      resolvedAt:
        ticket.sla?.resolvedAt || null,
    },

    age: calculateAge(
      ticket.createdAt,
    ),
  };

  return {
    ...serialized,

    slaStatus:
      calculateSlaStatus(serialized),
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

function getIdString(value: any) {
  if (!value) {
    return null;
  }

  if (
    typeof value === "object" &&
    value._id
  ) {
    return value._id.toString();
  }

  return value.toString();
}

function canAccessTicket(
  user: any,
  ticket: any,
) {
  if (!user || !ticket) {
    return false;
  }

  const userId =
    user._id.toString();

  const studentId =
    getIdString(ticket.studentId);

  const departmentId =
    getIdString(ticket.departmentId);

  const userDepartment =
    getIdString(user.department);

  /*
   * STUDENT
   *
   * Students can only see their own tickets.
   */
  if (user.role === "STUDENT") {
    return studentId === userId;
  }

  /*
   * MANAGER / ADMIN
   *
   * Management can see every ticket.
   */
  if (
    user.role === "MANAGER" ||
    user.role === "ADMIN"
  ) {
    return true;
  }

  /*
   * STAFF
   *
   * Staff can see tickets belonging
   * to their department.
   */
  if (user.role === "STAFF") {
    if (!userDepartment) {
      return false;
    }

    if (!departmentId) {
      return false;
    }

    return (
      departmentId ===
      userDepartment
    );
  }

  return false;
}

function addActivity(
  activities: Array<{
    type: ActivityType;
    comment: string;
  }>,
  type: ActivityType,
  comment: string,
) {
  activities.push({
    type,
    comment,
  });
}

/*
|--------------------------------------------------------------------------
| GET /api/tickets/[id]
|--------------------------------------------------------------------------
|
| STUDENT
|   Own tickets only.
|
| STAFF
|   Tickets from their department.
|
| MANAGER
|   All tickets.
|
| ADMIN
|   All tickets.
|
*/
export async function GET(
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

    /*
     * IMPORTANT:
     *
     * Authentication is checked before
     * loading the ticket.
     */
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

    /*
     * Importing Department at the top of this file
     * registers the model before populate is used.
     *
     * The same applies to TicketActivity.
     */

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
          message:
            "Ticket not found",
        },
        { status: 404 },
      );
    }

    /*
     * Access control.
     */
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

    /*
     * Activity history.
     */
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
      activities.map(
        (activity: any) => ({
          ...activity,

          _id:
            activity._id
              ? activity._id.toString()
              : undefined,

          ticketId:
            activity.ticketId
              ? activity.ticketId.toString()
              : undefined,

          actorId:
            activity.actorId
              ? {
                  _id:
                    activity.actorId
                      ._id
                      ?.toString(),
                  name:
                    activity.actorId
                      .name || "",
                  email:
                    activity.actorId
                      .email || "",
                  role:
                    activity.actorId
                      .role || "",
                }
              : null,
        }),
      );

    return NextResponse.json({
      success: true,

      ticket:
        serializeTicket(ticket),

      activities:
        serializedActivities,

      currentUser: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department:
          user.department
            ? user.department.toString()
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
|
| Used for:
|
| - Status
| - Priority
| - Assignment
| - Department
| - Comments
| - Resolution
|
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
          message:
            "Ticket not found",
        },
        { status: 404 },
      );
    }

    /*
     * Ticket access.
     */
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
      await request.json();

    const {
      status,
      priority,
      assignedTo,
      departmentId,
      comment,
      resolutionSummary,
    } = body;

    const activities: Array<{
      type: ActivityType;
      comment: string;
    }> = [];

    /*
     * ----------------------------------------------------
     * STATUS
     * ----------------------------------------------------
     */
    if (
      status !== undefined &&
      status !== ticket.status
    ) {
      if (
        !VALID_STATUSES.includes(
          status,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid ticket status",
          },
          { status: 400 },
        );
      }

      /*
       * Students should not change workflow status.
       */
      if (
        user.role === "STUDENT"
      ) {
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

      /*
       * RESOLVED
       */
      if (
        status === "RESOLVED"
      ) {
        const now =
          new Date();

        ticket.sla = {
          ...(ticket.sla || {}),
          resolvedAt: now,
        };

        ticket.resolution = {
          ...(ticket.resolution || {}),
          resolvedBy:
            user._id,
          resolvedAt:
            now,
          summary:
            resolutionSummary
              ?.toString()
              .trim() ||
            ticket.resolution
              ?.summary ||
            "",
        };

        addActivity(
          activities,
          "RESOLVED",
          `Ticket resolved. Previous status: ${oldStatus}.`,
        );
      }

      /*
       * CLOSED
       */
      else if (
        status === "CLOSED"
      ) {
        addActivity(
          activities,
          "CLOSED",
          `Ticket closed. Previous status: ${oldStatus}.`,
        );
      }

      /*
       * PENDING
       */
      else if (
        status ===
          "PENDING_STUDENT" ||
        status ===
          "PENDING_INTERNAL"
      ) {
        addActivity(
          activities,
          "PENDING",
          `Ticket moved to ${status
            .replaceAll(
              "_",
              " ",
            )
            .toLowerCase()}.`,
        );
      }

      /*
       * REOPENED
       */
      else if (
        oldStatus === "RESOLVED" ||
        oldStatus === "CLOSED"
      ) {
        addActivity(
          activities,
          "REOPENED",
          `Ticket reopened and moved to ${status
            .replaceAll(
              "_",
              " ",
            )
            .toLowerCase()}.`,
        );
      }

      /*
       * RESUMED
       */
      else if (
        oldStatus ===
          "PENDING_STUDENT" ||
        oldStatus ===
          "PENDING_INTERNAL"
      ) {
        addActivity(
          activities,
          "RESUMED",
          `Ticket resumed and moved to ${status
            .replaceAll(
              "_",
              " ",
            )
            .toLowerCase()}.`,
        );
      }

      /*
       * NORMAL STATUS CHANGE
       */
      else {
        addActivity(
          activities,
          "STATUS_CHANGED",
          `Status changed from ${oldStatus
            .replaceAll(
              "_",
              " ",
            )} to ${status
            .replaceAll(
              "_",
              " ",
            )}.`,
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
      if (
        !VALID_PRIORITIES.includes(
          priority,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid ticket priority",
          },
          { status: 400 },
        );
      }

      if (
        user.role === "STUDENT"
      ) {
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

      ticket.priority =
        priority;

      /*
       * Recalculate SLA for active tickets.
       */
      if (
        ticket.status !==
          "RESOLVED" &&
        ticket.status !==
          "CLOSED"
      ) {
        ticket.sla = {
          ...(ticket.sla || {}),
          resolutionDueAt:
            new Date(
              new Date(
                ticket.createdAt,
              ).getTime() +
                SLA_HOURS[
                  priority
                ] *
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
      if (
        user.role === "STUDENT"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Students cannot assign tickets",
          },
          { status: 403 },
        );
      }

      const oldAssignedTo =
        ticket.assignedTo
          ? ticket.assignedTo.toString()
          : null;

      const newAssignedTo =
        assignedTo
          ? String(assignedTo)
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

          if (
            !assignedUser.isActive
          ) {
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
                  "Ticket can only be assigned to staff, manager or admin",
              },
              { status: 400 },
            );
          }

          /*
           * STAFF can only assign within
           * their own department.
           */
          if (
            user.role === "STAFF"
          ) {
            if (
              !user.department
            ) {
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
              assignedUser.department.toString() !==
                user.department.toString()
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

          /*
           * NEW -> ASSIGNED
           */
          if (
            ticket.status === "NEW"
          ) {
            ticket.status =
              "ASSIGNED";

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
        departmentId || "",
      ) !==
        String(
          ticket.departmentId || "",
        )
    ) {
      if (
        user.role === "STUDENT"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Students cannot change ticket department",
          },
          { status: 403 },
        );
      }

      if (
        departmentId
      ) {
        if (
          !isValidObjectId(
            String(
              departmentId,
            ),
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
            departmentId,
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

        /*
         * STAFF cannot transfer
         * to another department.
         */
        if (
          user.role === "STAFF" &&
          (
            !user.department ||
            user.department.toString() !==
              department._id.toString()
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

        /*
         * Existing assignment may no longer
         * belong to the new department.
         */
        if (
          ticket.assignedTo
        ) {
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
            assignedUser.department.toString() !==
              department._id.toString()
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
      resolutionSummary !==
        null
    ) {
      if (
        user.role === "STUDENT"
      ) {
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
          ...(ticket.resolution || {}),
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
      ticket.status ===
      "RESOLVED"
    ) {
      const now =
        new Date();

      ticket.sla = {
        ...(ticket.sla || {}),
        resolvedAt:
          ticket.sla?.resolvedAt ||
          now,
      };

      ticket.resolution = {
        ...(ticket.resolution || {}),
        resolvedBy:
          ticket.resolution
            ?.resolvedBy ||
          user._id,
        resolvedAt:
          ticket.resolution
            ?.resolvedAt ||
          now,
        summary:
          ticket.resolution
            ?.summary ||
          "",
      };
    }

    /*
     * ----------------------------------------------------
     * RESPONSE SLA
     * ----------------------------------------------------
     */
    if (
      ticket.status !==
        "NEW" &&
      !ticket.sla?.respondedAt
    ) {
      ticket.sla = {
        ...(ticket.sla || {}),
        respondedAt:
          new Date(),
      };
    }

    /*
     * ----------------------------------------------------
     * SAVE TICKET
     * ----------------------------------------------------
     */
    await ticket.save();

    /*
     * ----------------------------------------------------
     * SAVE ACTIVITIES
     * ----------------------------------------------------
     *
     * IMPORTANT:
     * There is intentionally NO "UPDATED"
     * activity type here.
     *
     * Your TicketActivity model does not support
     * "UPDATED".
     */
    if (
      activities.length > 0
    ) {
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

      ticket:
        serializeTicket(
          updatedTicket,
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
|
| ADMIN ONLY
|
*/
export async function DELETE(
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

    if (
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only administrators can delete tickets",
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
          message:
            "Ticket not found",
        },
        { status: 404 },
      );
    }

    /*
     * Record the deletion as CLOSED before
     * removing the ticket.
     */
    await TicketActivity.create({
      ticketId:
        ticket._id,
      actorId:
        user._id,
      type: "CLOSED",
      comment:
        "Ticket deleted by administrator.",
    });

    await Ticket.findByIdAndDelete(
      id,
    );

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
