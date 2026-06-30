import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, getSessionCookieOptions } from "@/lib/auth/config";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyOperatorCredentials } from "@/lib/auth/credentials";
import { safeCallbackUrl } from "@/lib/auth/routes";
import { createSessionToken } from "@/lib/auth/session";

function loginRedirect(request: NextRequest, callbackUrl: string, error = false) {
  const url = new URL("/login", request.url);
  url.searchParams.set("callbackUrl", callbackUrl);
  if (error) url.searchParams.set("error", "1");
  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  const auth = getAuthConfig();
  const form = await request.formData();
  const callbackUrl = safeCallbackUrl(
    form.get("callbackUrl")?.toString() ?? null,
  );

  if (!auth.isConfigured) {
    return loginRedirect(request, callbackUrl, true);
  }

  const username = form.get("username")?.toString() ?? "";
  const password = form.get("password")?.toString() ?? "";

  const ok = verifyOperatorCredentials(
    auth.username,
    auth.password,
    username,
    password,
  );

  if (!ok) {
    return loginRedirect(request, callbackUrl, true);
  }

  const token = await createSessionToken(auth.sessionSecret);
  const response = NextResponse.redirect(new URL(callbackUrl, request.url));
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    getSessionCookieOptions(isProduction),
  );

  return response;
}
