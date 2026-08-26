import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getAuthConfig } from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/session";
import {
  getSnapshotRefreshConfig,
  refreshSchoolSnapshot,
} from "@/lib/release-snapshot/refresh";

const TENANT_CODE_RE = /^[A-Za-z0-9._-]{1,128}$/;

async function isAuthenticatedRequest(): Promise<boolean> {
  const auth = getAuthConfig();
  if (!auth.isConfigured) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token, auth.sessionSecret);
  return payload !== null;
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { code } = await context.params;
  const tenantCode = code?.trim() ?? "";
  if (!TENANT_CODE_RE.test(tenantCode)) {
    return NextResponse.json({ ok: false, error: "invalid_tenant" }, { status: 400 });
  }

  const config = getSnapshotRefreshConfig();
  if (!config.isConfigured) {
    return NextResponse.json(
      { ok: false, error: "snapshot_refresh_unconfigured" },
      { status: 503 },
    );
  }

  const result = await refreshSchoolSnapshot(tenantCode, config);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        category: result.category ?? null,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    observationStatus: result.snapshot.observationStatus,
    requestId: result.requestId,
  });
}
