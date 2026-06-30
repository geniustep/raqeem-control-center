import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getAuthConfig } from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/session";
import {
  getAuditWriteConfig,
  postSimulatedDryRunToOdoo,
  validateClientSimulatedDryRunPayload,
} from "@/lib/audit/simulated-dry-run";

async function isAuthenticatedRequest(): Promise<boolean> {
  const auth = getAuthConfig();
  if (!auth.isConfigured) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = await verifySessionToken(token, auth.sessionSecret);
  return payload !== null;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const auditConfig = getAuditWriteConfig();
  if (!auditConfig.isConfigured) {
    return NextResponse.json(
      { ok: false, error: "audit_write_unconfigured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const validation = validateClientSimulatedDryRunPayload(body);
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status },
    );
  }

  const result = await postSimulatedDryRunToOdoo(validation.data, auditConfig);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
