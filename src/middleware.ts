import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import {
  isAuthBypassPath,
  isProtectedPath,
  safeCallbackUrl,
} from "@/lib/auth/routes";
import { verifySessionToken } from "@/lib/auth/session";
import { KNOWLEDGE_AUTH_PATHS } from "@/lib/knowledge-auth/constants";
import { KNOWLEDGE_SESSION_COOKIE_NAME } from "@/lib/knowledge-auth/constants";
import {
  isKnowledgeAuthApiPath,
  isKnowledgeLoginPath,
  isKnowledgeMfaOnboardingPath,
  isKnowledgePath,
} from "@/lib/knowledge-auth/routes";
import { decryptKnowledgeSession } from "@/lib/knowledge-auth/session";

function readPlatformSessionSecret(): string {
  return process.env.CONTROL_CENTER_SESSION_SECRET?.trim() ?? "";
}

function readKnowledgeEncryptionKey(): string {
  return process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY?.trim() ?? "";
}

async function hasValidPlatformSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = readPlatformSessionSecret();
  if (!secret) return false;
  const payload = await verifySessionToken(token, secret);
  return payload !== null;
}

async function readKnowledgeSession(request: NextRequest) {
  const token = request.cookies.get(KNOWLEDGE_SESSION_COOKIE_NAME)?.value;
  const key = readKnowledgeEncryptionKey();
  if (!key) return null;
  return decryptKnowledgeSession(token, key);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Knowledge auth APIs are public entry points (handlers enforce origin/session).
  if (isKnowledgeAuthApiPath(pathname)) {
    return NextResponse.next();
  }

  if (isKnowledgePath(pathname)) {
    const knowledgeSession = await readKnowledgeSession(request);

    if (isKnowledgeLoginPath(pathname)) {
      if (knowledgeSession?.knowledge_access_ready) {
        return NextResponse.redirect(
          new URL(KNOWLEDGE_AUTH_PATHS.home, request.url),
        );
      }
      if (knowledgeSession && !knowledgeSession.knowledge_access_ready) {
        return NextResponse.redirect(
          new URL(KNOWLEDGE_AUTH_PATHS.mfaOnboarding, request.url),
        );
      }
      return NextResponse.next();
    }

    if (!knowledgeSession) {
      const loginUrl = new URL(KNOWLEDGE_AUTH_PATHS.loginPage, request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!knowledgeSession.knowledge_access_ready) {
      if (isKnowledgeMfaOnboardingPath(pathname)) {
        return NextResponse.next();
      }
      return NextResponse.redirect(
        new URL(KNOWLEDGE_AUTH_PATHS.mfaOnboarding, request.url),
      );
    }

    if (isKnowledgeMfaOnboardingPath(pathname)) {
      return NextResponse.redirect(
        new URL(KNOWLEDGE_AUTH_PATHS.home, request.url),
      );
    }

    return NextResponse.next();
  }

  if (isAuthBypassPath(pathname)) {
    if (pathname === "/login" && (await hasValidPlatformSession(request))) {
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

  if (await hasValidPlatformSession(request)) {
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
