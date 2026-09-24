import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import TicketActivity from "@/models/TicketActivity";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      studentId,
      subject,
      description,
      category,
      priority,
      departmentId,
    } = body;

    if (
      !studentId ||
      !subject ||
      !description ||
      !category
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const ticketNumber = `ST-${Date.now()}`;

    const ticket = await Ticket.create({
      ticketNumber,
      studentId,
      subject,
      description,
      category,
      priority: priority || "MEDIUM",
      departmentId,
      status: "NEW",
    });

    await TicketActivity.create({
      ticketId: ticket._id,
      actorId: studentId,
      type: "CREATED",
      comment: "Ticket created",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Ticket created successfully",
        ticket,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create ticket",
      },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    await connectDB();

    const tickets = await Ticket.find({
      studentId: "6ab520e033f006424564a6a5",
    })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error("GET /api/tickets error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch tickets",
      },
      { status: 500 }
    );
  }
}
