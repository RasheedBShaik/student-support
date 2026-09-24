import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId =
      await getSessionUserId();

    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    await connectDB();

    const user = await User.findById(
      userId
    ).select(
      "_id name email role department isActive"
    );

    if (!user || !user.isActive) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department:
          user.department?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/auth/me error:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { status: 500 }
    );
  }
}
