# Raqeem Control Center

لوحة تحكّم داخلية لـ **Raqeem Super Admin / Platform Operator** لإدارة دورة حياة
المدارس المستضافة (Tenants) على منصة رقيم: البنية التحتية، قواعد البيانات، Odoo،
النطاقات، SSL، Cloudflare Proxy، فحوصات الصحة، والعمليات الآمنة.

> **المرحلة الأولى (Phase 1):** كل شيء للقراءة / المحاكاة فقط. لا SSH، لا Cloudflare
> API، لا Vercel API، لا تعديل DNS، لا تشغيل أوامر production، ولا أسرار/مفاتيح.
> القيم الحساسة تُعرض كـ `configured outside control center` أو `REDACTED`.

## التقنيات

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS** — تصميم عربي **RTL** أولاً
- **Vitest** لاختبار منطق الحالة
- React Server Components افتراضيًا؛ مكوّنات العميل فقط للتفاعل (الحوارات، النسخ).

## التشغيل محليًا

```bash
npm install        # تثبيت الاعتماديات
npm run dev        # تشغيل خادم التطوير على http://localhost:3000
```

أوامر أخرى:

```bash
npm run typecheck  # فحص الأنواع (tsc --noEmit)
npm run lint       # ESLint (next/core-web-vitals)
npm run build      # بناء الإنتاج
npm test           # تشغيل اختبارات Vitest
```

## الصفحات

| المسار              | الوصف                                                       |
| ------------------- | ----------------------------------------------------------- |
| `/`                 | لوحة المعلومات — ملخص المنصة، مدارس تحتاج انتباه، آخر العمليات |
| `/tenants`          | جدول كل المدارس وحالتها التشغيلية                            |
| `/tenants/[code]`   | تفاصيل مدرسة: دورة الحياة، الهوية، البنية، DB، Odoo، النطاقات، الصحة، العمليات، التدقيق |
| `/domains`          | كل النطاقات (API + الواجهة) مع DNS / SSL / Proxy / Smoke      |
| `/operations`       | كتالوج العمليات + سجل التشغيل                                |
| `/audit`            | سجل التدقيق الزمني                                           |
| `/settings`         | مكان المصادقة لاحقًا + القيود الأمنية                         |

## بنية المشروع

```
src/
├── app/                  # صفحات App Router (+ layout عربي RTL)
│   ├── page.tsx          # Dashboard
│   ├── tenants/          # قائمة + تفاصيل [code]
│   ├── domains/ operations/ audit/ settings/
│   └── not-found.tsx
├── components/           # مكوّنات قابلة لإعادة الاستخدام (AppShell، Sidebar، Badges، Panels، Dialog…)
├── lib/
│   ├── i18n.ts           # قاموس عربي + ترتيب مراحل دورة الحياة + مترجمات الحالات
│   ├── tenant-status.ts  # منطق الحالة المشتقّ (derive/ warnings/ gating)
│   ├── operation-catalog.ts # تعريفات العمليات وحواجزها (dry-run)
│   ├── selectors.ts      # تجميع النطاقات/العمليات/التدقيق عبر المدارس
│   └── format.ts         # تنسيق التواريخ بثبات (لا اختلاف SSR/Client)
├── data/
│   └── tenants.ts        # بيانات seed واقعية (alwah, nibras, school)
└── types/
    └── index.ts          # كل الأنواع والواجهات
```

## منطق الحالة (`src/lib/tenant-status.ts`)

- `deriveTenantOverallStatus(tenant)` — يشتقّ الحالة العامة من بيانات المدرسة.
- `getTenantWarnings(tenant)` — تنبيهات مشتقّة (هوية ناقصة، SSL، proxy…).
- `getLifecycleProgress(tenant)` — تقدّم المراحل (done/total/percent).
- `canRunOperation(tenant, op)` — أهلية تشغيل العملية (available/blocked/completed/…).
- `getNextRecommendedActions(tenant)` — الإجراءات الموصى بها تاليًا.
- `isTenantProductionReady(tenant)` — جاهزية الإنتاج الكاملة.
- `getPlatformSummary(tenants)` — مقاييس لوحة المعلومات.

أمثلة على القواعد: backend مباشر + proxy مفعّل لكن الهوية ناقصة → `live_with_warnings`؛
خدمة Odoo متوقفة → `blocked`؛ SSL غير جاهز → يحجب proxy؛ الواجهة تفتح لكن الهوية
افتراضية → **warning** وليس failure.

## القيود الأمنية

لا كلمات مرور، لا tokens، لا مفاتيح خاصة، لا تنفيذ فعلي على الخوادم. زر
`enable_cloudflare_proxy` متاح **مباشرة بعد جاهزية SSL** (وليس مؤجّلًا)، لكنه في
هذه المرحلة محاكاة فقط.

## TODOs للمرحلة القادمة

- مصادقة وصلاحيات (RBAC) لـ Platform Operator.
- ربط adapters حقيقية (قراءة فقط أولًا) لحالة الخوادم/DNS/SSL.
- تنفيذ فعلي للعمليات خلف موافقات ومراجعات (مع تدقيق كامل).
- إضافة الفرنسية والإنجليزية عبر قواميس `src/lib/i18n.ts`.
- تخزين تقارير العمليات/التدقيق في مصدر بيانات دائم.
