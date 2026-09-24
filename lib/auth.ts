import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "student_support_session";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("Please define AUTH_SECRET in .env.local");
}

const secretKey = new TextEncoder().encode(secret);

export type UserRole = "STUDENT" | "STAFF";

export async function createSession(
  userId: string,
  rememberMe = true,
) {
  const sessionDuration = rememberMe ? "7d" : "1d";

  const maxAge = rememberMe
    ? 60 * 60 * 24 * 7
    : 60 * 60 * 24;

  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(sessionDuration)
    .sign(secretKey);

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (typeof payload.userId !== "string") {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
}
