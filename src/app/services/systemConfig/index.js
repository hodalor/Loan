const SystemConfig = require("../../models/systemConfig");

const SUPPORTED_CHANNELS = ["zynlepay", "nsano", "paystack", "bridge"];
const DEFAULT_LOAN_TERMS = [
  {
    key: "1-day",
    label: "1 Day",
    days: 1,
    interestRate: 6,
    serviceFeeRate: 5,
    processingFeeRate: 6,
    commitmentFeeRate: 4,
    isEnabled: true,
    sortOrder: 0,
  },
  {
    key: "7-days",
    label: "7 Days",
    days: 7,
    interestRate: 1,
    serviceFeeRate: 10,
    processingFeeRate: 5,
    commitmentFeeRate: 4,
    isEnabled: true,
    sortOrder: 1,
  },
  {
    key: "14-days",
    label: "14 Days",
    days: 14,
    interestRate: 2,
    serviceFeeRate: 10,
    processingFeeRate: 10,
    commitmentFeeRate: 4,
    isEnabled: true,
    sortOrder: 2,
  },
  {
    key: "30-days",
    label: "30 Days",
    days: 30,
    interestRate: 3,
    serviceFeeRate: 10,
    processingFeeRate: 12,
    commitmentFeeRate: 4,
    isEnabled: true,
    sortOrder: 3,
  },
];
const DEFAULT_LOAN_LEVELS = Array.from({ length: 10 }, (_, index) => {
  const level = index + 1;

  return {
    level,
    label: level === 1 ? "Starter Level" : `Level ${level}`,
    minAmount: level * 50,
    maxAmount: level * 100,
    isEnabled: true,
  };
});
const DEFAULT_EXTENSION_PERIODS = [
  {
    key: "7-day-extension",
    label: "7 Days",
    days: 7,
    feeRate: 10,
    isEnabled: true,
  },
  {
    key: "14-day-extension",
    label: "14 Days",
    days: 14,
    feeRate: 18,
    isEnabled: true,
  },
];
const DEFAULT_REPAYMENT_OPTIONS = [
  {
    key: "mobile-money",
    label: "Mobile Money",
    isEnabled: true,
  },
  {
    key: "card",
    label: "Card",
    isEnabled: true,
  },
];
const DEFAULT_COUNTRIES = [
  {
    code: "ZM",
    name: "Zambia",
    locale: "en-ZM",
    timeZone: "Africa/Lusaka",
    currencyCode: "ZMW",
    currencySymbol: "K",
    dialCode: "+260",
    phoneExample: "0970000000",
    isEnabled: true,
    paymentProviders: [
      {
        key: "paystack",
        label: "Paystack",
        type: "gateway",
        channel: "paystack",
        isEnabled: true,
      },
      {
        key: "manual-bank",
        label: "Manual Bank",
        type: "bank",
        channel: "manual",
        isEnabled: true,
      },
    ],
    mobileMoneyNetworks: [
      { key: "airtel-money-zm", label: "Airtel Money", type: "mobile-money", isEnabled: true },
      { key: "mtn-money-zm", label: "MTN Money", type: "mobile-money", isEnabled: true },
      { key: "zamtel-money-zm", label: "Zamtel Kwacha", type: "mobile-money", isEnabled: true },
    ],
    cardProviders: [
      { key: "visa", label: "Visa", type: "card", channel: "paystack", isEnabled: true },
      { key: "mastercard", label: "Mastercard", type: "card", channel: "paystack", isEnabled: true },
    ],
  },
  {
    code: "GH",
    name: "Ghana",
    locale: "en-GH",
    timeZone: "Africa/Accra",
    currencyCode: "GHS",
    currencySymbol: "GHS",
    dialCode: "+233",
    phoneExample: "0240000000",
    isEnabled: true,
    paymentProviders: [
      {
        key: "paystack",
        label: "Paystack",
        type: "gateway",
        channel: "paystack",
        isEnabled: true,
      },
      {
        key: "zynlepay",
        label: "ZynlePay",
        type: "gateway",
        channel: "zynlepay",
        isEnabled: true,
      },
      {
        key: "nsano",
        label: "Nsano",
        type: "gateway",
        channel: "nsano",
        isEnabled: true,
      },
      {
        key: "bridge",
        label: "Bridge",
        type: "gateway",
        channel: "bridge",
        isEnabled: true,
      },
    ],
    mobileMoneyNetworks: [
      { key: "mtn-gh", label: "MTN MoMo", type: "mobile-money", isEnabled: true },
      { key: "telecel-gh", label: "Telecel Cash", type: "mobile-money", isEnabled: true },
      { key: "airteltigo-gh", label: "AirtelTigo Money", type: "mobile-money", isEnabled: true },
    ],
    cardProviders: [
      { key: "visa", label: "Visa", type: "card", channel: "paystack", isEnabled: true },
      { key: "mastercard", label: "Mastercard", type: "card", channel: "paystack", isEnabled: true },
    ],
  },
  {
    code: "NG",
    name: "Nigeria",
    locale: "en-NG",
    timeZone: "Africa/Lagos",
    currencyCode: "NGN",
    currencySymbol: "NGN",
    dialCode: "+234",
    phoneExample: "08000000000",
    isEnabled: true,
    paymentProviders: [
      {
        key: "paystack",
        label: "Paystack",
        type: "gateway",
        channel: "paystack",
        isEnabled: true,
      },
      {
        key: "bank-transfer-ng",
        label: "Bank Transfer",
        type: "bank",
        channel: "manual",
        isEnabled: true,
      },
    ],
    mobileMoneyNetworks: [],
    cardProviders: [
      { key: "visa", label: "Visa", type: "card", channel: "paystack", isEnabled: true },
      { key: "mastercard", label: "Mastercard", type: "card", channel: "paystack", isEnabled: true },
      { key: "verve", label: "Verve", type: "card", channel: "paystack", isEnabled: true },
    ],
  },
];
const DEFAULT_PORTAL_CONTENT = {
  appName: "Pathway Loans",
  logoUrl: "",
  tagline: "Fast customer login, application tracking, and identity verification.",
  footerText: "All rights reserved.",
  footerVersion: "1.5.0",
  faqs: [
    "Loan approval is subject to review by the admin team.",
    "You cannot apply for a new loan while another one is active.",
    "Successful repayment helps unlock the next user level.",
    "Contact support if your payout details are missing or outdated.",
  ],
  repaymentTutorials: [
    "Complete your profile and submit identity verification.",
    "Open Apply and choose the available amount and loan term.",
    "Review the summary, accept the terms, and submit the request.",
    "Track approval and repayment progress from Records.",
  ],
  supportPhone: "+260 000 000 000",
  supportEmail: "customer@cedilending.com",
  supportWhatsapp: "+260 000 000 000",
};
const DEFAULT_AUTH_VERIFICATION = {
  otpMode: "demo",
  firebaseWebConfig: {
    apiKey: "AIzaSyC8jJstpNICe6CFWODCZvZ7gU7NHgQIZyo",
    authDomain: "loan-d61b8.firebaseapp.com",
    projectId: "loan-d61b8",
    storageBucket: "loan-d61b8.firebasestorage.app",
    messagingSenderId: "684116041224",
    appId: "1:684116041224:web:b399f294c6d1f3b82e7bbd",
  },
};
const DEFAULT_CONFIG = {
  key: "default",
  disbursementMode: "manual",
  autoRepaymentPosting: false,
  requireGatewayApprovalCheck: true,
  gatewayProvider: "zynlepay",
  collectionGateway: "zynlepay",
  activeChannel: "zynlepay",
  disbursementGateway: "zynlepay",
  implementedChannels: ["zynlepay", "nsano", "paystack", "bridge"],
  gatewayAccountName: "Pathway Main Float",
  callbackUrl: "",
  settlementAccount: "",
  apiKey: "",
  apiSecret: "",
  notes: "",
  loanTerms: DEFAULT_LOAN_TERMS,
  loanLevels: DEFAULT_LOAN_LEVELS,
  extensionPeriods: DEFAULT_EXTENSION_PERIODS,
  overduePenaltyRate: 2,
  repaymentOptions: DEFAULT_REPAYMENT_OPTIONS,
  activeCountryCode: "ZM",
  countries: DEFAULT_COUNTRIES,
  allowPartialRepayment: true,
  portalContent: DEFAULT_PORTAL_CONTENT,
  authVerification: DEFAULT_AUTH_VERIFICATION,
};

const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toPositiveNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const sanitizeLoanTerms = (terms = []) => {
  const normalizedTerms = (Array.isArray(terms) ? terms : [])
    .map((term, index) => {
      const label = String(term?.label || "").trim();
      const days = Math.max(1, Math.round(toPositiveNumber(term?.days, 0)));

      if (!label || !days) {
        return null;
      }

      return {
        key: slugify(term?.key || `${label}-${days}-days`) || `term-${index + 1}`,
        label,
        days,
        interestRate: toPositiveNumber(term?.interestRate, 0),
        serviceFeeRate: toPositiveNumber(term?.serviceFeeRate, 0),
        processingFeeRate: toPositiveNumber(term?.processingFeeRate, 0),
        commitmentFeeRate: toPositiveNumber(term?.commitmentFeeRate, 0),
        isEnabled: Boolean(term?.isEnabled),
        sortOrder: Math.max(0, Math.round(toPositiveNumber(term?.sortOrder, index))),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  if (normalizedTerms.length === 0) {
    return DEFAULT_LOAN_TERMS;
  }

  return normalizedTerms;
};

const sanitizeLoanLevels = (levels = []) => {
  const normalizedLevels = (Array.isArray(levels) ? levels : [])
    .map((item, index) => {
      const level = Math.max(1, Math.round(toPositiveNumber(item?.level, index + 1)));
      const minAmount = toPositiveNumber(item?.minAmount, level * 50);
      const maxAmount = Math.max(minAmount, toPositiveNumber(item?.maxAmount, level * 100));
      const label = String(item?.label || (level === 1 ? "Starter Level" : `Level ${level}`)).trim();

      return {
        level,
        label,
        minAmount,
        maxAmount,
        isEnabled: item?.isEnabled !== false,
      };
    })
    .filter((item) => item.label)
    .sort((left, right) => left.level - right.level);

  if (normalizedLevels.length === 0) {
    return DEFAULT_LOAN_LEVELS;
  }

  return normalizedLevels;
};

const sanitizeExtensionPeriods = (items = []) => {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const days = Math.max(1, Math.round(toPositiveNumber(item?.days, 0)));
      const label = String(item?.label || "").trim() || `${days} Days`;

      if (!days) return null;

      return {
        key: slugify(item?.key || `${label}-${days}-extension`) || `extension-${index + 1}`,
        label,
        days,
        feeRate: toPositiveNumber(item?.feeRate, 0),
        isEnabled: item?.isEnabled !== false,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.days - right.days);

  if (normalizedItems.length === 0) {
    return DEFAULT_EXTENSION_PERIODS;
  }

  return normalizedItems;
};

const sanitizeRepaymentOptions = (items = []) => {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      key: String(item?.key || "").trim(),
      label: String(item?.label || "").trim(),
      isEnabled: item?.isEnabled !== false,
    }))
    .filter((item) => item.key && item.label);

  return normalizedItems.length > 0 ? normalizedItems : DEFAULT_REPAYMENT_OPTIONS;
};

const sanitizeCountryProviders = (items = [], fallback = []) => {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      key: String(item?.key || "").trim(),
      label: String(item?.label || "").trim(),
      type: String(item?.type || "gateway").trim() || "gateway",
      channel: String(item?.channel || "").trim(),
      isEnabled: item?.isEnabled !== false,
    }))
    .filter((item) => item.key && item.label);

  return normalizedItems.length > 0 ? normalizedItems : fallback;
};

const sanitizeCountryNetworks = (items = [], fallback = []) => {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      key: String(item?.key || "").trim(),
      label: String(item?.label || "").trim(),
      type: String(item?.type || "mobile-money").trim() || "mobile-money",
      isEnabled: item?.isEnabled !== false,
    }))
    .filter((item) => item.key && item.label);

  return normalizedItems.length > 0 ? normalizedItems : fallback;
};

const sanitizeCountries = (items = []) => {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => {
      const code = String(item?.code || "").trim().toUpperCase();
      const name = String(item?.name || "").trim();

      if (!code || !name) return null;

      const fallbackCountry =
        DEFAULT_COUNTRIES.find((country) => country.code === code) || DEFAULT_COUNTRIES[0];

      return {
        code,
        name,
        locale: String(item?.locale || fallbackCountry.locale || "en-US").trim(),
        timeZone: String(item?.timeZone || fallbackCountry.timeZone || "UTC").trim(),
        currencyCode: String(item?.currencyCode || fallbackCountry.currencyCode || "USD").trim(),
        currencySymbol: String(
          item?.currencySymbol || fallbackCountry.currencySymbol || "$"
        ).trim(),
        dialCode: String(item?.dialCode || fallbackCountry.dialCode || "+1").trim(),
        phoneExample: String(item?.phoneExample || fallbackCountry.phoneExample || "").trim(),
        isEnabled: item?.isEnabled !== false,
        paymentProviders: sanitizeCountryProviders(
          item?.paymentProviders,
          fallbackCountry.paymentProviders || []
        ),
        mobileMoneyNetworks: sanitizeCountryNetworks(
          item?.mobileMoneyNetworks,
          fallbackCountry.mobileMoneyNetworks || []
        ),
        cardProviders: sanitizeCountryProviders(
          item?.cardProviders,
          fallbackCountry.cardProviders || []
        ),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));

  return normalizedItems.length > 0 ? normalizedItems : DEFAULT_COUNTRIES;
};

const sanitizeTextList = (items = [], fallback = []) => {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return normalizedItems.length > 0 ? normalizedItems : fallback;
};

const sanitizePortalContent = (content = {}) => ({
  appName: String(content?.appName || DEFAULT_PORTAL_CONTENT.appName).trim(),
  logoUrl: String(content?.logoUrl || DEFAULT_PORTAL_CONTENT.logoUrl).trim(),
  tagline: String(content?.tagline || DEFAULT_PORTAL_CONTENT.tagline).trim(),
  footerText: String(content?.footerText || DEFAULT_PORTAL_CONTENT.footerText).trim(),
  footerVersion: String(
    content?.footerVersion || DEFAULT_PORTAL_CONTENT.footerVersion
  ).trim(),
  faqs: sanitizeTextList(content?.faqs, DEFAULT_PORTAL_CONTENT.faqs),
  repaymentTutorials: sanitizeTextList(
    content?.repaymentTutorials,
    DEFAULT_PORTAL_CONTENT.repaymentTutorials
  ),
  supportPhone: String(content?.supportPhone || DEFAULT_PORTAL_CONTENT.supportPhone).trim(),
  supportEmail: String(content?.supportEmail || DEFAULT_PORTAL_CONTENT.supportEmail).trim(),
  supportWhatsapp: String(
    content?.supportWhatsapp || DEFAULT_PORTAL_CONTENT.supportWhatsapp
  ).trim(),
});

const sanitizeFirebaseWebConfig = (config = {}) => ({
  apiKey: String(config?.apiKey || DEFAULT_AUTH_VERIFICATION.firebaseWebConfig.apiKey).trim(),
  authDomain: String(
    config?.authDomain || DEFAULT_AUTH_VERIFICATION.firebaseWebConfig.authDomain
  ).trim(),
  projectId: String(
    config?.projectId || DEFAULT_AUTH_VERIFICATION.firebaseWebConfig.projectId
  ).trim(),
  storageBucket: String(
    config?.storageBucket || DEFAULT_AUTH_VERIFICATION.firebaseWebConfig.storageBucket
  ).trim(),
  messagingSenderId: String(
    config?.messagingSenderId ||
      DEFAULT_AUTH_VERIFICATION.firebaseWebConfig.messagingSenderId
  ).trim(),
  appId: String(config?.appId || DEFAULT_AUTH_VERIFICATION.firebaseWebConfig.appId).trim(),
});

const sanitizeAuthVerification = (config = {}) => ({
  otpMode: String(config?.otpMode || DEFAULT_AUTH_VERIFICATION.otpMode).trim() === "real"
    ? "real"
    : "demo",
  firebaseWebConfig: sanitizeFirebaseWebConfig(config?.firebaseWebConfig),
});

const sanitizeIncomingConfig = (payload = {}) => {
  const nextConfig = {
    ...DEFAULT_CONFIG,
    ...payload,
  };

  nextConfig.key = "default";
  nextConfig.disbursementMode =
    nextConfig.disbursementMode === "automatic" ? "automatic" : "manual";

  const normalizedChannels = Array.isArray(nextConfig.implementedChannels)
    ? nextConfig.implementedChannels.filter((channel) =>
        SUPPORTED_CHANNELS.includes(channel)
      )
    : DEFAULT_CONFIG.implementedChannels;

  nextConfig.implementedChannels =
    normalizedChannels.length > 0
      ? [...new Set(normalizedChannels)]
      : DEFAULT_CONFIG.implementedChannels;

  nextConfig.collectionGateway = String(
    nextConfig.collectionGateway || nextConfig.gatewayProvider || DEFAULT_CONFIG.collectionGateway
  ).trim();
  nextConfig.disbursementGateway = String(
    nextConfig.disbursementGateway || nextConfig.activeChannel || DEFAULT_CONFIG.disbursementGateway
  ).trim();

  if (!nextConfig.implementedChannels.includes(nextConfig.collectionGateway)) {
    nextConfig.collectionGateway = nextConfig.implementedChannels[0];
  }

  if (!nextConfig.implementedChannels.includes(nextConfig.disbursementGateway)) {
    nextConfig.disbursementGateway = nextConfig.collectionGateway;
  }

  nextConfig.gatewayProvider = nextConfig.collectionGateway;
  nextConfig.activeChannel = nextConfig.disbursementGateway;

  nextConfig.autoRepaymentPosting = Boolean(nextConfig.autoRepaymentPosting);
  nextConfig.requireGatewayApprovalCheck = Boolean(
    nextConfig.requireGatewayApprovalCheck
  );
  nextConfig.loanTerms = sanitizeLoanTerms(nextConfig.loanTerms);
  nextConfig.loanLevels = sanitizeLoanLevels(nextConfig.loanLevels);
  nextConfig.extensionPeriods = sanitizeExtensionPeriods(nextConfig.extensionPeriods);
  nextConfig.overduePenaltyRate = toPositiveNumber(
    nextConfig.overduePenaltyRate,
    DEFAULT_CONFIG.overduePenaltyRate
  );
  nextConfig.repaymentOptions = sanitizeRepaymentOptions(nextConfig.repaymentOptions);
  nextConfig.countries = sanitizeCountries(nextConfig.countries);
  nextConfig.activeCountryCode = String(
    nextConfig.activeCountryCode || DEFAULT_CONFIG.activeCountryCode
  )
    .trim()
    .toUpperCase();
  if (!nextConfig.countries.some((country) => country.code === nextConfig.activeCountryCode)) {
    nextConfig.activeCountryCode =
      nextConfig.countries.find((country) => country.isEnabled)?.code ||
      nextConfig.countries[0]?.code ||
      DEFAULT_CONFIG.activeCountryCode;
  }
  nextConfig.allowPartialRepayment = Boolean(nextConfig.allowPartialRepayment);
  nextConfig.portalContent = sanitizePortalContent(nextConfig.portalContent);
  nextConfig.authVerification = sanitizeAuthVerification(nextConfig.authVerification);

  return nextConfig;
};

const getSystemConfig = async () => {
  let config = await SystemConfig.findOne({ key: "default" });

  if (!config) {
    config = await SystemConfig.create(DEFAULT_CONFIG);
  }

  return sanitizeIncomingConfig(config.toObject ? config.toObject() : config);
};

const saveSystemConfig = async (payload = {}) => {
  const nextConfig = sanitizeIncomingConfig(payload);

  const updatedConfig = await SystemConfig.findOneAndUpdate(
    { key: "default" },
    { $set: nextConfig },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return sanitizeIncomingConfig(
    updatedConfig.toObject ? updatedConfig.toObject() : updatedConfig
  );
};

const getActiveCountryConfig = (systemConfig = {}) => {
  const countries = sanitizeCountries(systemConfig?.countries || DEFAULT_COUNTRIES);
  const activeCountryCode = String(
    systemConfig?.activeCountryCode || DEFAULT_CONFIG.activeCountryCode
  )
    .trim()
    .toUpperCase();

  return (
    countries.find((country) => country.code === activeCountryCode) ||
    countries.find((country) => country.isEnabled) ||
    countries[0] ||
    DEFAULT_COUNTRIES[0]
  );
};

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_COUNTRIES,
  DEFAULT_LOAN_LEVELS,
  DEFAULT_EXTENSION_PERIODS,
  DEFAULT_REPAYMENT_OPTIONS,
  DEFAULT_LOAN_TERMS,
  DEFAULT_PORTAL_CONTENT,
  DEFAULT_AUTH_VERIFICATION,
  getActiveCountryConfig,
  getSystemConfig,
  saveSystemConfig,
};
