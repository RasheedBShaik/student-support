import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const name = body.name?.trim();
    const email =
      body.email?.trim().toLowerCase();
    const password = body.password;
    const confirmPassword =
      body.confirmPassword;

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email and password are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 6 characters",
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Passwords do not match",
        },
        { status: 400 }
      );
    }

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
      isActive: true,
    });

    await createSession(
      user._id.toString(),
      true
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/auth/signup error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create account",
      },
      { status: 500 }
    );
  }
}
