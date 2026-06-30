/**
 * Lightweight i18n layer.
 *
 * The default (and only active) locale is Arabic. Strings are grouped so that
 * French / English dictionaries can be added later by mirroring the same shape
 * and switching `activeLocale`.
 */

import type {
  CheckStatus,
  LifecycleStageStatus,
  OperationStatus,
  RiskLevel,
  TenantLifecycleStage,
  TenantOverallStatus,
} from "@/types";

export type Locale = "ar" | "fr" | "en";

export const activeLocale: Locale = "ar";
export const dir: "rtl" | "ltr" = activeLocale === "ar" ? "rtl" : "ltr";

/** Canonical ordered list of lifecycle stages. */
export const LIFECYCLE_ORDER: TenantLifecycleStage[] = [
  "draft",
  "dns_ready",
  "database_ready",
  "odoo_base_ready",
  "module_installed",
  "service_active",
  "ssl_ready",
  "proxy_ready",
  "frontend_ready",
  "school_data_ready",
  "live",
];

const ar = {
  app: {
    name: "مركز تحكّم رقيم",
    shortName: "رقيم",
    tagline: "إدارة دورة حياة المدارس المستضافة",
    operator: "مشغّل المنصة",
  },
  nav: {
    dashboard: "لوحة المعلومات",
    tenants: "المدارس (Tenants)",
    domains: "النطاقات",
    operations: "العمليات",
    audit: "سجل التدقيق",
    settings: "الإعدادات",
  },
  common: {
    code: "المعرّف (code)",
    schoolName: "اسم المدرسة",
    domain: "النطاق",
    frontendDomain: "نطاق الواجهة",
    apiDomain: "نطاق الـ API",
    status: "الحالة",
    overallStatus: "الحالة العامة",
    backend: "الخادم الخلفي",
    frontend: "الواجهة",
    ssl: "SSL",
    proxy: "Cloudflare Proxy",
    database: "قاعدة البيانات",
    odooService: "خدمة Odoo",
    warnings: "تنبيهات",
    details: "التفاصيل",
    open: "فتح",
    openDetails: "فتح التفاصيل",
    target: "الوجهة",
    type: "النوع",
    lastSmoke: "آخر فحص",
    actor: "المنفّذ",
    action: "الإجراء",
    result: "النتيجة",
    risk: "الخطورة",
    notes: "ملاحظات",
    date: "التاريخ",
    tenant: "المدرسة",
    none: "لا يوجد",
    noData: "لا توجد بيانات",
    copy: "نسخ",
    copied: "تم النسخ",
    yes: "نعم",
    no: "لا",
    enabled: "مفعّل",
    disabled: "غير مفعّل",
    active: "نشط",
    inactive: "غير نشط",
    reachable: "متصل",
    unreachable: "غير متصل",
    version: "الإصدار",
    commit: "Commit",
    port: "المنفذ",
    host: "المضيف",
    provider: "المزوّد",
    simulated: "محاكاة",
    dryRun: "تشغيل تجريبي (Dry-run)",
  },
  dashboard: {
    title: "لوحة المعلومات",
    subtitle: "نظرة عامة على حالة منصة رقيم والمدارس المستضافة",
    needsAttention: "مدارس تحتاج انتباه",
    allHealthy: "كل المدارس بحالة جيدة",
    recentOperations: "آخر العمليات",
    metrics: {
      totalTenants: "إجمالي المدارس",
      tenantsLive: "مدارس مباشرة (Live)",
      tenantsWithWarnings: "مدارس بتنبيهات",
      backendHealthy: "خوادم خلفية سليمة",
      proxyEnabled: "Proxy مفعّل",
      sslReady: "SSL جاهز",
      servicesActive: "خدمات نشطة",
      frontendReady: "واجهات جاهزة",
    },
  },
  tenants: {
    title: "المدارس",
    subtitle: "كل المدارس المستضافة على المنصة وحالتها التشغيلية",
    empty: "لا توجد مدارس بعد",
  },
  tenantDetail: {
    openFrontend: "فتح الواجهة",
    openApiLogin: "فتح تسجيل الدخول (API)",
    openBranding: "فتح إعدادات الهوية البصرية",
    sections: {
      lifecycle: "مراحل دورة الحياة",
      identity: "الهوية",
      infrastructure: "البنية التحتية",
      database: "قاعدة البيانات",
      odoo: "Odoo",
      domains: "النطاقات",
      health: "فحوصات الصحة",
      operations: "العمليات",
      audit: "سجل التدقيق",
    },
    identity: {
      academicYear: "السنة الدراسية",
      language: "اللغة",
      timezone: "المنطقة الزمنية",
      currency: "العملة",
      branding: "الهوية البصرية",
      brandingNote:
        "تُدار الهوية البصرية (الشعار/الألوان/الشعار النصي) داخل واجهة المدرسة نفسها، وليس من هنا.",
    },
    infrastructure: {
      appServer: "خادم التطبيق",
      appServerPrivateIp: "IP خاص (التطبيق)",
      appServerPublicIp: "IP عام (التطبيق)",
      dataServer: "خادم البيانات",
      dataServerPrivateIp: "IP خاص (البيانات)",
      dbHost: "مضيف قاعدة البيانات",
      dbName: "اسم قاعدة البيانات",
      dbUser: "مستخدم قاعدة البيانات",
      odooLocalPort: "منفذ Odoo المحلي",
      serviceName: "اسم الخدمة",
      noSecrets: "لا تُعرض كلمات المرور أو الأسرار هنا.",
    },
    database: {
      reachable: "إمكانية الاتصال",
      pgHba: "حالة pg_hba",
      tableCount: "عدد الجداول",
      schoolTables: "جداول المدرسة",
      modulesInstalled: "الوحدات مثبّتة",
      lastSmoke: "نتيجة آخر فحص اتصال",
      rules: "قواعد pg_hba",
    },
    odoo: {
      serviceName: "اسم الخدمة",
      activeEnabled: "نشطة / مفعّلة عند الإقلاع",
      localPort: "المنفذ المحلي",
      backendDomain: "نطاق الخادم الخلفي",
      localOnly: "محلي فقط (غير معرّض للعامة)",
      ssc: "smart_school_connect",
      modulesState: "حالة الوحدات",
    },
    domains: {
      dns: "DNS",
      origin: "وجهة الأصل (Origin)",
    },
  },
  operations: {
    title: "العمليات",
    subtitle: "كتالوج العمليات وسجل التشغيل — في هذه المرحلة كله محاكاة فقط",
    catalog: "كتالوج العمليات",
    runs: "سجل التشغيل",
    phaseBanner:
      "المرحلة الأولى: جميع العمليات للقراءة فقط ومحاكاة. لا يتم تنفيذ أي أمر فعلي على الخوادم.",
    dialog: {
      preChecks: "الفحوصات المسبقة",
      expected: "النتيجة المتوقعة",
      manualSteps: "الخطوات اليدوية",
      forbidden: "إجراءات ممنوعة",
      risk: "مستوى الخطورة",
      close: "إغلاق",
      simulate: "إنشاء تقرير محاكاة",
      openLink: "فتح الرابط الخارجي",
      dryRunOnly: "هذه العملية للتشغيل التجريبي فقط في المرحلة الحالية.",
      simulatedDone: "تم إنشاء تقرير محاكاة (لم يُنفَّذ أي إجراء فعلي).",
    },
  },
  audit: {
    title: "سجل التدقيق",
    subtitle: "سجل زمني لكل تقرير مرحلة وعملية على المنصة",
    empty: "لا توجد سجلات بعد",
  },
  auth: {
    loginTitle: "تسجيل الدخول",
    loginSubtitle: "وصول مشغّل المنصة إلى مركز التحكّم",
    loginButton: "دخول",
    loginError: "بيانات الدخول غير صحيحة. تحقّق من المعرّف وكلمة المرور ثم أعد المحاولة.",
    loginFooter: "جلسة آمنة عبر cookie HttpOnly — لا تُخزَّن الأسرار في المتصفّح.",
    usernameLabel: "اسم المستخدم",
    passwordLabel: "كلمة المرور",
    logout: "تسجيل الخروج",
    enabledNote:
      "المصادقة مفعّلة. الوصول إلى صفحات مركز التحكّم يتطلّب تسجيل دخول مشغّل المنصّة.",
  },
  settings: {
    title: "الإعدادات",
    subtitle: "إعدادات مركز التحكّم — مصدر البيانات والمصادقة",
    authPlaceholder:
      "المصادقة مفعّلة عبر cookie موقّعة server-side. بيانات الدخول تُضبط في متغيرات Vercel فقط.",
    securityTitle: "القيود الأمنية للمرحلة الأولى",
    securityNote:
      "لا أسرار، لا كلمات مرور، لا مفاتيح خاصة. كل العمليات للقراءة/المحاكاة فقط دون تنفيذ فعلي على الخوادم.",
  },
  status: {
    overall: {
      draft: "مسودّة",
      provisioning: "قيد التهيئة",
      live: "مباشر",
      live_with_warnings: "مباشر مع تنبيهات",
      blocked: "محظور",
      maintenance: "صيانة",
    } satisfies Record<TenantOverallStatus, string>,
    check: {
      passed: "ناجح",
      warning: "تنبيه",
      failed: "فشل",
      pending: "قيد الانتظار",
      unknown: "غير معروف",
    } satisfies Record<CheckStatus, string>,
    lifecycle: {
      done: "مكتمل",
      current: "حالي",
      warning: "تنبيه",
      blocked: "محظور",
      pending: "قيد الانتظار",
    } satisfies Record<LifecycleStageStatus, string>,
    operation: {
      available: "متاح",
      blocked: "محظور",
      completed: "مكتمل",
      manual_required: "يتطلب تدخّلًا يدويًا",
      disabled: "معطّل",
    } satisfies Record<OperationStatus, string>,
    risk: {
      low: "منخفضة",
      medium: "متوسطة",
      high: "عالية",
    } satisfies Record<RiskLevel, string>,
  },
  lifecycleStage: {
    draft: "مسودّة",
    dns_ready: "DNS جاهز",
    database_ready: "قاعدة البيانات جاهزة",
    odoo_base_ready: "أساس Odoo جاهز",
    module_installed: "الوحدة مثبّتة",
    service_active: "الخدمة نشطة",
    ssl_ready: "SSL جاهز",
    proxy_ready: "Proxy جاهز",
    frontend_ready: "الواجهة جاهزة",
    school_data_ready: "بيانات المدرسة جاهزة",
    live: "مباشر",
  } satisfies Record<TenantLifecycleStage, string>,
};

export type Dictionary = typeof ar;

const dictionaries: Record<Locale, Dictionary> = {
  ar,
  // Placeholders for future locales — fall back to Arabic until translated.
  fr: ar,
  en: ar,
};

export const t: Dictionary = dictionaries[activeLocale];

// Convenience translators for enum-like values --------------------------------

export const tOverall = (s: TenantOverallStatus): string => t.status.overall[s];
export const tCheck = (s: CheckStatus): string => t.status.check[s];
export const tLifecycleStatus = (s: LifecycleStageStatus): string =>
  t.status.lifecycle[s];
export const tOperationStatus = (s: OperationStatus): string =>
  t.status.operation[s];
export const tRisk = (s: RiskLevel): string => t.status.risk[s];
export const tStage = (s: TenantLifecycleStage): string => t.lifecycleStage[s];
