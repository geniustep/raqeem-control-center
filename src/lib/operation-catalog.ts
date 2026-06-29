/**
 * Operation catalog.
 *
 * Static definitions describing each operation the control center *will* be
 * able to run. Phase 1: every operation is dry-run only — pressing a button
 * opens a dialog describing pre-checks and expected steps, and at most creates
 * a simulated operation report. Nothing touches real servers.
 */

import type { OperationType, TenantOperation } from "@/types";

export const OPERATION_CATALOG: Record<OperationType, TenantOperation> = {
  prepare_database: {
    type: "prepare_database",
    title: "تهيئة قاعدة البيانات",
    description:
      "إنشاء قاعدة بيانات PostgreSQL ومستخدمها وضبط قواعد pg_hba للسماح لخادم التطبيق بالاتصال.",
    riskLevel: "medium",
    preconditions: [
      "خادم البيانات يعمل وPostgreSQL يستمع على الشبكة الخاصة",
      "اتصال TCP من خادم التطبيق إلى منفذ 5432 متاح",
    ],
    expectedResult:
      "قاعدة بيانات ومستخدم جاهزان، مع نجاح فحص تسجيل الدخول من خادم التطبيق.",
    manualSteps: [
      "إنشاء الدور (role) وقاعدة البيانات",
      "إضافة سطري pg_hba للمضيف المحدد فقط (scram-sha-256)",
      "إعادة تحميل إعدادات PostgreSQL",
    ],
    forbiddenActions: [
      "عدم فتح الوصول لقاعدة البيانات للعامة (0.0.0.0/0)",
      "عدم تخزين كلمة مرور المستخدم داخل مركز التحكّم",
    ],
    isDryRunOnly: true,
    advancesStage: "database_ready",
  },

  install_odoo_base: {
    type: "install_odoo_base",
    title: "تثبيت أساس Odoo",
    description: "تجهيز إعداد Odoo وتشغيل التهيئة الأساسية (base init) لقاعدة البيانات.",
    riskLevel: "medium",
    preconditions: [
      "قاعدة البيانات جاهزة ونجح فحص الاتصال",
      "ملف إعداد Odoo مُجهّز بصلاحيات صحيحة",
    ],
    expectedResult: "تهيئة Odoo الأساسية مكتملة على قاعدة بيانات المدرسة.",
    manualSteps: [
      "تجهيز ملف odoo.conf",
      "تشغيل base init مرة واحدة",
      "التحقق من إنشاء الجداول الأساسية",
    ],
    forbiddenActions: ["عدم تشغيل التهيئة على قاعدة بيانات إنتاجية موجودة"],
    isDryRunOnly: true,
    advancesStage: "odoo_base_ready",
  },

  install_smart_school_connect: {
    type: "install_smart_school_connect",
    title: "تثبيت smart_school_connect",
    description:
      "تثبيت/تحديث وحدة smart_school_connect إلى أحدث إصدار وتفعيلها على قاعدة بيانات المدرسة.",
    riskLevel: "medium",
    preconditions: [
      "أساس Odoo جاهز",
      "مستودع الوحدة محدّث إلى أحدث commit",
    ],
    expectedResult: "الوحدة مثبّتة ومفعّلة بإصدار وcommit معروفين.",
    manualSteps: [
      "سحب أحدث نسخة من الوحدة",
      "تثبيت/تحديث الوحدة على قاعدة بيانات المدرسة",
      "تسجيل الإصدار والـ commit",
    ],
    forbiddenActions: ["عدم تثبيت إصدارات تجريبية في الإنتاج دون مراجعة"],
    isDryRunOnly: true,
    advancesStage: "module_installed",
  },

  create_odoo_service: {
    type: "create_odoo_service",
    title: "إنشاء خدمة Odoo",
    description:
      "إنشاء خدمة systemd لتشغيل Odoo على منفذ محلي فقط، مع التفعيل عند الإقلاع.",
    riskLevel: "medium",
    preconditions: ["الوحدة مثبّتة", "ملف الإعداد جاهز"],
    expectedResult:
      "خدمة systemd نشطة ومفعّلة، وOdoo يستمع على 127.0.0.1 فقط (غير معرّض للعامة).",
    manualSteps: [
      "إنشاء ملف وحدة systemd",
      "تفعيل وتشغيل الخدمة",
      "التأكد أن المنفذ مرتبط بالعنوان المحلي فقط",
    ],
    forbiddenActions: [
      "عدم ربط منفذ Odoo بعنوان عام",
      "عدم تشغيل الخدمة بصلاحيات root",
    ],
    isDryRunOnly: true,
    advancesStage: "service_active",
  },

  setup_nginx_ssl: {
    type: "setup_nginx_ssl",
    title: "إعداد Nginx وSSL",
    description:
      "تجهيز موقع Nginx كوكيل عكسي إلى Odoo المحلي، وإصدار شهادة SSL (Let's Encrypt).",
    riskLevel: "medium",
    preconditions: [
      "خدمة Odoo نشطة محليًا",
      "سجل DNS لنطاق الـ API يشير إلى الخادم",
    ],
    expectedResult: "Nginx يخدم نطاق الـ API عبر HTTPS مع إعادة توجيه HTTP→HTTPS.",
    manualSteps: [
      "إنشاء site في sites-available وربطه",
      "إصدار شهادة Let's Encrypt",
      "تشغيل فحص HTTPS smoke",
    ],
    forbiddenActions: ["عدم تعطيل التحقق من الشهادة", "عدم كشف منفذ Odoo مباشرة"],
    isDryRunOnly: true,
    advancesStage: "ssl_ready",
  },

  enable_cloudflare_proxy: {
    type: "enable_cloudflare_proxy",
    title: "تفعيل Cloudflare Proxy",
    description:
      "تفعيل الوكيل (proxy) في Cloudflare لنطاق الـ API بعد نجاح فحص SSL مباشرة، مع وضع SSL = Full (strict).",
    riskLevel: "high",
    preconditions: [
      "SSL جاهز على الأصل (origin) ونجح فحص HTTPS",
      "نمط SSL في Cloudflare مضبوط على Full (strict)",
    ],
    expectedResult:
      "Proxy مفعّل، وفحص HTTPS عبر Cloudflare ناجح بدون أخطاء 5xx.",
    manualSteps: [
      "ضبط نمط SSL على Full (strict)",
      "تفعيل البرتقالة (proxied) للسجل",
      "تشغيل فحص HTTPS عبر Cloudflare",
    ],
    forbiddenActions: [
      "عدم تفعيل Proxy قبل جاهزية SSL على الأصل",
      "عدم استخدام نمط Flexible",
    ],
    isDryRunOnly: true,
    advancesStage: "proxy_ready",
  },

  run_backend_smoke: {
    type: "run_backend_smoke",
    title: "فحص الخادم الخلفي (Backend Smoke)",
    description:
      "تشغيل فحوصات صحة للخادم الخلفي: حالة HTTPS، إعادة توجيه HTTP، عدم تعرّض منفذ Odoo، نشاط Nginx والخدمة.",
    riskLevel: "low",
    preconditions: ["خدمة Odoo نشطة"],
    expectedResult: "كل فحوصات الخادم الخلفي ناجحة (200، إعادة توجيه، منفذ محلي فقط).",
    manualSteps: [
      "فحص HTTPS على نطاق الـ API",
      "فحص إعادة التوجيه HTTP→HTTPS",
      "التأكد أن منفذ Odoo غير عام",
    ],
    forbiddenActions: ["لا إجراءات معدّلة — فحص للقراءة فقط"],
    isDryRunOnly: true,
  },

  run_frontend_smoke: {
    type: "run_frontend_smoke",
    title: "فحص الواجهة (Frontend Smoke)",
    description:
      "التحقق من أن واجهة المدرسة تفتح، وأن شاشة الدخول ظاهرة، وأن محلّل الـ tenant يعمل.",
    riskLevel: "low",
    preconditions: ["Proxy مفعّل والخادم الخلفي يستجيب"],
    expectedResult: "الواجهة تفتح وتحلّل الـ tenant بشكل صحيح.",
    manualSteps: [
      "فتح نطاق الواجهة",
      "التأكد من ظهور شاشة الدخول",
      "التحقق من resolver الخاص بالـ tenant",
    ],
    forbiddenActions: ["لا إجراءات معدّلة — فحص للقراءة فقط"],
    isDryRunOnly: true,
    advancesStage: "frontend_ready",
  },

  bootstrap_school_profile: {
    type: "bootstrap_school_profile",
    title: "تهيئة ملف المدرسة (School Profile)",
    description:
      "مساعدة فريق المدرسة على إكمال البيانات الأساسية ثم وضع علامة جاهزية بيانات المدرسة.",
    riskLevel: "low",
    preconditions: ["الواجهة تفتح", "الخادم الخلفي مباشر"],
    expectedResult:
      "البيانات الأساسية للمدرسة مكتملة، وعلامة school_data_ready مرفوعة.",
    manualSteps: [
      "مراجعة البيانات الأساسية للمدرسة",
      "إكمال الحقول الناقصة من داخل واجهة المدرسة",
      "رفع علامة جاهزية بيانات المدرسة",
    ],
    forbiddenActions: ["عدم تعديل بيانات المدرسة من مركز التحكّم مباشرة"],
    isDryRunOnly: true,
    advancesStage: "school_data_ready",
  },

  open_branding_settings: {
    type: "open_branding_settings",
    title: "فتح إعدادات الهوية البصرية",
    description:
      "فتح صفحة الهوية البصرية داخل واجهة المدرسة (الشعار/الألوان/الشعار النصي). تُدار الهوية هناك وليس هنا.",
    riskLevel: "low",
    preconditions: ["واجهة المدرسة تعمل"],
    expectedResult: "فتح صفحة /admin/settings/school-branding الخاصة بالمدرسة.",
    manualSteps: [
      "فتح رابط إعدادات الهوية للمدرسة",
      "إكمال الشعار والألوان والشعار النصي من هناك",
    ],
    forbiddenActions: [
      "عدم بناء نموذج تعديل الهوية داخل مركز التحكّم",
    ],
    isDryRunOnly: true,
    isExternalLink: true,
  },
};

/** Ordered list of operations as they should appear in the UI. */
export const OPERATION_ORDER: OperationType[] = [
  "run_backend_smoke",
  "prepare_database",
  "install_odoo_base",
  "install_smart_school_connect",
  "create_odoo_service",
  "setup_nginx_ssl",
  "enable_cloudflare_proxy",
  "run_frontend_smoke",
  "bootstrap_school_profile",
  "open_branding_settings",
];

export function getOperation(type: OperationType): TenantOperation {
  return OPERATION_CATALOG[type];
}

export function listOperations(): TenantOperation[] {
  return OPERATION_ORDER.map((type) => OPERATION_CATALOG[type]);
}
