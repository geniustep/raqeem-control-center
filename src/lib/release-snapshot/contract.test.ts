import { describe, expect, it } from "vitest";
import {
  augmentTenantReleaseSnapshot,
  mapReleaseDashboard,
  mapReleaseReadiness,
  mapSchoolSnapshot,
} from "@/lib/release-snapshot/contract";

function baseTenant() {
  return {
    code: "school",
    name: "مدرسة رقيم",
  } as Parameters<typeof augmentTenantReleaseSnapshot>[0];
}

describe("release and school snapshot contract", () => {
  it("maps release readiness without inferring latest versions", () => {
    const readiness = mapReleaseReadiness({
      status: "BEHIND_BUT_COMPATIBLE",
      compatibility_status: "COMPATIBLE",
      currency_status: "BEHIND",
      upgrade_available: true,
      partial_release: false,
      verification_state: "CONFIRMED",
      stack_verified_at: "2026-08-26 12:00:00",
      target_release: { code: "2026.08-R4", sequence: 4, state: "production" },
      components: [
        {
          component_type: "odoo",
          required: true,
          contract_role: "provider",
          target_version: "18.0.1.0.342",
          installed_version: "18.0.1.0.341",
          api_contract: "SSC-API-2026.07.001",
          trust_state: "confirmed",
        },
      ],
      reasons: ["behind_known_release:2026.08-R3"],
    });

    expect(readiness.status).toBe("BEHIND_BUT_COMPATIBLE");
    expect(readiness.upgradeAvailable).toBe(true);
    expect(readiness.targetRelease?.code).toBe("2026.08-R4");
    expect(readiness.components[0].installedVersion).toBe("18.0.1.0.341");
  });

  it("keeps NEVER_OBSERVED free from fake aggregate zeros", () => {
    const snapshot = mapSchoolSnapshot({
      observation_status: "NEVER_OBSERVED",
      observed_at: null,
      last_success_at: null,
    });

    expect(snapshot.observationStatus).toBe("NEVER_OBSERVED");
    expect(snapshot.students).toBeUndefined();
    expect(snapshot.classes).toBeUndefined();
    expect(snapshot.teachers).toBeUndefined();
    expect(snapshot.accounts).toBeUndefined();
  });

  it("preserves last successful aggregates when latest observation failed", () => {
    const snapshot = mapSchoolSnapshot({
      observation_status: "FAILED",
      last_success_at: "2026-08-25 11:00:00",
      last_failure_at: "2026-08-26 12:00:00",
      last_error_category: "CONNECTIVITY_FAILURE",
      students: {
        active_total: 217,
        by_level: [
          {
            level_code: "P1",
            level_name: "الأولى ابتدائي",
            sequence: 1,
            student_count: 49,
          },
        ],
      },
      classes: { active_total: 22 },
      teachers: { active_total: 19 },
    });

    expect(snapshot.observationStatus).toBe("FAILED");
    expect(snapshot.students?.activeTotal).toBe(217);
    expect(snapshot.classes?.activeTotal).toBe(22);
    expect(snapshot.teachers?.activeTotal).toBe(19);
  });

  it("maps release dashboard as a separate aggregate", () => {
    const dashboard = mapReleaseDashboard({
      release_dashboard: {
        tenant_count: 4,
        current_compatible_count: 2,
        behind_but_compatible_count: 1,
        incompatible_count: 0,
        partial_release_count: 0,
        ahead_unverified_count: 0,
        verify_required_count: 1,
        upgrade_available_count: 1,
        target_releases: [{ code: "2026.08-R4", tenant_count: 3 }],
      },
    });

    expect(dashboard?.tenantCount).toBe(4);
    expect(dashboard?.currentCompatibleCount).toBe(2);
    expect(dashboard?.upgradeAvailableCount).toBe(1);
    expect(dashboard?.targetReleases[0].code).toBe("2026.08-R4");
  });

  it("augments an Odoo tenant with target, readiness and snapshot", () => {
    const tenant = augmentTenantReleaseSnapshot(baseTenant(), {
      target_release: { code: "2026.08-R4", sequence: 4, state: "production" },
      release_readiness: { status: "CURRENT_COMPATIBLE" },
      school_snapshot: { observation_status: "FRESH", students: { active_total: 217 } },
    });

    expect(tenant?.targetRelease?.code).toBe("2026.08-R4");
    expect(tenant?.releaseReadiness?.status).toBe("CURRENT_COMPATIBLE");
    expect(tenant?.schoolSnapshot?.students?.activeTotal).toBe(217);
  });
});
