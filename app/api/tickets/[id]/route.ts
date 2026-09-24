import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import TicketActivity from "@/models/TicketActivity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        {
          success: false,
          message: "Invalid ticket ID",
        },
        { status: 400 }
      );
    }

    const ticket = await Ticket.findById(id).lean();

    if (!ticket) {
      return Response.json(
        {
          success: false,
          message: "Ticket not found",
        },
        { status: 404 }
      );
    }

    const activities = await TicketActivity.find({
      ticketId: ticket._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return Response.json({
      success: true,
      ticket,
      activities,
    });
  } catch (error) {
    console.error("GET /api/tickets/[id] error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch ticket",
      },
      { status: 500 }
    );
  }
}
