import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import TicketActivity from "@/models/TicketActivity";
import User from "@/models/User";
import Department from "@/models/Department";
import { getSessionUserId } from "@/lib/auth";

const CATEGORY_DEPARTMENT: Record<string, string> = {
  FEES: "Accounts",

  ATTENDANCE: "Administration",

  ID_CARD: "Administration",

  DOCUMENTS: "Administration",

  CERTIFICATES: "Administration",

  EXAMINATION: "Examination",

  HOSTEL: "Administration",

  TRANSPORT: "Administration",

  OTHER: "Administration",
};

const SLA_HOURS: Record<string, number> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  URGENT: 8,
};

export async function POST(request: Request) {
  try {
    const userId =
      await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to create a support request",
        },
        { status: 401 },
      );
    }

    await connectDB();

    const user =
      await User.findById(userId).select(
        "_id name email role isActive",
      );

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is not active",
        },
        { status: 403 },
      );
    }

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only students can create support requests",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      subject,
      description,
      category,
      priority,
      departmentId,
    } = body;

    if (
      !subject?.trim() ||
      !description?.trim() ||
      !category
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Subject, description and category are required",
        },
        { status: 400 },
      );
    }

    const finalPriority =
      priority || "MEDIUM";

    if (
      ![
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT",
      ].includes(finalPriority)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid priority",
        },
        { status: 400 },
      );
    }

    /*
     * Automatically determine department.
     *
     * If frontend explicitly provides departmentId,
     * use it.
     *
     * Otherwise determine it from category.
     */
    let finalDepartmentId =
      departmentId || undefined;

    if (!finalDepartmentId) {
      const departmentName =
        CATEGORY_DEPARTMENT[category];

      if (departmentName) {
        const department =
          await Department.findOne({
            name: departmentName,
            isActive: true,
          }).select("_id");

        if (department) {
          finalDepartmentId =
            department._id;
        }
      }
    }

    /*
     * Calculate SLA.
     */
    const resolutionDueAt =
      new Date(
        Date.now() +
          SLA_HOURS[finalPriority] *
            60 *
            60 *
            1000,
      );

    const responseDueAt =
      new Date(
        Date.now() +
          Math.min(
            SLA_HOURS[finalPriority],
            4,
          ) *
            60 *
            60 *
            1000,
      );

    const ticketNumber =
      `ST-${Date.now()}`;

    const ticket =
      await Ticket.create({
        ticketNumber,

        studentId: userId,

        subject:
          subject.trim(),

        description:
          description.trim(),

        category,

        priority:
          finalPriority,

        departmentId:
          finalDepartmentId,

        status: "NEW",

        sla: {
          responseDueAt,

          resolutionDueAt,
        },
      });

    await TicketActivity.create({
      ticketId:
        ticket._id,

      actorId:
        userId,

      type: "CREATED",

      comment:
        "Ticket created",
    });

    return NextResponse.json(
      {
        success: true,

        message:
          "Ticket created successfully",

        ticket,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/tickets error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create ticket",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const userId =
      await getSessionUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please login to view your tickets",
        },
        { status: 401 },
      );
    }

    await connectDB();

    const user =
      await User.findById(userId).select(
        "_id role isActive",
      );

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account is not active",
        },
        { status: 403 },
      );
    }

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only students can access this page",
        },
        { status: 403 },
      );
    }

    const tickets =
      await Ticket.find({
        studentId: userId,
      })
        .populate(
          "departmentId",
          "name",
        )
        .populate(
          "assignedTo",
          "name email role",
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error(
      "GET /api/tickets error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to fetch tickets",
      },
      { status: 500 },
    );
  }
}
