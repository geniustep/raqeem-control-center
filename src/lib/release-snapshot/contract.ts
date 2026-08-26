import type { Tenant } from "@/types";
import type {
  ReleaseCompatibilityStatus,
  ReleaseCurrencyStatus,
  ReleaseDashboard,
  ReleaseReadiness,
  ReleaseReadinessComponent,
  ReleaseReadinessStatus,
  ReleaseSnapshotTenantFields,
  ReleaseVerificationState,
  SchoolSnapshot,
  SchoolSnapshotLevel,
  SchoolSnapshotObservationStatus,
  TargetRelease,
} from "@/lib/release-snapshot/types";

type JsonRecord = Record<string, unknown>;
type TenantWithReleaseSnapshot = Tenant & ReleaseSnapshotTenantFields;

const RELEASE_STATUSES = new Set<ReleaseReadinessStatus>([
  "CURRENT_COMPATIBLE",
  "BEHIND_BUT_COMPATIBLE",
  "INCOMPATIBLE",
  "PARTIAL_RELEASE",
  "AHEAD_UNVERIFIED",
  "VERIFY_REQUIRED",
]);
const COMPAT_STATUSES = new Set<ReleaseCompatibilityStatus>([
  "COMPATIBLE",
  "INCOMPATIBLE",
  "VERIFY_REQUIRED",
]);
const CURRENCY_STATUSES = new Set<ReleaseCurrencyStatus>([
  "CURRENT",
  "BEHIND",
  "PARTIAL",
  "AHEAD_UNVERIFIED",
  "VERIFY_REQUIRED",
]);
const VERIFY_STATES = new Set<ReleaseVerificationState>([
  "CONFIRMED",
  "LAST_CONFIRMED",
  "VERIFY_REQUIRED",
]);
const SNAPSHOT_STATUSES = new Set<SchoolSnapshotObservationStatus>([
  "FRESH",
  "STALE",
  "FAILED",
  "NEVER_OBSERVED",
]);

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function str(record: JsonRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function num(record: JsonRecord, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function bool(record: JsonRecord, key: string): boolean {
  return record[key] === true;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function emptyReleaseReadiness(reason = "no_target_release"): ReleaseReadiness {
  return {
    status: "VERIFY_REQUIRED",
    compatibilityStatus: "VERIFY_REQUIRED",
    currencyStatus: "VERIFY_REQUIRED",
    upgradeAvailable: false,
    partialRelease: false,
    verificationState: "VERIFY_REQUIRED",
    stackVerifiedAt: null,
    targetRelease: null,
    components: [],
    reasons: [reason],
  };
}

export function neverObservedSnapshot(): SchoolSnapshot {
  return {
    observationStatus: "NEVER_OBSERVED",
    observedAt: null,
    generatedAt: null,
    schemaVersion: null,
    lastRefreshAttemptAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastErrorCategory: null,
  };
}

export function mapTargetRelease(raw: unknown): TargetRelease | null {
  const record = asRecord(raw);
  const code = str(record, "code");
  if (!code) return null;
  return {
    code,
    sequence: num(record, "sequence"),
    state: str(record, "state"),
  };
}

function mapReleaseComponent(raw: unknown): ReleaseReadinessComponent | null {
  const record = asRecord(raw);
  const componentType = str(record, "component_type");
  if (!componentType) return null;
  return {
    componentType,
    required: record.required !== false,
    contractRole: str(record, "contract_role") ?? "none",
    targetVersion: str(record, "target_version"),
    targetCommitSha: str(record, "target_commit_sha"),
    targetApiContract: str(record, "target_api_contract"),
    installedVersion: str(record, "installed_version"),
    installedCommitSha: str(record, "installed_commit_sha"),
    apiContract: str(record, "api_contract"),
    observedAt: str(record, "observed_at"),
    observationSource: str(record, "observation_source"),
    trustState: str(record, "trust_state"),
    identifiedReleaseCode: str(record, "identified_release_code"),
    identifiedReleaseSequence: num(record, "identified_release_sequence"),
    identification: str(record, "identification"),
  };
}

export function mapReleaseReadiness(raw: unknown): ReleaseReadiness {
  const record = asRecord(raw);
  const statusRaw = str(record, "status") as ReleaseReadinessStatus | null;
  const compatibilityRaw = str(
    record,
    "compatibility_status",
  ) as ReleaseCompatibilityStatus | null;
  const currencyRaw = str(record, "currency_status") as ReleaseCurrencyStatus | null;
  const verificationRaw = str(
    record,
    "verification_state",
  ) as ReleaseVerificationState | null;

  if (Object.keys(record).length === 0) return emptyReleaseReadiness();

  return {
    status: statusRaw && RELEASE_STATUSES.has(statusRaw) ? statusRaw : "VERIFY_REQUIRED",
    compatibilityStatus:
      compatibilityRaw && COMPAT_STATUSES.has(compatibilityRaw)
        ? compatibilityRaw
        : "VERIFY_REQUIRED",
    currencyStatus:
      currencyRaw && CURRENCY_STATUSES.has(currencyRaw)
        ? currencyRaw
        : "VERIFY_REQUIRED",
    upgradeAvailable: bool(record, "upgrade_available"),
    partialRelease: bool(record, "partial_release"),
    verificationState:
      verificationRaw && VERIFY_STATES.has(verificationRaw)
        ? verificationRaw
        : "VERIFY_REQUIRED",
    stackVerifiedAt: str(record, "stack_verified_at"),
    targetRelease: mapTargetRelease(record.target_release),
    components: Array.isArray(record.components)
      ? record.components
          .map(mapReleaseComponent)
          .filter((item): item is ReleaseReadinessComponent => item !== null)
      : [],
    reasons: strings(record.reasons),
  };
}

function mapLevels(raw: unknown): SchoolSnapshotLevel[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const record = asRecord(item);
    const levelCode = str(record, "level_code");
    const levelName = str(record, "level_name");
    const studentCount = num(record, "student_count");
    if (!levelCode || !levelName || studentCount === null) return [];
    return [
      {
        levelCode,
        levelName,
        sequence: num(record, "sequence"),
        studentCount,
      },
    ];
  });
}

export function mapSchoolSnapshot(raw: unknown): SchoolSnapshot {
  const record = asRecord(raw);
  if (Object.keys(record).length === 0) return neverObservedSnapshot();

  const statusRaw = str(
    record,
    "observation_status",
  ) as SchoolSnapshotObservationStatus | null;
  const snapshot: SchoolSnapshot = {
    observationStatus:
      statusRaw && SNAPSHOT_STATUSES.has(statusRaw) ? statusRaw : "NEVER_OBSERVED",
    observedAt: str(record, "observed_at"),
    generatedAt: str(record, "generated_at"),
    schemaVersion: str(record, "schema_version"),
    lastRefreshAttemptAt: str(record, "last_refresh_attempt_at"),
    lastSuccessAt: str(record, "last_success_at"),
    lastFailureAt: str(record, "last_failure_at"),
    lastErrorCategory: str(record, "last_error_category"),
  };

  const school = asRecord(record.school);
  if (Object.keys(school).length > 0) {
    snapshot.school = {
      code: str(school, "code"),
      name: str(school, "name"),
      tenantCode: str(school, "tenant_code"),
    };
  }

  const year = asRecord(asRecord(record.academic).year);
  if (Object.keys(year).length > 0) {
    snapshot.academic = {
      year: {
        code: str(year, "code"),
        name: str(year, "name"),
        isCurrent: bool(year, "is_current"),
      },
    };
  }

  const students = asRecord(record.students);
  const studentTotal = num(students, "active_total");
  if (studentTotal !== null) {
    snapshot.students = {
      activeTotal: studentTotal,
      byLevel: mapLevels(students.by_level),
    };
  }

  const classes = asRecord(record.classes);
  const classesTotal = num(classes, "active_total");
  if (classesTotal !== null) snapshot.classes = { activeTotal: classesTotal };

  const teachers = asRecord(record.teachers);
  const teachersTotal = num(teachers, "active_total");
  if (teachersTotal !== null) snapshot.teachers = { activeTotal: teachersTotal };

  const accounts = asRecord(record.accounts);
  const totalUsers = num(accounts, "total_users");
  const parentAccounts = num(accounts, "parent_accounts");
  const parentAccountsActive = num(accounts, "parent_accounts_active");
  const parentNoAccount = num(accounts, "parent_no_account");
  const parentNeverLoggedIn = num(accounts, "parent_never_logged_in");
  const studentAccounts = num(accounts, "student_accounts");
  const staffAccounts = num(accounts, "staff_accounts");
  const staffAccountsActive = num(accounts, "staff_accounts_active");
  const staffNeverLoggedIn = num(accounts, "staff_never_logged_in");
  if (
    [
      totalUsers,
      parentAccounts,
      parentAccountsActive,
      parentNoAccount,
      parentNeverLoggedIn,
      studentAccounts,
      staffAccounts,
      staffAccountsActive,
      staffNeverLoggedIn,
    ].every((value) => value !== null)
  ) {
    snapshot.accounts = {
      totalUsers: totalUsers!,
      parentAccounts: parentAccounts!,
      parentAccountsActive: parentAccountsActive!,
      parentNoAccount: parentNoAccount!,
      parentNeverLoggedIn: parentNeverLoggedIn!,
      studentAccounts: studentAccounts!,
      staffAccounts: staffAccounts!,
      staffAccountsActive: staffAccountsActive!,
      staffNeverLoggedIn: staffNeverLoggedIn!,
    };
  }

  const platform = asRecord(record.platform);
  if (Object.keys(platform).length > 0) {
    snapshot.platform = {
      odooVersion: str(platform, "odoo_version"),
      moduleVersionInstalled: str(platform, "module_version_installed"),
      moduleVersionSource: str(platform, "module_version_source"),
      moduleCommit: str(platform, "module_commit"),
      schoolApiContract: str(platform, "school_api_contract"),
      snapshotSchema: str(platform, "snapshot_schema"),
    };
  }

  return snapshot;
}

export function mapReleaseDashboard(raw: unknown): ReleaseDashboard | null {
  const root = asRecord(raw);
  const record = asRecord(root.release_dashboard ?? root.releaseDashboard);
  if (Object.keys(record).length === 0) return null;
  const targets = Array.isArray(record.target_releases) ? record.target_releases : [];
  return {
    tenantCount: num(record, "tenant_count") ?? 0,
    currentCompatibleCount: num(record, "current_compatible_count") ?? 0,
    behindButCompatibleCount: num(record, "behind_but_compatible_count") ?? 0,
    incompatibleCount: num(record, "incompatible_count") ?? 0,
    partialReleaseCount: num(record, "partial_release_count") ?? 0,
    aheadUnverifiedCount: num(record, "ahead_unverified_count") ?? 0,
    verifyRequiredCount: num(record, "verify_required_count") ?? 0,
    upgradeAvailableCount: num(record, "upgrade_available_count") ?? 0,
    targetReleases: targets.map((item) => {
      const target = asRecord(item);
      return {
        code: str(target, "code"),
        tenantCount: num(target, "tenant_count") ?? 0,
      };
    }),
  };
}

function rawTenantArray(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  const root = asRecord(body);
  return Array.isArray(root.tenants) ? root.tenants : [];
}

export function augmentTenantReleaseSnapshot(
  tenant: Tenant | null,
  raw: unknown,
): TenantWithReleaseSnapshot | null {
  if (!tenant) return null;
  const record = asRecord(raw);
  return {
    ...tenant,
    targetRelease: mapTargetRelease(record.target_release ?? record.targetRelease),
    releaseReadiness: mapReleaseReadiness(
      record.release_readiness ?? record.releaseReadiness,
    ),
    schoolSnapshot: mapSchoolSnapshot(record.school_snapshot ?? record.schoolSnapshot),
  };
}

export function augmentTenantsReleaseSnapshot(
  body: unknown,
  tenants: Tenant[],
): Tenant[] {
  const rawByCode = new Map<string, unknown>();
  for (const item of rawTenantArray(body)) {
    const record = asRecord(item);
    const code = str(record, "code") ?? str(record, "tenant_code");
    if (code) rawByCode.set(code, item);
  }
  return tenants.map(
    (tenant) => augmentTenantReleaseSnapshot(tenant, rawByCode.get(tenant.code)) ?? tenant,
  );
}

export function getTenantReleaseSnapshot(tenant: Tenant): ReleaseSnapshotTenantFields {
  const extended = tenant as Tenant & Partial<ReleaseSnapshotTenantFields>;
  return {
    targetRelease: extended.targetRelease ?? null,
    releaseReadiness: extended.releaseReadiness ?? emptyReleaseReadiness(),
    schoolSnapshot: extended.schoolSnapshot ?? neverObservedSnapshot(),
  };
}

export function buildReleaseDashboardFromTenants(tenants: Tenant[]): ReleaseDashboard {
  const counts: ReleaseDashboard = {
    tenantCount: tenants.length,
    currentCompatibleCount: 0,
    behindButCompatibleCount: 0,
    incompatibleCount: 0,
    partialReleaseCount: 0,
    aheadUnverifiedCount: 0,
    verifyRequiredCount: 0,
    upgradeAvailableCount: 0,
    targetReleases: [],
  };
  const targets = new Map<string | null, number>();
  for (const tenant of tenants) {
    const { releaseReadiness, targetRelease } = getTenantReleaseSnapshot(tenant);
    if (releaseReadiness.status === "CURRENT_COMPATIBLE") counts.currentCompatibleCount += 1;
    else if (releaseReadiness.status === "BEHIND_BUT_COMPATIBLE") counts.behindButCompatibleCount += 1;
    else if (releaseReadiness.status === "INCOMPATIBLE") counts.incompatibleCount += 1;
    else if (releaseReadiness.status === "PARTIAL_RELEASE") counts.partialReleaseCount += 1;
    else if (releaseReadiness.status === "AHEAD_UNVERIFIED") counts.aheadUnverifiedCount += 1;
    else counts.verifyRequiredCount += 1;
    if (releaseReadiness.upgradeAvailable) counts.upgradeAvailableCount += 1;
    const target = targetRelease?.code ?? null;
    targets.set(target, (targets.get(target) ?? 0) + 1);
  }
  counts.targetReleases = [...targets.entries()].map(([code, tenantCount]) => ({
    code,
    tenantCount,
  }));
  return counts;
}
