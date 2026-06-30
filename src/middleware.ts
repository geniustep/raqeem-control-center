import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import {
  isAuthBypassPath,
  isProtectedPath,
  safeCallbackUrl,
} from "@/lib/auth/routes";
import { verifySessionToken } from "@/lib/auth/session";

function readSessionSecret(): string {
  return process.env.CONTROL_CENTER_SESSION_SECRET?.trim() ?? "";
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = readSessionSecret();
  if (!secret) return false;
  const payload = await verifySessionToken(token, secret);
  return payload !== null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAuthBypassPath(pathname)) {
    if (pathname === "/login" && (await hasValidSession(request))) {
      const callback = safeCallbackUrl(
        request.nextUrl.searchParams.get("callbackUrl"),
      );
      return NextResponse.redirect(new URL(callback, request.url));
    }
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (await hasValidSession(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
