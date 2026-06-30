import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth/config";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(isProduction),
    maxAge: 0,
  });

  return response;
}
