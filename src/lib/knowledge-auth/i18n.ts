/** Arabic copy for Knowledge auth surfaces (isolated from Platform i18n). */
export const knowledgeAuthCopy = {
  productName: "منصة رقيم المعرفية",
  loginSubtitle: "تسجيل الدخول بحساب رقيم المعرفي",
  loginTitle: "تسجيل الدخول",
  emailLabel: "البريد الإلكتروني",
  passwordLabel: "كلمة المرور",
  totpLabel: "رمز التحقق",
  totpHint: "أدخل رمز التحقق إن كان مطلوبًا لحسابك.",
  submit: "دخول",
  submitting: "جارٍ التحقق…",
  footer: "المصادقة تتم عبر خادم رقيم. لا تُخزَّن كلمة المرور في المتصفح.",
  genericError: "تعذّر تسجيل الدخول. تحقق من البيانات وحاول مجددًا.",
  shellPlaceholder:
    "لوحة المعلومات وقائمة المعرفة ستصلان في المرحلة التالية.",
  rolesLabel: "الأدوار",
  mfaLabel: "التحقق بخطوتين",
  mfaEnabled: "مفعّل",
  mfaDisabled: "غير مفعّل",
  logout: "تسجيل الخروج",
  mfaTitle: "يلزم تفعيل التحقق بخطوتين",
  mfaBody:
    "تم التحقق من هويتك، لكن الوصول إلى المنصة المعرفية يتطلب تفعيل التحقق بخطوتين على حسابك في Odoo أولًا.",
  mfaInstructions:
    "أكمل إعداد MFA عبر المسار المعتمد في Odoo، ثم اضغط «إعادة التحقق» هنا. هذه الصفحة لا تُنشئ أسرار TOTP ولا تعرض رمز QR.",
  mfaRetry: "إعادة التحقق",
  mfaRetrying: "جارٍ إعادة التحقق…",
  signedInAs: "المستخدم",
} as const;
