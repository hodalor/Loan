const STORAGE_KEY = "pathway-system-config";

export const defaultSystemConfig = {
  disbursementMode: "manual",
  autoRepaymentPosting: false,
  requireGatewayApprovalCheck: true,
  gatewayProvider: "zynlepay",
  activeChannel: "zynlepay",
  implementedChannels: ["zynlepay", "nsano", "paystack"],
  gatewayAccountName: "Pathway Main Float",
  callbackUrl: "",
  settlementAccount: "",
  apiKey: "",
  apiSecret: "",
  notes: "",
  loanTerms: [
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
  ],
  loanLevels: Array.from({ length: 10 }, (_, index) => {
    const level = index + 1;

    return {
      level,
      label: level === 1 ? "Starter Level" : `Level ${level}`,
      minAmount: level * 50,
      maxAmount: level * 100,
      isEnabled: true,
    };
  }),
  extensionPeriods: [
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
  ],
  overduePenaltyRate: 2,
  repaymentOptions: [
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
  ],
  activeCountryCode: "ZM",
  countries: [
    {
      code: "ZM",
      name: "Zambia",
      locale: "en-ZM",
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
  ],
  allowPartialRepayment: true,
  authVerification: {
    otpMode: "demo",
    firebaseWebConfig: {
      apiKey: "AIzaSyC8jJstpNICe6CFWODCZvZ7gU7NHgQIZyo",
      authDomain: "loan-d61b8.firebaseapp.com",
      projectId: "loan-d61b8",
      storageBucket: "loan-d61b8.firebasestorage.app",
      messagingSenderId: "684116041224",
      appId: "1:684116041224:web:b399f294c6d1f3b82e7bbd",
    },
  },
  portalContent: {
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
  },
};

export const readSystemConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSystemConfig;

    return {
      ...defaultSystemConfig,
      ...JSON.parse(raw),
    };
  } catch (error) {
    return defaultSystemConfig;
  }
};

export const saveSystemConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pathway-system-config-updated"));
  }
  return config;
};

export const resetSystemConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("pathway-system-config-updated"));
  }
  return defaultSystemConfig;
};

export const channelLabels = {
  zynlepay: "ZynlePay",
  nsano: "Nsano",
  paystack: "Paystack",
};
