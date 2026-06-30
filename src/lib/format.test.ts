import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatOptionalDateTime,
  isMissingTimestamp,
  MISSING_DATE_LABEL,
} from "@/lib/format";

describe("formatOptionalDateTime", () => {
  it("returns placeholder for null instead of 1970", () => {
    expect(formatOptionalDateTime(null)).toBe(MISSING_DATE_LABEL);
    expect(formatOptionalDateTime(null)).not.toContain("1970");
  });

  it("returns placeholder for undefined instead of 1970", () => {
    expect(formatOptionalDateTime(undefined)).toBe(MISSING_DATE_LABEL);
    expect(formatOptionalDateTime(undefined)).not.toContain("1970");
  });

  it("returns placeholder for empty string and Unix epoch", () => {
    expect(formatOptionalDateTime("")).toBe(MISSING_DATE_LABEL);
    expect(formatOptionalDateTime(new Date(0).toISOString())).toBe(MISSING_DATE_LABEL);
    expect(formatOptionalDateTime(new Date(0).toISOString())).not.toContain("1970");
  });

  it("formats a valid ISO date unchanged", () => {
    const iso = "2026-06-30T12:34:00.000Z";
    expect(formatOptionalDateTime(iso)).toBe(formatDateTime(iso));
    expect(formatOptionalDateTime(iso)).toBe("2026-06-30 12:34");
  });
});

describe("isMissingTimestamp", () => {
  it("treats null, undefined, empty, and epoch as missing", () => {
    expect(isMissingTimestamp(null)).toBe(true);
    expect(isMissingTimestamp(undefined)).toBe(true);
    expect(isMissingTimestamp("")).toBe(true);
    expect(isMissingTimestamp(new Date(0).toISOString())).toBe(true);
  });

  it("accepts valid ISO timestamps", () => {
    expect(isMissingTimestamp("2026-06-30T12:00:00.000Z")).toBe(false);
  });
});
