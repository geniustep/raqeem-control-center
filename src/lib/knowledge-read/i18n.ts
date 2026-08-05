export const knowledgeUiCopy = {
  productName: "منصة رقيم المعرفية",
  nav: {
    dashboard: "لوحة المتابعة",
    items: "المواد المعرفية",
    domains: "المجالات",
    activity: "النشاط",
    logout: "تسجيل الخروج",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
  },
  dashboard: {
    title: "لوحة المتابعة",
    subtitle: "ملخص حالة المعرفة حسب دورك الحالي",
    myDrafts: "مسوداتي",
    assignedReviews: "بانتظار المراجعة",
    approvedWithoutPackage: "معتمدة بلا حزمة",
    packagesToVerify: "حزم بانتظار التحقق",
    publishedRecently: "منشورة حديثًا",
    needsReview: "تحتاج مراجعة",
    expired: "منتهية الصلاحية",
    recentMine: "موادي الحديثة",
    assignedSection: "المراجعات المسندة",
    publishedSection: "المواد المنشورة حديثًا",
    activitySection: "آخر النشاط",
    emptySection: "لا توجد عناصر في هذا القسم.",
  },
  items: {
    title: "المواد المعرفية",
    subtitle: "تصفح المواد وفلترتها دون تعديل",
    search: "بحث",
    searchPlaceholder: "ابحث في السؤال أو العنوان…",
    filters: "الفلاتر",
    reset: "إعادة ضبط",
    apply: "تطبيق",
    question: "السؤال",
    shortAnswer: "الجواب المختصر",
    state: "الحالة",
    intent: "Intent",
    type: "النوع",
    language: "اللغة",
    domain: "المجال",
    owner: "المالك",
    reviewer: "المراجع",
    publisher: "الناشر",
    updated: "آخر تحديث",
    needsReview: "تحتاج مراجعة",
    empty: "لا توجد مواد معرفية.",
    noMatch: "لا نتائج مطابقة للفلاتر الحالية.",
    previous: "السابق",
    next: "التالي",
    pageOf: "صفحة",
  },
  detail: {
    title: "تفاصيل المادة",
    question: "السؤال",
    shortAnswer: "الجواب المختصر",
    body: "الشرح",
    domains: "المجالات",
    validity: "الصلاحية",
    reviewStatus: "حالة المراجعة",
    needsReview: "تحتاج مراجعة",
    nextReview: "موعد المراجعة التالي",
    validUntil: "صالحة حتى",
    people: "الأدوار",
    owner: "المالك",
    reviewer: "المراجع",
    approver: "المعتمد",
    publisher: "الناشر",
    latestPackage: "الحزمة الأخيرة",
    counts: "الإحصاءات",
    packages: "الحزم",
    relations: "العلاقات",
    assets: "الأصول",
    allowedActions: "الإجراءات المتاحة لاحقًا",
    actionLater: "الإجراء متاح في مرحلة لاحقة",
    technical: "معلومات تقنية",
    back: "العودة إلى القائمة",
    notFound: "المادة غير موجودة أو غير متاحة.",
  },
  domains: {
    title: "المجالات",
    subtitle: "تصنيف المجالات المعرفية (قراءة فقط)",
    code: "الرمز",
    name: "الاسم",
    description: "الوصف",
    parent: "الأب",
    active: "نشط",
    inactive: "غير نشط",
    sequence: "الترتيب",
    empty: "لا توجد مجالات.",
  },
  activity: {
    title: "النشاط",
    subtitle: "سجل النشاط",
    deferred:
      "سجل النشاط المستقل سيتوفر في مرحلة لاحقة. يمكنك متابعة آخر النشاط من لوحة المتابعة إن وُجد.",
  },
  states: {
    loading: "جارٍ التحميل…",
    error: "تعذّر تحميل البيانات.",
    sessionExpired: "انتهت الجلسة. سجّل الدخول مجددًا.",
    permissionDenied: "ليست لديك صلاحية عرض هذا المحتوى.",
    upstreamUnavailable: "خدمة المعرفة غير متاحة حاليًا.",
    rateLimited: "محاولات كثيرة. حاول لاحقًا.",
    retry: "إعادة المحاولة",
  },
  badges: {
    needsReview: "تحتاج مراجعة",
    yes: "نعم",
    no: "لا",
  },
} as const;

export function labelState(state: string): string {
  const map: Record<string, string> = {
    draft: "مسودة",
    in_review: "قيد المراجعة",
    approved: "معتمدة",
    published: "منشورة",
    deprecated: "متقادمة",
    archived: "مؤرشفة",
  };
  return map[state] ?? state;
}

export function labelIntent(intent: string): string {
  const map: Record<string, string> = {
    question: "سؤال",
    comparison: "مقارنة",
    definition: "تعريف",
    how_to: "كيف",
    troubleshooting: "استكشاف أعطال",
    decision: "قرار",
    concept: "مفهوم",
    legal: "قانوني",
    pricing: "تسعير",
    feature: "ميزة",
  };
  return map[intent] ?? intent;
}

export function labelType(type: string): string {
  const map: Record<string, string> = {
    term: "مصطلح",
    faq: "سؤال شائع",
    guide: "دليل",
  };
  return map[type] ?? type;
}

export function toneForState(
  state: string,
): "gray" | "blue" | "green" | "amber" | "red" {
  switch (state) {
    case "published":
      return "green";
    case "approved":
      return "blue";
    case "in_review":
      return "amber";
    case "deprecated":
    case "archived":
      return "gray";
    default:
      return "gray";
  }
}
