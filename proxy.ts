import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "student_support_session";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("Please define AUTH_SECRET in your environment variables");
}

const secretKey = new TextEncoder().encode(secret);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?redirect=/staff", request.url),
    );
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (typeof payload.userId !== "string") {
      throw new Error("Invalid session");
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(
      new URL("/login?redirect=/staff", request.url),
    );

    response.cookies.delete(COOKIE_NAME);

    return response;
  }
}

export const config = {
  matcher: ["/staff/:path*"],
};
