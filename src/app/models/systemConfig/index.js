const mongoose = require("mongoose");

const loanTermSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    days: {
      type: Number,
      default: 1,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    serviceFeeRate: {
      type: Number,
      default: 0,
    },
    processingFeeRate: {
      type: Number,
      default: 0,
    },
    commitmentFeeRate: {
      type: Number,
      default: 0,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const loanLevelSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    minAmount: {
      type: Number,
      default: 0,
    },
    maxAmount: {
      type: Number,
      default: 0,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const extensionPeriodSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    days: {
      type: Number,
      default: 1,
    },
    feeRate: {
      type: Number,
      default: 0,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const repaymentOptionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const countryProviderSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "gateway",
    },
    channel: {
      type: String,
      default: "",
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const countryNetworkSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "mobile-money",
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const countryConfigSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    locale: {
      type: String,
      default: "en-US",
    },
    timeZone: {
      type: String,
      default: "UTC",
    },
    currencyCode: {
      type: String,
      default: "USD",
    },
    currencySymbol: {
      type: String,
      default: "$",
    },
    dialCode: {
      type: String,
      default: "+1",
    },
    phoneExample: {
      type: String,
      default: "",
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    paymentProviders: {
      type: [countryProviderSchema],
      default: [],
    },
    mobileMoneyNetworks: {
      type: [countryNetworkSchema],
      default: [],
    },
    cardProviders: {
      type: [countryProviderSchema],
      default: [],
    },
  },
  { _id: false }
);

const portalContentSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      default: "SPEED CASH",
    },
    logoUrl: {
      type: String,
      default: "",
    },
    tagline: {
      type: String,
      default: "Fast customer login, application tracking, and identity verification.",
    },
    footerText: {
      type: String,
      default: "All rights reserved.",
    },
    footerVersion: {
      type: String,
      default: "1.5.0",
    },
    faqs: {
      type: [String],
      default: [],
    },
    repaymentTutorials: {
      type: [String],
      default: [],
    },
    supportPhone: {
      type: String,
      default: "",
    },
    supportEmail: {
      type: String,
      default: "",
    },
    supportWhatsapp: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const firebaseWebConfigSchema = new mongoose.Schema(
  {
    apiKey: {
      type: String,
      default: "",
    },
    authDomain: {
      type: String,
      default: "",
    },
    projectId: {
      type: String,
      default: "",
    },
    storageBucket: {
      type: String,
      default: "",
    },
    messagingSenderId: {
      type: String,
      default: "",
    },
    appId: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const authVerificationSchema = new mongoose.Schema(
  {
    otpMode: {
      type: String,
      default: "demo",
    },
    firebaseWebConfig: {
      type: firebaseWebConfigSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    disbursementMode: {
      type: String,
      default: "manual",
    },
    autoRepaymentPosting: {
      type: Boolean,
      default: false,
    },
    requireGatewayApprovalCheck: {
      type: Boolean,
      default: true,
    },
    gatewayProvider: {
      type: String,
      default: "zynlepay",
    },
    collectionGateway: {
      type: String,
      default: "zynlepay",
    },
    activeChannel: {
      type: String,
      default: "zynlepay",
    },
    disbursementGateway: {
      type: String,
      default: "zynlepay",
    },
    implementedChannels: {
      type: [String],
      default: ["zynlepay", "nsano", "paystack", "bridge"],
    },
    gatewayAccountName: {
      type: String,
      default: "Speed Cash Main Float",
    },
    callbackUrl: {
      type: String,
      default: "",
    },
    settlementAccount: {
      type: String,
      default: "",
    },
    apiKey: {
      type: String,
      default: "",
    },
    apiSecret: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    loanTerms: {
      type: [loanTermSchema],
      default: [],
    },
    loanLevels: {
      type: [loanLevelSchema],
      default: [],
    },
    extensionPeriods: {
      type: [extensionPeriodSchema],
      default: [],
    },
    overduePenaltyRate: {
      type: Number,
      default: 2,
    },
    repaymentOptions: {
      type: [repaymentOptionSchema],
      default: [],
    },
    activeCountryCode: {
      type: String,
      default: "ZM",
    },
    countries: {
      type: [countryConfigSchema],
      default: [],
    },
    allowPartialRepayment: {
      type: Boolean,
      default: true,
    },
    portalContent: {
      type: portalContentSchema,
      default: () => ({}),
    },
    authVerification: {
      type: authVerificationSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemConfig", systemConfigSchema);
