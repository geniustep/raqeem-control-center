import { SESSION_MAX_AGE_SECONDS } from "./constants";

export interface SessionPayload {
  /** Issued-at (unix seconds). */
  iat: number;
  /** Expiry (unix seconds). */
  exp: number;
}

function textEncoder(): TextEncoder {
  return new TextEncoder();
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLen);
  const binary =
    typeof atob === "function"
      ? atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payloadPart: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder().encode(payloadPart),
  );
  return toBase64Url(new Uint8Array(signature));
}

async function verifySignature(
  payloadPart: string,
  signaturePart: string,
  secret: string,
): Promise<boolean> {
  try {
    const key = await importHmacKey(secret);
    const signatureBytes = Uint8Array.from(fromBase64Url(signaturePart));
    return crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      textEncoder().encode(payloadPart),
    );
  } catch {
    return false;
  }
}

export function createSessionPayload(
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionPayload {
  return {
    iat: nowSeconds,
    exp: nowSeconds + SESSION_MAX_AGE_SECONDS,
  };
}

/** Create a signed session token: `<payload>.<signature>`. */
export async function createSessionToken(
  secret: string,
  payload: SessionPayload = createSessionPayload(),
): Promise<string> {
  const payloadPart = toBase64Url(
    textEncoder().encode(JSON.stringify(payload)),
  );
  const signaturePart = await signPayload(payloadPart, secret);
  return `${payloadPart}.${signaturePart}`;
}

/** Verify signature and expiry. Returns null when invalid or expired. */
export async function verifySessionToken(
  token: string | undefined | null,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token || !secret) return null;

  const dot = token.indexOf(".");
  if (dot <= 0) return null;

  const payloadPart = token.slice(0, dot);
  const signaturePart = token.slice(dot + 1);
  if (!signaturePart) return null;

  const valid = await verifySignature(payloadPart, signaturePart, secret);
  if (!valid) return null;

  try {
    const json = new TextDecoder().decode(fromBase64Url(payloadPart));
    const payload = JSON.parse(json) as SessionPayload;
    if (
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
