import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getAuthConfig } from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/session";
import {
  getEntitlementWriteConfig,
  setWhatsAppEntitlement,
  validateSwitchPayload,
} from "@/lib/entitlements/whatsapp";

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
  request: NextRequest,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const validation = validateSwitchPayload(body);
  if (!validation.ok) {
    return NextResponse.json(validation, { status: 400 });
  }

  const config = getEntitlementWriteConfig();
  if (!config.isConfigured) {
    return NextResponse.json(
      { ok: false, error: "entitlement_write_unconfigured" },
      { status: 503 },
    );
  }

  const result = await setWhatsAppEntitlement(
    tenantCode,
    validation.enabled,
    config,
  );
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
