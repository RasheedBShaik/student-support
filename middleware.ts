import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "student_support_session";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("Please define AUTH_SECRET in .env.local");
}

const secretKey = new TextEncoder().encode(secret);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect staff/management pages.
  if (!pathname.startsWith("/staff")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Not logged in → login page
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

    /*
     * IMPORTANT:
     * The JWT only contains userId.
     * Therefore middleware cannot determine the user's role.
     *
     * We allow the request through here and let the /api/staff/tickets
     * route perform the actual STAFF authorization.
     */
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
