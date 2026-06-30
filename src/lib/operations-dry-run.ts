/**
 * Client-safe dry-run simulation for operations.
 *
 * Builds a read-only report describing what *would* happen. No network calls,
 * no server mutations, no secrets — used by the operations UI only.
 */

import type { OperationStatus, OperationType, RiskLevel, Tenant } from "@/types";
import { getOperation } from "@/lib/operation-catalog";
import { canRunOperation } from "@/lib/tenant-status";

export type PreflightCheckStatus = "pass" | "fail" | "warning" | "skipped";

export interface DryRunPreflightCheck {
  label: string;
  status: PreflightCheckStatus;
}

export interface DryRunReport {
  operationType: OperationType;
  operationTitle: string;
  tenantCode: string;
  tenantName: string;
  riskLevel: RiskLevel;
  operationStatus: OperationStatus;
  preflightChecks: DryRunPreflightCheck[];
  theoreticalSteps: string[];
  wouldProceed: boolean;
  summary: string;
  generatedAt: string;
  simulated: true;
}

const THEORETICAL_COMMANDS: Record<OperationType, string[]> = {
  prepare_database: [
    "إنشاء دور PostgreSQL وقاعدة بيانات (بيانات الاعتماد تُدار خارج مركز التحكم)",
    "تحديث pg_hba للمضيف الخاص فقط — scram-sha-256",
    "إعادة تحميل إعدادات PostgreSQL",
  ],
  install_odoo_base: [
    "تجهيز ملف odoo.conf (بدون تضمين أسرار في مركز التحكم)",
    "تشغيل odoo -d <db> --init base --stop-after-init (مرة واحدة)",
    "التحقق من إنشاء الجداول الأساسية",
  ],
  install_smart_school_connect: [
    "git pull في مستودع الوحدة (commit يُسجَّل في التقرير)",
    "odoo -d <db> -u smart_school_connect --stop-after-init",
    "تسجيل الإصدار والـ commit في سجل المنصة",
  ],
  create_odoo_service: [
    "إنشاء ملف systemd unit لـ Odoo",
    "systemctl enable --now odoo-<tenant>",
    "التحقق أن المنفذ مرتبط بـ 127.0.0.1 فقط",
  ],
  setup_nginx_ssl: [
    "إنشاء site في sites-available وربطه",
    "certbot --nginx -d <api-domain>",
    "nginx -t && systemctl reload nginx",
  ],
  enable_cloudflare_proxy: [
    "ضبط SSL mode = Full (strict) في Cloudflare",
    "تفعيل proxied للسجل A/AAAA",
    "فحص HTTPS عبر Cloudflare",
  ],
  run_backend_smoke: [
    "curl -I https://<api-domain> (قراءة فقط)",
    "curl -I http://<api-domain> — التحقق من إعادة التوجيه",
    "ss -lntp | grep odoo — التأكد من الربط المحلي",
  ],
  run_frontend_smoke: [
    "فتح https://<frontend-domain> (HEAD/GET للقراءة)",
    "التحقق من ظهور شاشة الدخول",
    "التحقق من resolver الخاص بالـ tenant",
  ],
  bootstrap_school_profile: [
    "مراجعة البيانات الأساسية داخل واجهة المدرسة",
    "إكمال الحقول الناقصة من قبل فريق المدرسة",
    "رفع علامة school_data_ready في سجل المنصة",
  ],
  open_branding_settings: [
    "فتح رابط /admin/settings/school-branding في واجهة المدرسة",
    "إكمال الشعار والألوان من داخل تطبيق المدرسة",
  ],
};

/** Exported for tests — theoretical command outlines (no secrets). */
export { THEORETICAL_COMMANDS };

function preflightStatusFromOperationStatus(
  status: OperationStatus,
): PreflightCheckStatus {
  switch (status) {
    case "available":
      return "pass";
    case "completed":
      return "pass";
    case "manual_required":
      return "warning";
    case "blocked":
      return "fail";
    default:
      return "skipped";
  }
}

/** Build a dry-run report for an operation against a tenant (pure, no I/O). */
export function buildDryRunReport(
  tenant: Tenant,
  operationType: OperationType,
  now: Date = new Date(),
): DryRunReport {
  const operation = getOperation(operationType);
  const operationStatus = canRunOperation(tenant, operationType);
  const preflightStatus = preflightStatusFromOperationStatus(operationStatus);

  const preflightChecks: DryRunPreflightCheck[] = [
    {
      label: `المدرسة المستهدفة: ${tenant.code}`,
      status: "pass",
    },
    ...operation.preconditions.map((label) => ({
      label,
      status: preflightStatus,
    })),
    {
      label: "لا يتم تنفيذ أي أمر فعلي — محاكاة فقط",
      status: "pass" as const,
    },
  ];

  const theoreticalSteps = THEORETICAL_COMMANDS[operationType];
  const wouldProceed =
    operationStatus === "available" || operationStatus === "manual_required";

  let summary: string;
  if (operationStatus === "completed") {
    summary =
      "العملية مكتملة مسبقًا على هذه المدرسة. التقرير للمعاينة والتحقق فقط.";
  } else if (operationStatus === "blocked") {
    summary =
      "فشلت الفحوصات المسبقة — لن يُسمح بالتنفيذ حتى تُستوفى الشروط (في مرحلة لاحقة).";
  } else if (operationStatus === "manual_required") {
    summary =
      "تتطلب هذه العملية تدخّلًا يدويًا خارج مركز التحكم. التقرير يصف الخطوات النظرية فقط.";
  } else {
    summary =
      "نجحت الفحوصات المسبقة نظريًا. لا يتم تنفيذ أي أمر فعلي في هذه المرحلة.";
  }

  return {
    operationType,
    operationTitle: operation.title,
    tenantCode: tenant.code,
    tenantName: tenant.name,
    riskLevel: operation.riskLevel,
    operationStatus,
    preflightChecks,
    theoreticalSteps,
    wouldProceed,
    summary,
    generatedAt: now.toISOString(),
    simulated: true,
  };
}

/** Returns true when text looks like it might contain a secret (for tests/guards). */
export function containsLikelySecret(text: string): boolean {
  const patterns = [
    /password\s*[:=]/i,
    /secret\s*[:=]/i,
    /api[_-]?key\s*[:=]/i,
    /BEGIN (RSA |OPENSSH )?PRIVATE KEY/i,
    /sk_live_/i,
    /postgresql:\/\/[^:]+:[^@]+@/i,
  ];
  return patterns.some((p) => p.test(text));
}
