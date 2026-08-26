export type ReleaseReadinessStatus =
  | "CURRENT_COMPATIBLE"
  | "BEHIND_BUT_COMPATIBLE"
  | "INCOMPATIBLE"
  | "PARTIAL_RELEASE"
  | "AHEAD_UNVERIFIED"
  | "VERIFY_REQUIRED";

export type ReleaseCompatibilityStatus =
  | "COMPATIBLE"
  | "INCOMPATIBLE"
  | "VERIFY_REQUIRED";

export type ReleaseCurrencyStatus =
  | "CURRENT"
  | "BEHIND"
  | "PARTIAL"
  | "AHEAD_UNVERIFIED"
  | "VERIFY_REQUIRED";

export type ReleaseVerificationState =
  | "CONFIRMED"
  | "LAST_CONFIRMED"
  | "VERIFY_REQUIRED";

export interface TargetRelease {
  code: string;
  sequence: number | null;
  state: string | null;
}

export interface ReleaseReadinessComponent {
  componentType: string;
  required: boolean;
  contractRole: string;
  targetVersion: string | null;
  targetCommitSha: string | null;
  targetApiContract: string | null;
  installedVersion: string | null;
  installedCommitSha: string | null;
  apiContract: string | null;
  observedAt: string | null;
  observationSource: string | null;
  trustState: string | null;
  identifiedReleaseCode: string | null;
  identifiedReleaseSequence: number | null;
  identification: string | null;
}

export interface ReleaseReadiness {
  status: ReleaseReadinessStatus;
  compatibilityStatus: ReleaseCompatibilityStatus;
  currencyStatus: ReleaseCurrencyStatus;
  upgradeAvailable: boolean;
  partialRelease: boolean;
  verificationState: ReleaseVerificationState;
  stackVerifiedAt: string | null;
  targetRelease: TargetRelease | null;
  components: ReleaseReadinessComponent[];
  reasons: string[];
}

export interface ReleaseDashboardTarget {
  code: string | null;
  tenantCount: number;
}

export interface ReleaseDashboard {
  tenantCount: number;
  currentCompatibleCount: number;
  behindButCompatibleCount: number;
  incompatibleCount: number;
  partialReleaseCount: number;
  aheadUnverifiedCount: number;
  verifyRequiredCount: number;
  upgradeAvailableCount: number;
  targetReleases: ReleaseDashboardTarget[];
}

export type SchoolSnapshotObservationStatus =
  | "FRESH"
  | "STALE"
  | "FAILED"
  | "NEVER_OBSERVED";

export interface SchoolSnapshotLevel {
  levelCode: string;
  levelName: string;
  sequence: number | null;
  studentCount: number;
}

export interface SchoolSnapshotAccounts {
  totalUsers: number;
  parentAccounts: number;
  parentAccountsActive: number;
  parentNoAccount: number;
  parentNeverLoggedIn: number;
  studentAccounts: number;
  staffAccounts: number;
  staffAccountsActive: number;
  staffNeverLoggedIn: number;
}

export interface SchoolSnapshot {
  observationStatus: SchoolSnapshotObservationStatus;
  observedAt: string | null;
  generatedAt: string | null;
  schemaVersion: string | null;
  lastRefreshAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastErrorCategory: string | null;
  school?: {
    code: string | null;
    name: string | null;
    tenantCode: string | null;
  };
  academic?: {
    year: {
      code: string | null;
      name: string | null;
      isCurrent: boolean;
    };
  };
  students?: {
    activeTotal: number;
    byLevel: SchoolSnapshotLevel[];
  };
  classes?: { activeTotal: number };
  teachers?: { activeTotal: number };
  accounts?: SchoolSnapshotAccounts;
  platform?: {
    odooVersion: string | null;
    moduleVersionInstalled: string | null;
    moduleVersionSource: string | null;
    moduleCommit: string | null;
    schoolApiContract: string | null;
    snapshotSchema: string | null;
  };
}

export interface ReleaseSnapshotTenantFields {
  targetRelease: TargetRelease | null;
  releaseReadiness: ReleaseReadiness;
  schoolSnapshot: SchoolSnapshot;
}
