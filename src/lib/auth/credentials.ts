import { timingSafeEqual } from "node:crypto";

function safeEqual(expected: string, provided: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

/** Validate operator credentials without leaking which field failed. */
export function verifyOperatorCredentials(
  expectedUsername: string,
  expectedPassword: string,
  providedUsername: string,
  providedPassword: string,
): boolean {
  const usernameOk = safeEqual(expectedUsername, providedUsername);
  const passwordOk = safeEqual(expectedPassword, providedPassword);
  return usernameOk && passwordOk;
}
