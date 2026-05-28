import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loginCustomer,
  requestCustomerOtp,
  setCustomerPin,
  verifyCustomerOtp,
} from "./api/customerAuth";
import {
  applyCustomerLoan,
  extendCustomerLoan,
  fetchExtensionSummary,
  fetchPortalContent,
  fetchPortalSummary,
  fetchRepaymentSummary,
  payCustomerLoan,
  saveApplicationDraft,
  submitApplicationProfile,
  verifyPaystackPortalTransaction,
} from "./api/application";
import {
  isFirebasePhoneVerificationReady,
  requestFirebasePhoneOtp,
  resetFirebasePhoneVerification,
  verifyFirebasePhoneOtp,
} from "./firebase/phoneAuth";
import "./App.css";
import InstallAppPrompt from "./components/InstallAppPrompt";
import { resolveMediaUrl } from "./libs/mediaUrl";

const APPLICATION_STEPS = [
  { id: "personal", label: "Personal info" },
  { id: "education", label: "Education info" },
  { id: "work", label: "Work info" },
  { id: "emergency", label: "Emergency contacts" },
  { id: "identity", label: "ID verification" },
];

const PORTAL_TABS = [
  { id: "home", label: "Home" },
  { id: "apply", label: "Apply" },
  { id: "history", label: "Records" },
  { id: "profile", label: "Profile" },
];

const educationLevels = [
  "Primary",
  "JHS",
  "SHS",
  "Diploma",
  "HND",
  "Degree",
  "Masters",
  "Other",
];
const relationshipOptions = ["Parent", "Sibling", "Spouse", "Friend", "Employer", "Other"];
const residenceTypes = ["Family house", "Rented", "Owned", "Hostel", "Other"];
const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
const idTypes = ["National ID", "Passport", "Voter Card", "Driver License"];
const workHoursOptions = ["Full time", "Part time", "Shift", "Flexible"];
const PAYMENT_PENDING_MESSAGE = "Continue to make payment.";
const PAYMENT_FAILED_MESSAGE = "Payment failed. Try later.";
const PAYMENT_SUCCESS_MESSAGE = "Payment completed successfully.";
let runtimeLocale = "en-ZM";
let runtimeCurrencySymbol = "K";
const buildDefaultPortalContent = () => ({
  appName: "SPEED CASH",
  logoUrl: "",
  homeBannerImageUrl: "",
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
  activeCountry: {
    code: "ZM",
    name: "Zambia",
    locale: "en-ZM",
    currencyCode: "ZMW",
    currencySymbol: "K",
    dialCode: "+260",
    phoneExample: "0970000000",
    paymentProviders: [],
    mobileMoneyNetworks: [],
    cardProviders: [],
  },
  countries: [
    {
      code: "ZM",
      name: "Zambia",
      locale: "en-ZM",
      currencyCode: "ZMW",
      currencySymbol: "K",
      dialCode: "+260",
      phoneExample: "0970000000",
      paymentProviders: [],
      mobileMoneyNetworks: [],
      cardProviders: [],
    },
  ],
  authVerification: {
    otpMode: "demo",
    firebaseWebConfig: {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
    },
  },
});

const buildInitialContact = () => ({
  name: "",
  phone: "",
  relationship: "",
  address: "",
  educationalLevel: "",
});

const buildInitialState = () => ({
  otp: {
    phone: "",
    otp: "",
    countryCode: "ZM",
  },
  login: {
    phone: "",
    pin: "",
    countryCode: "ZM",
  },
  pinSetup: {
    pin: "",
    confirmPin: "",
  },
  personal: {
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    countryCode: "ZM",
    backupPhone: "",
    email: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    educationalLevel: "",
    schoolStatus: "",
    residenceType: "",
    residenceTime: "",
    digitalAddress: "",
    areaName: "",
    landmark: "",
    incomeSource: "",
    dependants: "",
  },
  education: {
    currentSchoolName: "",
    highestLevel: "",
    courseOfStudy: "",
    graduationYear: "",
    schoolAddress: "",
  },
  work: {
    workContent: "",
    workUnit: "",
    industry: "",
    workAddress: "",
    companyAddress: "",
    landmarkCompany: "",
    workHours: "",
    currentIncome: "",
  },
  emergency: {
    contacts: [buildInitialContact(), buildInitialContact(), buildInitialContact()],
  },
  identity: {
    idType: "",
    idNumber: "",
    frontPhoto: null,
    backPhoto: null,
    selfiePhoto: null,
  },
});

const buildInitialLoanRequest = () => ({
  amount: "",
  termKey: "",
  paymentMethod: "",
  paymentOperator: "",
  useLoan: "Personal needs",
  acceptedTerms: false,
  stage: "builder",
});
const buildInitialRepaymentDraft = () => ({
  repaymentType: "full",
  amount: "",
  methodKey: "",
  mobileMoneyOperator: "",
});
const buildInitialExtensionDraft = () => ({
  extensionKey: "",
  methodKey: "",
  mobileMoneyOperator: "",
});

const isPhoneValid = (value = "") => value.trim().length >= 10;
const isPinValid = (value = "") => /^\d{4}$/.test(value.trim());
const isNotEmpty = (value = "") => String(value).trim() !== "";
const isBrowserFile = (value) => typeof File !== "undefined" && value instanceof File;
const normalizeStoredFile = (value) =>
  value && typeof value === "object" && value.name
    ? {
        name: value.name,
        uploaded: Boolean(value.uploaded),
        needsReupload: Boolean(value.needsReupload),
      }
    : null;
const toDraftFileValue = (value) => {
  if (!value) return null;
  if (isBrowserFile(value)) {
    return {
      name: value.name,
      needsReupload: true,
    };
  }
  if (value.uploaded) {
    return {
      name: value.name,
      uploaded: true,
    };
  }
  return normalizeStoredFile(value);
};
const hasIdentityAsset = (value) => isBrowserFile(value) || Boolean(value?.uploaded);
const getIdentityPreviewSrc = (value) => {
  if (!value) return "";
  if (isBrowserFile(value)) {
    return URL.createObjectURL(value);
  }
  return resolveMediaUrl(value?.name || "");
};
const toMoney = (value = 0) => Number.parseFloat(Number(value || 0).toFixed(2));
const applyRuntimeCountryFormatting = (country = {}) => {
  runtimeLocale = country?.locale || "en-ZM";
  runtimeCurrencySymbol = country?.currencySymbol || "K";
};
const formatCurrency = (value = 0) => {
  const amount = toMoney(value);
  const formattedAmount = new Intl.NumberFormat(runtimeLocale || "en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${runtimeCurrencySymbol || "K"} ${formattedAmount}`;
};
const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(runtimeLocale || undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
const getCountryByCode = (countries = [], code = "") =>
  (Array.isArray(countries) ? countries : []).find((item) => item.code === code) || null;
const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const formatDaysLabel = (days) => {
  if (days === null || days === undefined) return "-";
  if (days === 0) return "Due today";
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} left`;
  const overdueDays = Math.abs(days);
  return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
};
const SETTLED_PAYMENT_STATUSES = ["Paid", "Payed"];
const isSettledPortalLoan = (loan = {}) =>
  SETTLED_PAYMENT_STATUSES.includes(String(loan?.paymentStatus || "").trim()) ||
  String(loan?.caseStatus || "").trim() === "Completed" ||
  toMoney(loan?.amountPaid) + 0.009 >= toMoney(loan?.repaymentAmount);
const getCalendarDayDifference = (left, right = new Date()) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  if (Number.isNaN(leftDate.getTime()) || Number.isNaN(rightDate.getTime())) {
    return null;
  }

  const leftMidnight = new Date(leftDate.getFullYear(), leftDate.getMonth(), leftDate.getDate());
  const rightMidnight = new Date(
    rightDate.getFullYear(),
    rightDate.getMonth(),
    rightDate.getDate()
  );

  return Math.round((leftMidnight.getTime() - rightMidnight.getTime()) / (1000 * 3600 * 24));
};
const getPortalLoanMetrics = (loan = {}) => {
  const repaymentAmount = toMoney(loan?.repaymentAmount || 0);
  const amountPaid = toMoney(loan?.amountPaid || 0);
  const settled = isSettledPortalLoan(loan);
  const cutoffDate = settled && loan?.dp ? loan.dp : new Date();
  const daysRemaining = getCalendarDayDifference(loan?.dop, cutoffDate);
  const overdueDays = daysRemaining === null ? 0 : Math.max(-daysRemaining, 0);
  const remainingPrincipal = Math.max(repaymentAmount - amountPaid, 0);
  const overduePenaltyRate = Number(loan?.overduePenaltyRate || 2);
  const overduePenalty = toMoney(
    remainingPrincipal > 0 ? remainingPrincipal * (overduePenaltyRate / 100) * overdueDays : 0
  );
  const outstandingBalance = toMoney(remainingPrincipal + overduePenalty);

  return {
    settled,
    repaymentAmount,
    amountPaid,
    daysRemaining,
    overdueDays,
    overduePenalty,
    outstandingBalance,
  };
};
const getRepaymentMethodLabel = (options = [], key = "") =>
  options.find((item) => item.key === key)?.label || key || "-";
const getGatewayMobileMoneyNetworks = (lifecycleConfig = {}) =>
  Array.isArray(lifecycleConfig?.mobileMoneyNetworks) ? lifecycleConfig.mobileMoneyNetworks : [];
const getDefaultGatewayMobileMoneyOperator = (lifecycleConfig = {}) =>
  getGatewayMobileMoneyNetworks(lifecycleConfig)[0]?.key || "";
const getRecordBadges = (loan = {}) => {
  const badges = [];

  if (loan.loanStatus) {
    badges.push({
      label: loan.loanStatus,
      tone:
        loan.loanStatus === "Granted"
          ? "success"
          : loan.loanStatus === "Rejected"
          ? "danger"
          : "info",
    });
  }

  if (loan.paymentStatus) {
    badges.push({
      label: loan.paymentStatus,
      tone: SETTLED_PAYMENT_STATUSES.includes(String(loan.paymentStatus).trim())
        ? "success"
        : "neutral",
    });
  }

  if (loan.payoutStatus) {
    badges.push({
      label: `Payout: ${loan.payoutStatus}`,
      tone:
        String(loan.payoutStatus).toLowerCase().includes("failed") ? "danger" : "info",
    });
  }

  if (loan.caseStatus) {
    badges.push({
      label: `Case: ${loan.caseStatus}`,
      tone: "neutral",
    });
  }

  return badges;
};

const buildLoanSummary = (amount, term) => {
  if (!amount || !term) return null;
  const interestAmount = toMoney((amount * term.interestRate) / 100);
  const serviceFeeAmount = toMoney((amount * term.serviceFeeRate) / 100);
  const processingFeeAmount = toMoney((amount * term.processingFeeRate) / 100);
  const commitmentFeeAmount = toMoney((amount * term.commitmentFeeRate) / 100);
  const totalRepayment = toMoney(
    amount +
      interestAmount +
      serviceFeeAmount +
      processingFeeAmount +
      commitmentFeeAmount
  );
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Number(term.days || 0));

  return {
    interestAmount,
    serviceFeeAmount,
    processingFeeAmount,
    commitmentFeeAmount,
    totalRepayment,
    totalFeeRate:
      Number(term.interestRate || 0) +
      Number(term.serviceFeeRate || 0) +
      Number(term.processingFeeRate || 0) +
      Number(term.commitmentFeeRate || 0),
    dueDate: dueDate.toISOString(),
  };
};

const buildLoanRequestFromOffer = (offer) => {
  const firstTerm = offer?.termOptions?.[0];
  const firstMethod = offer?.paymentMethods?.[0];

  return {
    amount: offer?.defaultAmount || "",
    termKey: firstTerm?.key || "",
    paymentMethod: firstMethod?.method || "",
    paymentOperator: firstMethod?.operator || "",
    useLoan: "Personal needs",
    acceptedTerms: false,
    stage: "builder",
  };
};

const syncLoanRequestWithOffer = (currentRequest, offer) => {
  const fallbackRequest = buildLoanRequestFromOffer(offer);
  const availableTerms = Array.isArray(offer?.termOptions) ? offer.termOptions : [];
  const availableMethods = Array.isArray(offer?.paymentMethods) ? offer.paymentMethods : [];
  const minAmount = Number(offer?.minAmount || 0);
  const maxAmount = Number(offer?.maxAmount || offer?.defaultAmount || 0);
  const requestedAmount = Number(currentRequest?.amount || fallbackRequest.amount || 0);

  const hasSelectedTerm = availableTerms.some((term) => term.key === currentRequest?.termKey);
  const hasSelectedMethod = availableMethods.some(
    (method) => method.method === currentRequest?.paymentMethod
  );
  const resolvedPaymentMethod = hasSelectedMethod
    ? currentRequest?.paymentMethod
    : fallbackRequest.paymentMethod;
  const resolvedPaymentMethodRecord =
    availableMethods.find((method) => method.method === resolvedPaymentMethod) || null;
  const normalizedAmount =
    requestedAmount >= minAmount && requestedAmount <= maxAmount
      ? requestedAmount
      : fallbackRequest.amount;

  return {
    ...fallbackRequest,
    ...(currentRequest || {}),
    amount: normalizedAmount,
    termKey: hasSelectedTerm ? currentRequest?.termKey : fallbackRequest.termKey,
    paymentMethod: resolvedPaymentMethod,
    paymentOperator:
      resolvedPaymentMethodRecord?.operator ||
      (resolvedPaymentMethod === currentRequest?.paymentMethod
        ? currentRequest?.paymentOperator || ""
        : fallbackRequest.paymentOperator),
    acceptedTerms: false,
  };
};

const buildLoanRecords = (loans = []) =>
  [...loans]
    .flatMap((loan, index) => {
      const metrics = getPortalLoanMetrics(loan);
      const records = [
        {
          id: `loan-${loan.ID || index}`,
          type: "Loan",
          status: loan.loanStatus || "Review",
          amount: Number(loan.amount || 0),
          direction: "credit",
          date: loan.doa || loan.createdAt,
          subtitle: `Loan Application - ${loan.duration || "Term not specified"} (${loan.ID || "Pending"})`,
          badges: getRecordBadges(loan),
          metaRows: [
            { label: "Repayment Amount", value: formatCurrency(Number(loan.repaymentAmount || 0)) },
            { label: "Due Date", value: formatDate(loan.dop) },
            { label: "Provider", value: loan.disbursementProvider || "-" },
            { label: "Channel", value: loan.disbursementChannel || "-" },
          ],
        },
      ];

      if (Number(loan.amountPaid || 0) > 0) {
        records.push({
          id: `repayment-${loan.ID || index}`,
          type: "Repayment",
          status: metrics.settled ? "Completed" : "In progress",
          amount: Number(loan.amountPaid || 0),
          direction: "debit",
          date: loan.dp || loan.updatedAt || loan.doa,
          subtitle: `Loan repayment${loan.ID ? ` (${loan.ID})` : ""}`,
          badges: [
            {
              label: metrics.settled ? "Payment cleared" : "Partial payment",
              tone: metrics.settled ? "success" : "info",
            },
          ],
          metaRows: [
            { label: "Loan ID", value: loan.ID || "-" },
            { label: "Amount Paid", value: formatCurrency(Number(loan.amountPaid || 0)) },
            ...(metrics.overduePenalty > 0
              ? [{ label: "Penalty", value: formatCurrency(metrics.overduePenalty) }]
              : []),
            {
              label: "Balance",
              value: formatCurrency(metrics.outstandingBalance),
            },
          ],
        });
      }

      return records;
    })
    .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0));

const buildPayloadPreview = (formData) => ({
  IDinfo: {
    idType: formData.identity.idType,
    gCardNumber: formData.identity.idNumber,
    firstName: formData.personal.firstName,
    middleName: formData.personal.middleName,
    lastName: formData.personal.lastName,
    gender: formData.personal.gender,
    idFront: formData.identity.frontPhoto?.name || "",
    idBack: formData.identity.backPhoto?.name || "",
    selfiePhoto: formData.identity.selfiePhoto?.name || "",
  },
  pesonalInfo: {
    dob: formData.personal.dob,
    schoolStatus: formData.personal.schoolStatus,
    educationalLevel: formData.personal.educationalLevel,
    residenceType: formData.personal.residenceType,
    dAddress: formData.personal.digitalAddress,
    areaName: formData.personal.areaName,
    landMark: formData.personal.landmark,
    residenceTime: formData.personal.residenceTime,
    incomeSource: formData.personal.incomeSource,
    maritalStatus: formData.personal.maritalStatus,
    relativesINOC: formData.personal.dependants,
    bUPphone: formData.personal.backupPhone,
  },
  educationInfo: formData.education,
  workInfo: {
    workUnit: formData.work.workUnit,
    industry: formData.work.industry,
    workAddress: formData.work.workAddress,
    companyAddress: formData.work.companyAddress,
    LNDmarkCompany: formData.work.landmarkCompany,
    workHours: formData.work.workHours,
    currentIncome: formData.work.currentIncome,
    workContent: formData.work.workContent,
  },
  emergncyContacts: {
    contact1: formData.emergency.contacts[0],
    contact2: formData.emergency.contacts[1],
    contact3: formData.emergency.contacts[2],
  },
});

const mapCustomerToFormState = (customer = {}) => ({
  personal: {
    firstName: customer.IDinfo?.firstName || "",
    middleName: customer.IDinfo?.middleName || "",
    lastName: customer.IDinfo?.lastName || "",
    phone: customer.phone || "",
    countryCode: customer.countryCode || "ZM",
    backupPhone: customer.pesonalInfo?.bUPphone || "",
    email: customer.email || "",
    dob: customer.pesonalInfo?.dob || "",
    gender: customer.IDinfo?.gender || "",
    maritalStatus: customer.pesonalInfo?.maritalStatus || "",
    educationalLevel: customer.pesonalInfo?.educationalLevel || "",
    schoolStatus:
      typeof customer.pesonalInfo?.schoolStatus === "boolean"
        ? customer.pesonalInfo.schoolStatus
          ? "Yes"
          : "No"
        : "",
    residenceType: customer.pesonalInfo?.residenceType || "",
    residenceTime: customer.pesonalInfo?.residenceTime || "",
    digitalAddress: customer.pesonalInfo?.dAddress || "",
    areaName: customer.pesonalInfo?.areaName || "",
    landmark: customer.pesonalInfo?.landMark || "",
    incomeSource: customer.pesonalInfo?.incomeSource || "",
    dependants: customer.pesonalInfo?.relativesINOC || "",
  },
  education: {
    currentSchoolName: customer.educationInfo?.currentSchoolName || "",
    highestLevel:
      customer.educationInfo?.highestLevel || customer.pesonalInfo?.educationalLevel || "",
    courseOfStudy: customer.educationInfo?.courseOfStudy || "",
    graduationYear: customer.educationInfo?.graduationYear || "",
    schoolAddress: customer.educationInfo?.schoolAddress || "",
  },
  work: {
    workContent: customer.workInfo?.workContent || "",
    workUnit: customer.workInfo?.workUnit || "",
    industry: customer.workInfo?.industry || "",
    workAddress: customer.workInfo?.workAddress || "",
    companyAddress: customer.workInfo?.companyAddress || "",
    landmarkCompany: customer.workInfo?.LNDmarkCompany || "",
    workHours: customer.workInfo?.workHours || "",
    currentIncome: customer.workInfo?.currentIncome || "",
  },
  identity: {
    idType: customer.IDinfo?.idType || customer.IDinfo?.idName || "",
    idNumber: customer.IDinfo?.gCardNumber || "",
    frontPhoto: customer.IDinfo?.idFront
      ? { name: customer.IDinfo.idFront, uploaded: true }
      : null,
    backPhoto: customer.IDinfo?.idBack
      ? { name: customer.IDinfo.idBack, uploaded: true }
      : null,
    selfiePhoto: customer.userImage
      ? { name: customer.userImage, uploaded: true }
      : null,
  },
  emergency: {
    contacts: [
      customer.emergncyContacts?.contact1 || buildInitialContact(),
      customer.emergncyContacts?.contact2 || buildInitialContact(),
      customer.emergncyContacts?.contact3 || buildInitialContact(),
    ].map((contact) => ({
      name: contact.name || "",
      phone: contact.phone || "",
      relationship: contact.relationship || "",
      address: contact.address || "",
      educationalLevel: contact.educationalLevel || "",
    })),
  },
});

const normalizeDraftApplication = (draft = {}) => ({
  ...buildInitialState(),
  ...draft,
  otp: {
    ...buildInitialState().otp,
    ...(draft.otp || {}),
  },
  login: {
    ...buildInitialState().login,
    ...(draft.login || {}),
  },
  pinSetup: {
    ...buildInitialState().pinSetup,
    ...(draft.pinSetup || {}),
  },
  personal: {
    ...buildInitialState().personal,
    ...(draft.personal || {}),
  },
  education: {
    ...buildInitialState().education,
    ...(draft.education || {}),
  },
  work: {
    ...buildInitialState().work,
    ...(draft.work || {}),
  },
  emergency: {
    contacts: [
      ...(draft.emergency?.contacts || []),
      buildInitialContact(),
      buildInitialContact(),
      buildInitialContact(),
    ]
      .slice(0, 3)
      .map((contact) => ({
        ...buildInitialContact(),
        ...(contact || {}),
      })),
  },
  identity: {
    ...buildInitialState().identity,
    ...(draft.identity || {}),
    frontPhoto: normalizeStoredFile(draft.identity?.frontPhoto),
    backPhoto: normalizeStoredFile(draft.identity?.backPhoto),
    selfiePhoto: normalizeStoredFile(draft.identity?.selfiePhoto),
  },
});

const getDraftStep = (draft = {}) => {
  const step = Number(draft?.meta?.applicationStep || 0);
  if (Number.isNaN(step)) return 0;
  return Math.min(Math.max(step, 0), APPLICATION_STEPS.length - 1);
};

const getDisplayName = (formData, sessionAccount) => {
  const fullName = [
    formData.personal.firstName,
    formData.personal.middleName,
    formData.personal.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    sessionAccount?.customer?.IDinfo?.firstName ||
    sessionAccount?.phone ||
    "Customer"
  );
};

const validateStepById = (stepId, formData) => {
  if (stepId === "personal") {
    return [
      formData.personal.firstName,
      formData.personal.lastName,
      formData.personal.phone,
      formData.personal.email,
      formData.personal.dob,
      formData.personal.gender,
      formData.personal.maritalStatus,
      formData.personal.educationalLevel,
      formData.personal.schoolStatus,
      formData.personal.residenceType,
      formData.personal.digitalAddress,
      formData.personal.areaName,
      formData.personal.incomeSource,
    ].every(isNotEmpty);
  }

  if (stepId === "education") {
    return [
      formData.education.currentSchoolName,
      formData.education.highestLevel,
      formData.education.courseOfStudy,
      formData.education.schoolAddress,
    ].every(isNotEmpty);
  }

  if (stepId === "work") {
    return [
      formData.work.workContent,
      formData.work.workUnit,
      formData.work.industry,
      formData.work.workAddress,
      formData.work.workHours,
      formData.work.currentIncome,
    ].every(isNotEmpty);
  }

  if (stepId === "emergency") {
    return formData.emergency.contacts.every((contact) =>
      [contact.name, contact.phone, contact.relationship, contact.address, contact.educationalLevel].every(
        isNotEmpty
      )
    );
  }

  if (stepId === "identity") {
    return (
      isNotEmpty(formData.identity.idType) &&
      isNotEmpty(formData.identity.idNumber) &&
      hasIdentityAsset(formData.identity.frontPhoto) &&
      hasIdentityAsset(formData.identity.backPhoto) &&
      hasIdentityAsset(formData.identity.selfiePhoto)
    );
  }

  return true;
};

function App() {
  const firebaseConfirmationRef = useRef(null);
  const [screen, setScreen] = useState("login");
  const [activeTab, setActiveTab] = useState("home");
  const [authMode, setAuthMode] = useState("signup");
  const [otpRequested, setOtpRequested] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [loanApplying, setLoanApplying] = useState(false);
  const [applicationStep, setApplicationStep] = useState(0);
  const [applyMode, setApplyMode] = useState("profile");
  const [formData, setFormData] = useState(buildInitialState);
  const [sessionAccount, setSessionAccount] = useState(null);
  const [loanOffer, setLoanOffer] = useState(null);
  const [loanRequest, setLoanRequest] = useState(buildInitialLoanRequest);
  const [portalContent, setPortalContent] = useState(buildDefaultPortalContent);
  const [selectedCountryCode, setSelectedCountryCode] = useState(
    buildDefaultPortalContent().activeCountry.code
  );
  const [activeLoan, setActiveLoan] = useState(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState("");
  const [repaymentDraft, setRepaymentDraft] = useState(buildInitialRepaymentDraft);
  const [extensionDraft, setExtensionDraft] = useState(buildInitialExtensionDraft);
  const [repaymentSummaryData, setRepaymentSummaryData] = useState(null);
  const [extensionSummaryData, setExtensionSummaryData] = useState(null);
  const [transactionReceipt, setTransactionReceipt] = useState(null);
  const [pendingGatewayTransaction, setPendingGatewayTransaction] = useState(null);
  const [firebaseIdToken, setFirebaseIdToken] = useState("");
  const [brandLogoLoadFailed, setBrandLogoLoadFailed] = useState(false);
  const [appMessage, setAppMessage] = useState({
    type: "info",
    text: "Sign in with phone number and your 4-digit PIN, or create a new application.",
  });

  const activeStep = APPLICATION_STEPS[applicationStep];
  const payloadPreview = useMemo(() => buildPayloadPreview(formData), [formData]);
  const loanHistory = useMemo(
    () => sessionAccount?.loanHistory || sessionAccount?.customer?.loan?.loans || [],
    [sessionAccount?.customer?.loan?.loans, sessionAccount?.loanHistory]
  );
  const paymentHistory = useMemo(() => sessionAccount?.paymentHistory || [], [sessionAccount?.paymentHistory]);
  const loanRecords = useMemo(() => buildLoanRecords(loanHistory), [loanHistory]);
  const hasDraft = Boolean(sessionAccount?.draftApplication);
  const hasProfile = Boolean(sessionAccount?.customer?._id || sessionAccount?.hasProfile);
  const displayName = getDisplayName(formData, sessionAccount);
  const selectedTerm =
    loanOffer?.termOptions?.find((option) => option.key === loanRequest.termKey) ||
    loanOffer?.termOptions?.[0] ||
    null;
  const selectedAmount = toMoney(loanRequest.amount || loanOffer?.defaultAmount || 0);
  const loanSummary = useMemo(
    () => buildLoanSummary(selectedAmount, selectedTerm),
    [selectedAmount, selectedTerm]
  );
  const brandName = portalContent?.appName || buildDefaultPortalContent().appName;
  const brandLogoUrl = resolveMediaUrl(
    portalContent?.logoUrl || buildDefaultPortalContent().logoUrl
  );
  const brandTagline = portalContent?.tagline || buildDefaultPortalContent().tagline;
  const footerText = portalContent?.footerText || buildDefaultPortalContent().footerText;
  const footerVersion =
    portalContent?.footerVersion || buildDefaultPortalContent().footerVersion;
  const availableCountries = portalContent?.countries?.length
    ? portalContent.countries
    : buildDefaultPortalContent().countries;
  const selectedCountry =
    getCountryByCode(availableCountries, selectedCountryCode) ||
    portalContent?.activeCountry ||
    buildDefaultPortalContent().activeCountry;
  const otpMode = portalContent?.authVerification?.otpMode === "real" ? "real" : "demo";
  const firebaseWebConfig =
    portalContent?.authVerification?.firebaseWebConfig ||
    buildDefaultPortalContent().authVerification.firebaseWebConfig;
  const isRealOtpMode = otpMode === "real";
  const firebaseVerificationReady = isFirebasePhoneVerificationReady(firebaseWebConfig);
  const lifecycleConfig = sessionAccount?.lifecycleConfig || null;

  useEffect(() => {
    setBrandLogoLoadFailed(false);
  }, [brandLogoUrl]);

  const showMessage = (type, text) => setAppMessage({ type, text });
  const resetOtpVerificationState = useCallback(() => {
    firebaseConfirmationRef.current = null;
    setFirebaseIdToken("");
    resetFirebasePhoneVerification();
  }, []);

  const updateSection = (section, field, value) => {
    setFormData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const updateEmergencyContact = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      emergency: {
        ...current.emergency,
        contacts: current.emergency.contacts.map((contact, contactIndex) =>
          contactIndex === index ? { ...contact, [field]: value } : contact
        ),
      },
    }));
  };

  const updateLoanRequest = (field, value) => {
    setLoanRequest((current) => ({
      ...current,
      [field]: value,
      ...(field === "paymentMethod"
        ? {
            paymentOperator:
              (loanOffer?.paymentMethods || []).find((method) => method.method === value)?.operator ||
              "",
          }
        : {}),
    }));
  };
  const handleCountryChange = (countryCode) => {
    const nextCountry = getCountryByCode(availableCountries, countryCode) || selectedCountry;

    setSelectedCountryCode(countryCode);
    applyRuntimeCountryFormatting(nextCountry || buildDefaultPortalContent().activeCountry);
    setFormData((current) => ({
      ...current,
      otp: {
        ...current.otp,
        countryCode,
      },
      login: {
        ...current.login,
        countryCode,
      },
      personal: {
        ...current.personal,
        countryCode,
      },
    }));
  };

  const hydratePortalData = useCallback((data, phone) => {
    const customerState = data?.customer ? mapCustomerToFormState(data.customer) : null;
    const draftState = data?.draftApplication
      ? normalizeDraftApplication(data.draftApplication)
      : null;
    const mergedState =
      customerState || draftState
        ? {
            ...buildInitialState(),
            ...(customerState || {}),
            ...(draftState || {}),
            personal: {
              ...buildInitialState().personal,
              ...(customerState?.personal || {}),
              ...(draftState?.personal || {}),
            },
            education: {
              ...buildInitialState().education,
              ...(customerState?.education || {}),
              ...(draftState?.education || {}),
            },
            work: {
              ...buildInitialState().work,
              ...(customerState?.work || {}),
              ...(draftState?.work || {}),
            },
            emergency: {
              contacts: (
                draftState?.emergency?.contacts ||
                customerState?.emergency?.contacts ||
                buildInitialState().emergency.contacts
              ).map((contact) => ({
                ...buildInitialContact(),
                ...(contact || {}),
              })),
            },
            identity: {
              ...buildInitialState().identity,
              ...(customerState?.identity || {}),
              ...(draftState?.identity || {}),
            },
          }
        : null;
    const restoredStep = draftState ? getDraftStep(data?.draftApplication) : 0;

    setSessionAccount((current) => ({
      ...(current || {}),
      ...(data || {}),
      phone,
    }));
    if (data?.country?.code) {
      setSelectedCountryCode(data.country.code);
    }
    setFormData((current) => ({
      ...current,
      ...(mergedState || {}),
      otp: {
        ...current.otp,
        phone,
        countryCode: data?.country?.code || current.otp.countryCode || selectedCountryCode,
      },
      login: {
        phone,
        pin: "",
        countryCode: data?.country?.code || current.login.countryCode || selectedCountryCode,
      },
      personal: {
        ...(current.personal || {}),
        ...(mergedState?.personal || {}),
        phone,
        countryCode:
          data?.country?.code ||
          mergedState?.personal?.countryCode ||
          current.personal?.countryCode ||
          selectedCountryCode,
      },
    }));
    setApplicationStep(restoredStep);
    setApplyMode(data?.hasProfile && !data?.draftApplication ? "loan" : "profile");
    setPortalContent((current) => ({
      ...current,
      ...buildDefaultPortalContent(),
      ...(data?.content || {}),
    }));
    setActiveLoan(data?.activeLoan || null);
    setLifecycleAction("");
    setRepaymentSummaryData(null);
    setExtensionSummaryData(null);

    if (data?.offer) {
      setLoanOffer(data.offer);
      setLoanRequest(buildLoanRequestFromOffer(data.offer));
      setRepaymentDraft((current) => ({
        ...buildInitialRepaymentDraft(),
        methodKey:
          data?.activeLoan?.repaymentOptions?.[0]?.key ||
          data?.lifecycleConfig?.repaymentOptions?.[0]?.key ||
          current.methodKey ||
          "",
      }));
      setExtensionDraft((current) => ({
        ...buildInitialExtensionDraft(),
        methodKey:
          data?.activeLoan?.repaymentOptions?.[0]?.key ||
          data?.lifecycleConfig?.repaymentOptions?.[0]?.key ||
          current.methodKey ||
          "",
      }));
    }
  }, [selectedCountryCode]);

  const loadPortalSummary = useCallback(async (phone, { quiet = false } = {}) => {
    if (!isPhoneValid(phone)) return null;

    setPortalLoading(true);
    const response = await fetchPortalSummary(phone);
    setPortalLoading(false);

    if (response.success === 0) {
      if (!quiet) {
        showMessage("error", response.message || "Could not load customer portal.");
      }
      return null;
    }

    hydratePortalData(response.data, phone);
    return response.data;
  }, [hydratePortalData]);

  useEffect(() => {
    const defaultCountryCode =
      sessionAccount?.country?.code ||
      portalContent?.activeCountry?.code ||
      buildDefaultPortalContent().activeCountry.code;
    const nextCountry = getCountryByCode(availableCountries, defaultCountryCode) || selectedCountry;

    if (nextCountry?.code && !selectedCountryCode) {
      setSelectedCountryCode(nextCountry.code);
    }

    applyRuntimeCountryFormatting(nextCountry || buildDefaultPortalContent().activeCountry);
  }, [
    availableCountries,
    portalContent?.activeCountry,
    selectedCountry,
    selectedCountryCode,
    sessionAccount?.country?.code,
  ]);

  const applyVerifiedPortalTransaction = useCallback(
    async (response, fallbackType) => {
      if (!response || response.success === 0) {
        showMessage("error", PAYMENT_FAILED_MESSAGE);
        return false;
      }

      if (response.success === 2) {
        showMessage("info", PAYMENT_PENDING_MESSAGE);
        return false;
      }

      const transactionType =
        response.data?.transaction?.transactionType ||
        pendingGatewayTransaction?.type ||
        fallbackType;
      const receiptType = transactionType === "extension" ? "Extension" : "Repayment";

      setTransactionReceipt({
        type: receiptType,
        amount:
          receiptType === "Extension"
            ? response.data?.transaction?.amount ||
              extensionSummaryData?.extension?.feeAmount ||
              pendingGatewayTransaction?.amount ||
              0
            : response.data?.transaction?.amount ||
              repaymentSummaryData?.amount ||
              pendingGatewayTransaction?.amount ||
              0,
        reference:
          response.data?.transaction?.reference ||
          pendingGatewayTransaction?.reference ||
          activeLoan?.loanId ||
          "-",
        date: new Date().toISOString(),
        status: "Completed",
        method: getRepaymentMethodLabel(
          activeLoan?.repaymentOptions || [],
          response.data?.transaction?.methodKey || pendingGatewayTransaction?.methodKey || ""
        ),
        note: PAYMENT_SUCCESS_MESSAGE,
        balance:
          receiptType === "Extension"
            ? undefined
            : response.data?.activeLoan?.totalDue || 0,
        level: response.data?.offer?.levelLabel || "",
        newDueDate:
          receiptType === "Extension" ? response.data?.activeLoan?.dueDate || null : undefined,
      });

      await loadPortalSummary(
        formData.personal.phone || sessionAccount?.phone || formData.login.phone,
        { quiet: true }
      );
      setLifecycleAction("");
      setRepaymentSummaryData(null);
      setExtensionSummaryData(null);
      setPendingGatewayTransaction(null);
      setActiveTab("home");
      showMessage("success", PAYMENT_SUCCESS_MESSAGE);
      return true;
    },
    [
      activeLoan?.loanId,
      activeLoan?.repaymentOptions,
      extensionSummaryData?.extension?.feeAmount,
      formData.login.phone,
      formData.personal.phone,
      loadPortalSummary,
      pendingGatewayTransaction,
      repaymentSummaryData?.amount,
      sessionAccount?.phone,
    ]
  );

  const loadPortalContent = useCallback(async ({ quiet = false } = {}) => {
    const response = await fetchPortalContent();

    if (response.success === 0) {
      if (!quiet) {
        setAppMessage({
          type: "error",
          text: response.message || "Could not load portal content.",
        });
      }
      return null;
    }

    setPortalContent((current) => ({
      ...current,
      ...buildDefaultPortalContent(),
      ...(response.data || {}),
    }));
    if (!sessionAccount?.country?.code && response.data?.activeCountry?.code) {
      setSelectedCountryCode((currentCode) =>
        currentCode === buildDefaultPortalContent().activeCountry.code
          ? response.data.activeCountry.code
          : currentCode
      );
    }

    return response.data;
  }, [sessionAccount?.country?.code]);

  useEffect(() => {
    loadPortalContent({ quiet: true });
  }, [loadPortalContent]);

  useEffect(() => () => resetFirebasePhoneVerification(), []);

  useEffect(() => {
    if (!isRealOtpMode) {
      resetOtpVerificationState();
    }
  }, [isRealOtpMode, resetOtpVerificationState]);

  useEffect(() => {
    if (screen !== "portal") return undefined;

    let isMounted = true;

    const syncPortalContent = async () => {
      const data = await loadPortalContent({ quiet: true });
      if (!isMounted || !data) return;
    };

    syncPortalContent();
    const intervalId = window.setInterval(syncPortalContent, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [loadPortalContent, screen]);

  useEffect(() => {
    if (screen !== "portal") return undefined;

    const phone =
      formData.personal.phone || sessionAccount?.phone || formData.login.phone || "";

    if (!isPhoneValid(phone) || activeTab === "apply") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadPortalSummary(phone, { quiet: true });
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    activeTab,
    formData.login.phone,
    formData.personal.phone,
    loadPortalSummary,
    screen,
    sessionAccount?.phone,
  ]);

  useEffect(() => {
    if (screen !== "portal" || !pendingGatewayTransaction?.reference) {
      return undefined;
    }

    let cancelled = false;

    const pollVerification = async () => {
      const response = await verifyPaystackPortalTransaction({
        reference: pendingGatewayTransaction.reference,
      });

      if (cancelled) return;

      if (response.success === 1) {
        await applyVerifiedPortalTransaction(response, pendingGatewayTransaction.type);
        return;
      }

      if (response.success === 0 && response.status !== "pending") {
        showMessage("error", PAYMENT_FAILED_MESSAGE);
        setPendingGatewayTransaction(null);
      }
    };

    pollVerification();
    const intervalId = window.setInterval(pollVerification, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    applyVerifiedPortalTransaction,
    pendingGatewayTransaction,
    screen,
  ]);

  useEffect(() => {
    const defaultOperator = getDefaultGatewayMobileMoneyOperator(lifecycleConfig);

    setRepaymentDraft((current) => {
      if (current.methodKey !== "mobile-money") {
        return current.mobileMoneyOperator
          ? { ...current, mobileMoneyOperator: "" }
          : current;
      }

      if (current.mobileMoneyOperator || !defaultOperator) {
        return current;
      }

      return {
        ...current,
        mobileMoneyOperator: defaultOperator,
      };
    });

    setExtensionDraft((current) => {
      if (current.methodKey !== "mobile-money") {
        return current.mobileMoneyOperator
          ? { ...current, mobileMoneyOperator: "" }
          : current;
      }

      if (current.mobileMoneyOperator || !defaultOperator) {
        return current;
      }

      return {
        ...current,
        mobileMoneyOperator: defaultOperator,
      };
    });
  }, [lifecycleConfig]);

  useEffect(() => {
    if (screen !== "portal" || !pendingGatewayTransaction?.reference) {
      return undefined;
    }

    const handleGatewayMessage = async (event) => {
      const messageType = event?.data?.type || "";
      const reference = event?.data?.reference || "";

      if (
        messageType !== "paystack-verified" ||
        reference !== pendingGatewayTransaction.reference
      ) {
        return;
      }

      const response = await verifyPaystackPortalTransaction({ reference });
      if (response.success === 1) {
        await applyVerifiedPortalTransaction(response, pendingGatewayTransaction.type);
        return;
      }

      if (response.success === 0 && response.status !== "pending") {
        showMessage("error", PAYMENT_FAILED_MESSAGE);
        setPendingGatewayTransaction(null);
      }
    };

    window.addEventListener("message", handleGatewayMessage);
    return () => window.removeEventListener("message", handleGatewayMessage);
  }, [
    applyVerifiedPortalTransaction,
    pendingGatewayTransaction,
    screen,
  ]);

  const switchToOtpFlow = (mode) => {
    resetOtpVerificationState();
    setAuthMode(mode);
    setScreen("otp");
    setOtpRequested(false);
    setFormData((current) => ({
      ...current,
      otp: {
        ...current.otp,
        otp: "",
        phone: mode === "reset" ? current.login.phone || current.personal.phone : current.otp.phone,
        countryCode: current.login.countryCode || current.personal.countryCode || selectedCountryCode,
      },
    }));
    showMessage(
      "info",
      mode === "reset"
        ? "Request OTP to reset your 4-digit PIN."
        : "Request OTP first, then verify to create your web access PIN."
    );
  };

  const handleRequestOtp = async () => {
    const phone = formData.otp.phone.trim();

    if (!isPhoneValid(phone)) {
      showMessage("error", "Enter a valid phone number before requesting OTP.");
      return;
    }

    if (isRealOtpMode && !firebaseVerificationReady) {
      showMessage("error", "Real OTP is enabled, but Firebase phone verification is not configured yet.");
      return;
    }

    resetOtpVerificationState();
    setAuthLoading(true);

    try {
      if (isRealOtpMode) {
        const resolvedCountryCode = formData.otp.countryCode || selectedCountryCode;
        const resolvedCountry =
          getCountryByCode(availableCountries, resolvedCountryCode) || selectedCountry;

        const { confirmationResult, e164Phone } = await requestFirebasePhoneOtp({
          firebaseConfig: firebaseWebConfig,
          phone,
          dialCode: resolvedCountry?.dialCode || "",
          recaptchaContainerId: "firebase-recaptcha-container",
        });

        firebaseConfirmationRef.current = confirmationResult;
        setOtpRequested(true);
        setFormData((current) => ({
          ...current,
          otp: {
            ...current.otp,
            phone,
            otp: "",
            countryCode: resolvedCountryCode,
          },
          login: {
            ...current.login,
            phone,
            countryCode: resolvedCountryCode,
          },
          personal: {
            ...current.personal,
            phone,
            countryCode: resolvedCountryCode,
          },
        }));

        if (resolvedCountryCode) {
          setSelectedCountryCode(resolvedCountryCode);
        }

        showMessage("success", `OTP sent by SMS to ${e164Phone}. Enter the code to continue.`);
        return;
      }

      const response = await requestCustomerOtp({
        phone,
        purpose: authMode,
        countryCode: formData.otp.countryCode || selectedCountryCode,
      });

      if (response.success === 0) {
        showMessage("error", response.message || "OTP request failed.");
        return;
      }

      const resolvedCountryCode =
        response.data?.country?.code || formData.otp.countryCode || selectedCountryCode;

      setOtpRequested(true);
      setFormData((current) => ({
        ...current,
        otp: {
          ...current.otp,
          phone,
          otp: "",
          countryCode: resolvedCountryCode,
        },
        login: {
          ...current.login,
          phone,
          countryCode: resolvedCountryCode,
        },
        personal: {
          ...current.personal,
          phone,
          countryCode: resolvedCountryCode,
        },
      }));

      if (resolvedCountryCode) {
        setSelectedCountryCode(resolvedCountryCode);
      }

      showMessage(
        "success",
        response.data?.otpCode
          ? `OTP requested successfully. Demo OTP: ${response.data.otpCode}`
          : "OTP requested successfully."
      );
    } catch (error) {
      setOtpRequested(false);
      showMessage("error", error?.message || "OTP request failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpRequested) {
      showMessage("error", "Request OTP first before trying to verify.");
      return;
    }

    if (!formData.otp.otp.trim()) {
      showMessage("error", "Enter the OTP code before continuing.");
      return;
    }

    setAuthLoading(true);

    try {
      if (isRealOtpMode) {
        const verification = await verifyFirebasePhoneOtp({
          confirmationResult: firebaseConfirmationRef.current,
          otp: formData.otp.otp.trim(),
        });

        setFirebaseIdToken(verification.idToken);
        firebaseConfirmationRef.current = null;
      } else {
        const response = await verifyCustomerOtp({
          phone: formData.otp.phone.trim(),
          otp: formData.otp.otp.trim(),
          purpose: authMode,
          countryCode: formData.otp.countryCode || selectedCountryCode,
        });

        if (response.success === 0) {
          showMessage("error", response.message || "OTP verification failed.");
          return;
        }
      }

      resetFirebasePhoneVerification();
      setScreen("pin");
      showMessage(
        "success",
        authMode === "reset"
          ? "OTP verified. Set your new 4-digit PIN."
          : "OTP verified. Create a 4-digit PIN to continue."
      );
    } catch (error) {
      showMessage("error", error?.message || "OTP verification failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSavePin = async () => {
    const pin = formData.pinSetup.pin.trim();
    const confirmPin = formData.pinSetup.confirmPin.trim();

    if (!isPinValid(pin)) {
      showMessage("error", "PIN must be exactly 4 digits.");
      return;
    }

    if (pin !== confirmPin) {
      showMessage("error", "PIN and confirm PIN must match.");
      return;
    }

    const phone = formData.otp.phone.trim();

    if (isRealOtpMode && !firebaseIdToken) {
      showMessage("error", "Verify the SMS OTP before saving your PIN.");
      return;
    }

    setAuthLoading(true);
    const response = await setCustomerPin({
      phone,
      pin,
      purpose: authMode,
      countryCode: formData.otp.countryCode || selectedCountryCode,
      firebaseIdToken: isRealOtpMode ? firebaseIdToken : "",
    });
    setAuthLoading(false);

    if (response.success === 0) {
      showMessage("error", response.message || "PIN setup failed.");
      return;
    }

    const accountPhone = response.data?.phone || phone;
    setSessionAccount(response.data || { phone: accountPhone });
    setFormData((current) => ({
      ...current,
      otp: {
        ...current.otp,
        otp: "",
      },
      login: {
        phone: accountPhone,
        pin,
        countryCode:
          response.data?.country?.code || current.login.countryCode || selectedCountryCode,
      },
      pinSetup: {
        pin: "",
        confirmPin: "",
      },
      personal: {
        ...current.personal,
        phone: accountPhone,
        countryCode:
          response.data?.country?.code || current.personal.countryCode || selectedCountryCode,
      },
    }));
    if (response.data?.country?.code) {
      setSelectedCountryCode(response.data.country.code);
    }

    setOtpRequested(false);
    resetOtpVerificationState();

    if (authMode === "reset") {
      setScreen("login");
      showMessage("success", "PIN updated. You can now sign in with your phone number.");
      return;
    }

    setApplyMode("profile");
    setActiveTab("apply");
    setScreen("portal");
    showMessage("success", "PIN saved. Complete your profile to unlock loan offers.");
  };

  const handleLogin = async () => {
    const phone = formData.login.phone.trim();
    const pin = formData.login.pin.trim();

    if (!isPhoneValid(phone)) {
      showMessage("error", "Enter a valid phone number.");
      return;
    }

    if (!isPinValid(pin)) {
      showMessage("error", "Enter your 4-digit PIN.");
      return;
    }

    setAuthLoading(true);
    const response = await loginCustomer({
      phone,
      pin,
      countryCode: formData.login.countryCode || selectedCountryCode,
    });
    setAuthLoading(false);

    if (response.success === 0) {
      showMessage("error", response.message || "Login failed.");
      return;
    }

    const accountPhone = response.data?.phone || phone;
    hydratePortalData(response.data, accountPhone);
    setActiveTab("home");
    setScreen("portal");
    showMessage(
      "success",
      response.data?.draftApplication
        ? "Signed in successfully. Your saved draft is ready."
        : response.data?.hasProfile
        ? "Signed in successfully. Welcome back."
        : "Signed in successfully. Complete your profile to continue."
    );

    await loadPortalSummary(accountPhone, { quiet: true });
  };

  const handleSaveDraft = async ({ showSuccess = true } = {}) => {
    const phone = formData.personal.phone || formData.otp.phone || formData.login.phone;

    if (!isPhoneValid(phone)) {
      showMessage("error", "A valid phone number is required before saving a draft.");
      return false;
    }

    setDraftLoading(true);
    const draftPayload = {
      ...formData,
      meta: {
        applicationStep,
      },
      otp: {
        ...formData.otp,
        phone,
        otp: "",
      },
      login: {
        ...formData.login,
        phone,
        pin: "",
      },
      pinSetup: {
        pin: "",
        confirmPin: "",
      },
      identity: {
        ...formData.identity,
        frontPhoto: toDraftFileValue(formData.identity.frontPhoto),
        backPhoto: toDraftFileValue(formData.identity.backPhoto),
        selfiePhoto: toDraftFileValue(formData.identity.selfiePhoto),
      },
    };

    const response = await saveApplicationDraft({
      phone,
      countryCode: formData.personal.countryCode || selectedCountryCode,
      application: draftPayload,
    });
    setDraftLoading(false);

    if (response.success === 0) {
      showMessage("error", response.message || "Could not save draft.");
      return false;
    }

    setSessionAccount((current) => ({
      ...(current || {}),
      phone,
      draftApplication: draftPayload,
    }));

    if (showSuccess) {
      showMessage("success", "Draft saved successfully.");
    }

    return true;
  };

  const nextStep = async () => {
    if (!validateStepById(activeStep.id, formData)) {
      showMessage("error", "Provide all required information on this screen before continuing.");
      return;
    }

    const draftSaved = await handleSaveDraft({ showSuccess: false });
    if (!draftSaved) return;

    setApplicationStep((current) =>
      Math.min(current + 1, APPLICATION_STEPS.length - 1)
    );
    showMessage("info", "Draft saved. Continue with the next screen.");
  };

  const previousStep = () => {
    setApplicationStep((current) => Math.max(current - 1, 0));
    showMessage("info", "Returned to the previous screen.");
  };

  const handleSubmit = async () => {
    if (!validateStepById(activeStep.id, formData)) {
      showMessage("error", "Complete the required identity information before submitting.");
      return;
    }

    const phone = formData.personal.phone || formData.otp.phone || formData.login.phone;
    setSubmitLoading(true);
    const response = await submitApplicationProfile({
      phone,
      application: formData,
      countryCode: formData.personal.countryCode || selectedCountryCode,
      files: {
        frontPhoto: formData.identity.frontPhoto,
        backPhoto: formData.identity.backPhoto,
        selfiePhoto: formData.identity.selfiePhoto,
      },
    });
    setSubmitLoading(false);

    if (response.success === 0) {
      showMessage("error", response.message || "Profile submission failed.");
      return;
    }

    setSessionAccount((current) => ({
      ...(current || {}),
      ...(response.data || {}),
      phone,
      hasProfile: true,
      draftApplication: null,
      customer: {
        ...(current?.customer || {}),
        ...payloadPreview,
        _id: current?.customer?._id || response.data?.customerId || "",
        userId: current?.customer?.userId || response.data?.userId || "",
        phone,
        email: formData.personal.email,
        userImage: current?.customer?.userImage || "",
        educationInfo: formData.education,
        paymentMethods: current?.customer?.paymentMethods || [],
        loan: current?.customer?.loan || { loans: [] },
      },
    }));
    setApplyMode("loan");
    setActiveTab("home");
    showMessage("success", "Customer profile submitted successfully.");
    await loadPortalSummary(phone, { quiet: true });
  };

  const handleOpenApply = async () => {
    const phone = formData.personal.phone || sessionAccount?.phone || formData.login.phone;

    if (!hasProfile || hasDraft) {
      setApplyMode("profile");
      setActiveTab("apply");
      return;
    }

    const latestSummary = await loadPortalSummary(phone, { quiet: true });
    if (latestSummary?.content) {
      setPortalContent((current) => ({
        ...current,
        ...buildDefaultPortalContent(),
        ...latestSummary.content,
      }));
    }

    const nextOffer = latestSummary?.offer || loanOffer;

    setApplyMode("loan");
    setLifecycleAction("");
    setRepaymentSummaryData(null);
    setExtensionSummaryData(null);
    setExtensionDraft((current) => ({
      ...current,
      extensionKey: "",
    }));
    setLoanRequest((current) => ({
      ...syncLoanRequestWithOffer(current, nextOffer),
      stage: "builder",
      acceptedTerms: false,
    }));
    setActiveTab("apply");
  };

  const handlePortalTabChange = (nextTab) => {
    if (nextTab === "apply") {
      handleOpenApply();
      return;
    }

    setActiveTab(nextTab);
  };

  const handleReviewRepayment = async () => {
    const phone = formData.personal.phone || sessionAccount?.phone || formData.login.phone;
    const requestedAmount =
      repaymentDraft.repaymentType === "partial" ? Number(repaymentDraft.amount || 0) : undefined;

    setLifecycleLoading(true);
    const response = await fetchRepaymentSummary({
      phone,
      repaymentType: repaymentDraft.repaymentType,
      amount: requestedAmount,
    });
    setLifecycleLoading(false);

    if (response.success === 0) {
      showMessage("error", response.message || "Could not load repayment summary.");
      return;
    }

    setRepaymentSummaryData(response.data);
    setLifecycleAction("payment");
  };

  const handleReviewExtension = async (extensionKey) => {
    const phone = formData.personal.phone || sessionAccount?.phone || formData.login.phone;

    setLifecycleLoading(true);
    const response = await fetchExtensionSummary({
      phone,
      extensionKey,
    });
    setLifecycleLoading(false);

    if (response.success === 0) {
      showMessage("error", response.message || "Could not load extension summary.");
      return;
    }

    setExtensionSummaryData(response.data);
    setExtensionDraft((current) => ({
      ...current,
      extensionKey,
    }));
    setLifecycleAction("extension");
  };

  const handleSubmitRepayment = async () => {
    const phone = formData.personal.phone || sessionAccount?.phone || formData.login.phone;

    setLifecycleLoading(true);
    const response = await payCustomerLoan({
      phone,
      repaymentType: repaymentDraft.repaymentType,
      amount:
        repaymentDraft.repaymentType === "partial" ? Number(repaymentDraft.amount || 0) : undefined,
      methodKey: repaymentDraft.methodKey,
      mobileMoneyOperator:
        repaymentDraft.methodKey === "mobile-money"
          ? repaymentDraft.mobileMoneyOperator
          : "",
    });
    setLifecycleLoading(false);

    if (response.success === 0) {
      showMessage("error", PAYMENT_FAILED_MESSAGE);
      return;
    }

    if (response.success === 2) {
      setPendingGatewayTransaction({
        reference: response.data.reference || "",
        type: "repayment",
        amount: repaymentSummaryData?.amount || 0,
        methodKey: repaymentDraft.methodKey,
        provider: response.data?.provider || "",
      });
      if (response.data?.checkoutUrl) {
        window.open(response.data.checkoutUrl, "_blank", "noopener,noreferrer");
      }
      showMessage("info", PAYMENT_PENDING_MESSAGE);
      return;
    }

    showMessage("success", PAYMENT_SUCCESS_MESSAGE);
    setTransactionReceipt({
      type: "Repayment",
      amount: repaymentSummaryData?.amount || 0,
      reference: activeLoan?.loanId || repaymentSummaryData?.activeLoan?.loanId || "-",
      date: new Date().toISOString(),
      status: "Completed",
      method: getRepaymentMethodLabel(activeLoan?.repaymentOptions || [], repaymentDraft.methodKey),
      note: PAYMENT_SUCCESS_MESSAGE,
      balance: response.data?.activeLoan?.totalDue || 0,
      level: response.data?.offer?.levelLabel || "",
    });
    await loadPortalSummary(phone, { quiet: true });
    setLifecycleAction("");
    setRepaymentSummaryData(null);
    setActiveTab("home");
  };

  const handleSubmitExtension = async () => {
    const phone = formData.personal.phone || sessionAccount?.phone || formData.login.phone;

    if (!extensionDraft.extensionKey) {
      showMessage("error", "Choose an extension option first.");
      return;
    }

    setLifecycleLoading(true);
    const response = await extendCustomerLoan({
      phone,
      extensionKey: extensionDraft.extensionKey,
      methodKey: extensionDraft.methodKey,
      mobileMoneyOperator:
        extensionDraft.methodKey === "mobile-money"
          ? extensionDraft.mobileMoneyOperator
          : "",
    });
    setLifecycleLoading(false);

    if (response.success === 0) {
      showMessage("error", PAYMENT_FAILED_MESSAGE);
      return;
    }

    if (response.success === 2) {
      setPendingGatewayTransaction({
        reference: response.data.reference || "",
        type: "extension",
        amount: extensionSummaryData?.extension?.feeAmount || 0,
        methodKey: extensionDraft.methodKey,
        provider: response.data?.provider || "",
      });
      if (response.data?.checkoutUrl) {
        window.open(response.data.checkoutUrl, "_blank", "noopener,noreferrer");
      }
      showMessage("info", PAYMENT_PENDING_MESSAGE);
      return;
    }

    showMessage("success", PAYMENT_SUCCESS_MESSAGE);
    setTransactionReceipt({
      type: "Extension",
      amount: extensionSummaryData?.extension?.feeAmount || 0,
      reference: activeLoan?.loanId || extensionSummaryData?.activeLoan?.loanId || "-",
      date: new Date().toISOString(),
      status: "Completed",
      method: getRepaymentMethodLabel(activeLoan?.repaymentOptions || [], extensionDraft.methodKey),
      note: PAYMENT_SUCCESS_MESSAGE,
      newDueDate:
        response.data?.activeLoan?.dueDate || extensionSummaryData?.extension?.extendedDueDate,
    });
    await loadPortalSummary(phone, { quiet: true });
    setLifecycleAction("");
    setExtensionSummaryData(null);
    setActiveTab("home");
  };

  const handleLoanReview = () => {
    if (!loanOffer) {
      showMessage("error", "Loan offer data is still loading.");
      return;
    }

    if (!loanRequest.paymentMethod) {
      showMessage("error", "Select a payout method before continuing.");
      return;
    }

    if (
      lifecycleConfig?.collectionGateway === "bridge" &&
      !String(loanRequest.paymentMethod || "").includes("@") &&
      !String(loanRequest.paymentOperator || "").trim()
    ) {
      showMessage("error", "Select the mobile money provider for this payout number.");
      return;
    }

    if (!isNotEmpty(loanRequest.useLoan)) {
      showMessage("error", "Tell us what the loan will be used for.");
      return;
    }

    if (selectedAmount < Number(loanOffer.minAmount || 0) || selectedAmount > Number(loanOffer.maxAmount || 0)) {
      showMessage(
        "error",
        `Choose an amount between ${formatCurrency(loanOffer.minAmount)} and ${formatCurrency(
          loanOffer.maxAmount
        )}.`
      );
      return;
    }

    setLoanRequest((current) => ({
      ...current,
      stage: "review",
    }));
    showMessage("info", "Review the summary and accept the terms before applying.");
  };

  const handleApplyLoan = async () => {
    const phone = formData.personal.phone || sessionAccount?.phone || formData.login.phone;

    if (!loanRequest.acceptedTerms) {
      showMessage("error", "You must accept the terms and conditions before applying.");
      return;
    }

    setLoanApplying(true);
    const response = await applyCustomerLoan({
      phone,
      amount: selectedAmount,
      termKey: loanRequest.termKey,
      paymentMethod: loanRequest.paymentMethod,
      paymentOperator: loanRequest.paymentOperator,
      useLoan: loanRequest.useLoan,
      acceptedTerms: loanRequest.acceptedTerms,
      countryCode: sessionAccount?.country?.code || formData.personal.countryCode || selectedCountryCode,
    });
    setLoanApplying(false);

    if (response.success === 0) {
      showMessage("error", response.message || "Could not submit the loan application.");
      return;
    }

    showMessage("success", "Loan application submitted successfully and synced with admin review.");
    setLoanRequest((current) => ({
      ...current,
      acceptedTerms: false,
      stage: "builder",
    }));
    await loadPortalSummary(phone, { quiet: true });
    setActiveTab("history");
  };

  const openProfileEditor = (step = 0) => {
    setApplyMode("profile");
    setApplicationStep(step);
    setActiveTab("apply");
  };

  const handleLogout = () => {
    const fallbackCountryCode =
      portalContent?.activeCountry?.code || buildDefaultPortalContent().activeCountry.code;
    resetOtpVerificationState();
    setScreen("login");
    setActiveTab("home");
    setApplyMode("profile");
    setApplicationStep(0);
    setSessionAccount(null);
    setLoanOffer(null);
    setLoanRequest(buildInitialLoanRequest());
    setPortalContent(buildDefaultPortalContent());
    setSelectedCountryCode(fallbackCountryCode);
    setActiveLoan(null);
    setLifecycleAction("");
    setRepaymentDraft(buildInitialRepaymentDraft());
    setExtensionDraft(buildInitialExtensionDraft());
    setRepaymentSummaryData(null);
    setExtensionSummaryData(null);
    setTransactionReceipt(null);
    setFormData(buildInitialState());
    setOtpRequested(false);
    showMessage("info", "Sign in with phone number and your 4-digit PIN, or create a new application.");
  };

  return (
    <div className={`app-shell ${screen === "portal" ? "app-shell-portal" : ""}`}>
      <div className={`app-stage ${screen === "portal" ? "app-stage-portal" : ""}`}>
        <header
          className={`hero-panel ${screen === "portal" ? "hero-panel-wide" : "hero-panel-auth"}`}
        >
          <div className="brand-inline">
            {brandLogoUrl && !brandLogoLoadFailed ? (
              <img
                src={brandLogoUrl}
                alt={brandName}
                className="brand-mark brand-mark-image"
                onError={() => setBrandLogoLoadFailed(true)}
              />
            ) : (
              <div className="brand-mark">{brandName.slice(0, 1).toUpperCase()}</div>
            )}
            <div>
              <h1>{brandName}</h1>
              <p className="hero-copy">{brandTagline}</p>
            </div>
          </div>
        </header>

        <InstallAppPrompt />

        {screen !== "portal" ? (
          <section className="form-card form-card-auth">
            <div className="message-stack">
              <div className={`message-banner message-${appMessage.type}`}>{appMessage.text}</div>
            </div>

            {screen === "login" ? (
              <>
                <div className="section-head compact-head">
                  <div>
                    <p className="section-kicker">Welcome back</p>
                    <h2>Login</h2>
                  </div>
                </div>

                <div className="form-grid single">
                  <Field
                    label="Phone number"
                    placeholder={selectedCountry?.phoneExample || "0970000000"}
                    value={formData.login.phone}
                    onChange={(value) => updateSection("login", "phone", value)}
                  />
                  <Field
                    label="4-digit PIN"
                    type="password"
                    placeholder="Enter PIN"
                    value={formData.login.pin}
                    onChange={(value) => updateSection("login", "pin", value)}
                  />
                </div>

                <div className="link-row">
                  <button type="button" className="inline-link" onClick={() => switchToOtpFlow("signup")}>
                    Sign up
                  </button>
                  <button type="button" className="inline-link" onClick={() => switchToOtpFlow("reset")}>
                    Forgot PIN?
                  </button>
                </div>

                <div className="actions single-action">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleLogin}
                    disabled={authLoading}
                  >
                    {authLoading ? "Signing in..." : "Login"}
                  </button>
                </div>
              </>
            ) : null}

            {screen === "otp" ? (
              <>
                <div className="section-head compact-head">
                  <div>
                    <p className="section-kicker">{authMode === "reset" ? "Reset access" : "New application"}</p>
                    <h2>Verify phone</h2>
                  </div>
                </div>

                <div className="form-grid single">
                  <CountrySelectField
                    label="Country"
                    value={formData.otp.countryCode || selectedCountryCode}
                    onChange={handleCountryChange}
                    countries={availableCountries}
                  />
                  <Field
                    label="Phone number"
                    placeholder={selectedCountry?.phoneExample || "0970000000"}
                    value={formData.otp.phone}
                    onChange={(value) => updateSection("otp", "phone", value)}
                  />
                  <div className="inline-button-row">
                    <button
                      type="button"
                      className="ghost-btn slim-btn"
                      onClick={handleRequestOtp}
                      disabled={authLoading}
                    >
                      {authLoading ? "Requesting..." : "Request OTP"}
                    </button>
                  </div>
                  <Field
                    label="OTP code"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp.otp}
                    onChange={(value) => updateSection("otp", "otp", value)}
                  />
                </div>

                {otpRequested ? (
                  <p className="support-copy">
                    {isRealOtpMode
                      ? `OTP requested for ${formData.otp.phone}. Enter the SMS code sent to your phone.`
                      : `OTP requested for ${formData.otp.phone}. Use the demo code shown in the message banner.`}
                  </p>
                ) : null}
                {isRealOtpMode ? <div id="firebase-recaptcha-container" /> : null}

                <div className="actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      resetOtpVerificationState();
                      setOtpRequested(false);
                      setScreen("login");
                    }}
                    disabled={authLoading}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleVerifyOtp}
                    disabled={authLoading}
                  >
                    {authLoading ? "Verifying..." : "Verify and continue"}
                  </button>
                </div>
              </>
            ) : null}

            {screen === "pin" ? (
              <>
                <div className="section-head compact-head">
                  <div>
                    <p className="section-kicker">{authMode === "reset" ? "Reset PIN" : "Secure account"}</p>
                    <h2>Set 4-digit PIN</h2>
                  </div>
                </div>

                <div className="form-grid single">
                  <Field
                    label="4-digit PIN"
                    type="password"
                    placeholder="Create PIN"
                    value={formData.pinSetup.pin}
                    onChange={(value) => updateSection("pinSetup", "pin", value)}
                  />
                  <Field
                    label="Confirm PIN"
                    type="password"
                    placeholder="Repeat PIN"
                    value={formData.pinSetup.confirmPin}
                    onChange={(value) => updateSection("pinSetup", "confirmPin", value)}
                  />
                </div>

                <div className="actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setScreen("otp")}
                    disabled={authLoading}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleSavePin}
                    disabled={authLoading}
                  >
                    {authLoading ? "Saving..." : "Save PIN"}
                  </button>
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {screen === "portal" ? (
          <section className="form-card portal-card">
            <div className="portal-card-body">
              <div className="message-stack">
                <div className={`message-banner message-${appMessage.type}`}>{appMessage.text}</div>
              </div>

              {portalLoading ? <div className="portal-loading">Loading customer portal...</div> : null}

              {activeTab === "home" ? (
                <HomeTab
                  displayName={displayName}
                  offer={loanOffer}
                  content={portalContent}
                  transactionReceipt={transactionReceipt}
                  hasProfile={hasProfile}
                  hasDraft={hasDraft}
                  onStartApply={handleOpenApply}
                  onOpenHistory={() => setActiveTab("history")}
                />
              ) : null}

              {activeTab === "apply" ? (
                applyMode === "loan" && hasProfile && !hasDraft ? (
                  <LoanApplyTab
                    offer={loanOffer}
                    loanRequest={loanRequest}
                    activeLoan={activeLoan}
                    selectedAmount={selectedAmount}
                    loanSummary={loanSummary}
                    loanApplying={loanApplying}
                    lifecycleLoading={lifecycleLoading}
                    lifecycleAction={lifecycleAction}
                    lifecycleConfig={lifecycleConfig}
                    repaymentDraft={repaymentDraft}
                    extensionDraft={extensionDraft}
                    repaymentSummaryData={repaymentSummaryData}
                    extensionSummaryData={extensionSummaryData}
                    onChange={updateLoanRequest}
                    onRepaymentDraftChange={(field, value) => {
                      setRepaymentDraft((current) => ({
                        ...current,
                        [field]: value,
                        ...(field === "methodKey" && value !== "mobile-money"
                          ? { mobileMoneyOperator: "" }
                          : {}),
                        ...(field === "methodKey" &&
                        value === "mobile-money" &&
                        !current.mobileMoneyOperator
                          ? {
                              mobileMoneyOperator:
                                getDefaultGatewayMobileMoneyOperator(lifecycleConfig),
                            }
                          : {}),
                      }));
                      setRepaymentSummaryData(null);
                    }}
                    onGoReview={handleLoanReview}
                    onGoBuilder={() =>
                      setLoanRequest((current) => ({
                        ...current,
                        stage: "builder",
                      }))
                    }
                    onApply={handleApplyLoan}
                    onReviewRepayment={handleReviewRepayment}
                    onReviewExtension={handleReviewExtension}
                    onSubmitRepayment={handleSubmitRepayment}
                    onSubmitExtension={handleSubmitExtension}
                    onOpenRepayment={() => {
                      setLifecycleAction("payment");
                      setRepaymentSummaryData(null);
                    }}
                    onOpenExtension={() => {
                      setLifecycleAction("extension");
                      setExtensionSummaryData(null);
                    }}
                    onExtensionDraftChange={(field, value) => {
                      setExtensionDraft((current) => ({
                        ...current,
                        [field]: value,
                        ...(field === "methodKey" && value !== "mobile-money"
                          ? { mobileMoneyOperator: "" }
                          : {}),
                        ...(field === "methodKey" &&
                        value === "mobile-money" &&
                        !current.mobileMoneyOperator
                          ? {
                              mobileMoneyOperator:
                                getDefaultGatewayMobileMoneyOperator(lifecycleConfig),
                            }
                          : {}),
                      }));
                      setExtensionSummaryData(null);
                    }}
                    onClearLifecycleAction={() => {
                      setLifecycleAction("");
                      setRepaymentSummaryData(null);
                      setExtensionSummaryData(null);
                    }}
                    onOpenRecords={() => setActiveTab("history")}
                  />
                ) : (
                  <ProfileApplicationFlow
                    activeStep={activeStep}
                    applicationStep={applicationStep}
                    formData={formData}
                    draftLoading={draftLoading}
                    submitLoading={submitLoading}
                    updateSection={updateSection}
                    updateEmergencyContact={updateEmergencyContact}
                    handleSaveDraft={handleSaveDraft}
                    previousStep={previousStep}
                    nextStep={nextStep}
                    handleSubmit={handleSubmit}
                  />
                )
              ) : null}

              {activeTab === "history" ? (
                <RecordsTab
                  records={loanRecords}
                  paymentHistory={paymentHistory}
                  onStartApplication={handleOpenApply}
                />
              ) : null}

              {activeTab === "profile" ? (
                <ProfileTab
                  displayName={displayName}
                  sessionAccount={sessionAccount}
                  formData={formData}
                  offer={loanOffer}
                  onEditProfile={() => openProfileEditor(0)}
                  onResetPin={() => switchToOtpFlow("reset")}
                  onLogout={handleLogout}
                />
              ) : null}

              <footer className="portal-footer-note">
                <span>
                  {brandName} · {footerText}
                </span>
                <span>Version {footerVersion}</span>
              </footer>
            </div>
            <BottomNav activeTab={activeTab} onChange={handlePortalTabChange} />
          </section>
        ) : null}

        {screen !== "portal" ? (
          <footer className="portal-footer-note">
            <span>
              {brandName} · {footerText}
            </span>
            <span>Version {footerVersion}</span>
          </footer>
        ) : null}
      </div>
    </div>
  );
}

function HomeTab({
  displayName,
  offer,
  content,
  transactionReceipt,
  hasProfile,
  hasDraft,
  onStartApply,
  onOpenHistory,
}) {
  const canApplyNow = Boolean(offer?.canApply);
  const faqItems = content?.faqs?.length ? content.faqs : buildDefaultPortalContent().faqs;
  const guideItems =
    content?.repaymentTutorials?.length
      ? content.repaymentTutorials
      : buildDefaultPortalContent().repaymentTutorials;
  const homeBannerImageUrl = resolveMediaUrl(
    content?.homeBannerImageUrl || buildDefaultPortalContent().homeBannerImageUrl
  );
  const supportItems = [
    { label: "WhatsApp", value: content?.supportWhatsapp || buildDefaultPortalContent().supportWhatsapp },
    { label: "Phone", value: content?.supportPhone || buildDefaultPortalContent().supportPhone },
    { label: "Email", value: content?.supportEmail || buildDefaultPortalContent().supportEmail },
  ].filter((item) => item.value);

  return (
    <div className="portal-stack">
      <div className="home-hero-card home-hero-card-compact">
        <h2>Welcome {displayName}</h2>
      </div>

      {homeBannerImageUrl ? (
        <div className="home-banner-card">
          <img src={homeBannerImageUrl} alt="Home banner" />
        </div>
      ) : null}

      <div className="quick-stats-grid quick-stats-grid-mobile">
        <div className="quick-stat-card">
          <small>Available Credit</small>
          <strong>{formatCurrency(offer?.availableCredit || 0)}</strong>
        </div>
        <div className="quick-stat-card">
          <small>Completed Loans</small>
          <strong>{String(offer?.settledLoans || 0)}</strong>
        </div>
        <div className="quick-stat-card">
          <small>Credit Score</small>
          <strong>{String(offer?.creditScore || 0)}</strong>
        </div>
      </div>

      {transactionReceipt ? (
        <div className="transaction-receipt-card">
          <div className="offer-card-head">
            <p className="section-kicker">Latest Transaction</p>
            <h2>{transactionReceipt.type}</h2>
          </div>
          <div className="receipt-badge-row">
            <span className="status-pill">{transactionReceipt.status}</span>
            {transactionReceipt.level ? (
              <span className="level-pill">{transactionReceipt.level}</span>
            ) : null}
          </div>
          <ReviewRow label="Type" value={transactionReceipt.type} />
          <ReviewRow label="Amount" value={formatCurrency(transactionReceipt.amount || 0)} />
          <ReviewRow label="Reference" value={transactionReceipt.reference || "-"} />
          <ReviewRow label="Method" value={transactionReceipt.method || "-"} />
          {transactionReceipt.balance !== undefined ? (
            <ReviewRow
              label="Outstanding Balance"
              value={formatCurrency(transactionReceipt.balance || 0)}
            />
          ) : null}
          {transactionReceipt.newDueDate ? (
            <ReviewRow
              label="New Due Date"
              value={formatDate(transactionReceipt.newDueDate)}
              emphasis
            />
          ) : null}
          <ReviewRow label="Date" value={formatDate(transactionReceipt.date)} />
          {transactionReceipt.note ? (
            <div className="warning-note receipt-note">
              <strong>Update:</strong> {transactionReceipt.note}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="home-feature-grid">
        <FeatureActionCard
          tone="blue"
          title="Apply"
          text={
            hasDraft
              ? "Continue your draft profile or application."
              : !hasProfile
              ? "Complete your profile first to unlock loan offers."
              : canApplyNow
              ? `Get instant loans up to ${formatCurrency(offer?.maxAmount || 0)}`
              : `Current loan status: ${offer?.activeLoanStatus || "Review"}`
          }
          buttonLabel={hasDraft ? "Continue Profile" : canApplyNow ? "Apply Now" : "Open Apply"}
          onClick={onStartApply}
        />
        <FeatureActionCard
          tone="green"
          title="Records"
          text="Open loan records and payment history."
          buttonLabel="Open Records"
          onClick={onOpenHistory}
        />
      </div>

      <GuideAccordion title="Repayment Tutorials" items={guideItems} tone="blue" />
      <GuideAccordion title="Frequently Asked Questions" items={faqItems} tone="cyan" />

      <div className="support-card-list">
        {supportItems.map((item) => (
          <div key={item.label} className="support-card-row">
            <div className={`support-dot support-dot-${item.label.toLowerCase()}`} />
            <div>
              <strong>{item.label}</strong>
              <p>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoanApplyTab({
  offer,
  activeLoan,
  loanRequest,
  selectedAmount,
  loanSummary,
  loanApplying,
  lifecycleLoading,
  lifecycleAction,
  lifecycleConfig,
  repaymentDraft,
  extensionDraft,
  repaymentSummaryData,
  extensionSummaryData,
  onChange,
  onRepaymentDraftChange,
  onExtensionDraftChange,
  onGoReview,
  onGoBuilder,
  onApply,
  onReviewRepayment,
  onReviewExtension,
  onSubmitRepayment,
  onSubmitExtension,
  onOpenRepayment,
  onOpenExtension,
  onClearLifecycleAction,
}) {
  if (!offer) {
    return <div className="portal-loading">Loading available loan offer...</div>;
  }

  const mobileMoneyOperatorOptions = getGatewayMobileMoneyNetworks(lifecycleConfig);
  const collectionGateway = String(lifecycleConfig?.collectionGateway || "").trim();
  const requiresMobileMoneyOperator =
    lifecycleConfig?.requiresMobileMoneyOperator === true;

  if (!offer.canApply) {
    if (activeLoan?.statusKey === "review") {
      return (
        <div className="portal-stack">
          <div className="loan-lock-card">
            <div className="offer-card-head">
              <p className="section-kicker">Loan Status</p>
              <h2>{activeLoan.title}</h2>
            </div>
            <span className="status-pill">{activeLoan.status}</span>
            <p className="lock-copy">{activeLoan.message}</p>
            <div className="warning-note">
              <strong>Please note:</strong> Your application is under review. Customer service will call you to verify the details you submitted.
            </div>
          </div>

        </div>
      );
    }

    if (activeLoan?.statusKey === "awaiting-disbursement") {
      return (
        <div className="portal-stack">
          <div className="loan-lock-card">
            <div className="offer-card-head">
              <p className="section-kicker">Loan Status</p>
              <h2>{activeLoan.title}</h2>
            </div>
            <span className="status-pill">{activeLoan.status}</span>
            <p className="lock-copy">{activeLoan.message}</p>
            <div className="warning-note">
              <strong>Next step:</strong> Once the admin confirms the manual disbursement, your
              due date and repayment countdown will start automatically.
            </div>
          </div>

        </div>
      );
    }

    if (activeLoan?.statusKey === "approved" || activeLoan?.statusKey === "overdue") {
      return (
        <div className="portal-stack">
          <div className={`loan-status-hero ${activeLoan.statusKey === "overdue" ? "loan-status-hero-overdue" : ""}`}>
            <div className="loan-status-hero-top">
              <div>
                <p className="section-kicker">Active Loan</p>
                <h2>{activeLoan.title}</h2>
                <p className="lock-copy">{activeLoan.message}</p>
              </div>
              <span className="status-pill">{activeLoan.status}</span>
            </div>

            <div className="loan-status-grid">
              <LoanStatusMetric
                label="Loan Amount"
                value={formatCurrency(activeLoan.amount || 0)}
              />
              <LoanStatusMetric
                label="Total Due"
                value={formatCurrency(activeLoan.totalDue || 0)}
                emphasis
              />
              <LoanStatusMetric
                label="Due Date"
                value={formatDate(activeLoan.dueDate)}
              />
              <LoanStatusMetric
                label="Time Left"
                value={formatDaysLabel(activeLoan.daysRemaining)}
              />
              <LoanStatusMetric
                label="Outstanding"
                value={formatCurrency(activeLoan.outstandingBalance || 0)}
              />
              <LoanStatusMetric
                label="Penalty"
                value={formatCurrency(activeLoan.overduePenalty || 0)}
              />
            </div>

            <div className="loan-status-footer">
              <span>Loan ID: {activeLoan.loanId || "-"}</span>
              <span>
                {activeLoan.statusKey === "approved"
                  ? "Pay or extend before the due date."
                  : "Settle overdue amount to avoid more charges."}
              </span>
            </div>
          </div>

          {lifecycleAction === "payment" ? (
            <div className="portal-stack">
              <div className="offer-card">
                <div className="offer-card-head">
                  <p className="section-kicker">Repayment Setup</p>
                  <h2>Make Payment</h2>
                </div>
                <div className="term-grid">
                  <button
                    type="button"
                    className={`term-card ${
                      repaymentDraft.repaymentType === "full" ? "term-card-active" : ""
                    }`}
                    onClick={() => onRepaymentDraftChange("repaymentType", "full")}
                  >
                    <strong>Full Payment</strong>
                    <span>Pay everything including penalties</span>
                  </button>
                  <button
                    type="button"
                    className={`term-card ${
                      repaymentDraft.repaymentType === "partial" ? "term-card-active" : ""
                    }`}
                    onClick={() => onRepaymentDraftChange("repaymentType", "partial")}
                  >
                    <strong>Partial Payment</strong>
                    <span>Choose how much to repay now</span>
                  </button>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>Payment method</span>
                    <select
                      value={repaymentDraft.methodKey}
                      onChange={(event) => onRepaymentDraftChange("methodKey", event.target.value)}
                    >
                      <option value="">Select payment method</option>
                      {(activeLoan.repaymentOptions || []).map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {repaymentDraft.methodKey === "mobile-money" &&
                  mobileMoneyOperatorOptions.length > 0 ? (
                    <label className="field">
                      <span>Mobile money operator</span>
                      <select
                        value={repaymentDraft.mobileMoneyOperator}
                        onChange={(event) =>
                          onRepaymentDraftChange("mobileMoneyOperator", event.target.value)
                        }
                      >
                        <option value="">Select operator</option>
                        {mobileMoneyOperatorOptions.map((item) => (
                          <option key={item.key} value={item.key}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  {repaymentDraft.repaymentType === "partial" ? (
                    <Field
                      label="Repayment Amount"
                      value={repaymentDraft.amount}
                      onChange={(value) => onRepaymentDraftChange("amount", value)}
                    />
                  ) : null}
                </div>
              </div>

              {repaymentSummaryData ? (
                <div className="review-card">
                  <ReviewRow
                    label="Repayment Type"
                    value={
                      repaymentSummaryData.repaymentType === "partial"
                        ? "Partial payment"
                        : "Full payment"
                    }
                  />
                  <ReviewRow
                    label="Amount to Pay"
                    value={formatCurrency(repaymentSummaryData.amount || 0)}
                    emphasis
                  />
                  <div className="warning-note">
                    <strong>Next step:</strong> customer self-service gateway charge is prepared from this summary. Final gateway submission is the next phase.
                  </div>
                </div>
              ) : null}

              <div className="actions portal-actions">
                <button type="button" className="ghost-btn" onClick={onClearLifecycleAction}>
                  Back
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={repaymentSummaryData ? onSubmitRepayment : onReviewRepayment}
                  disabled={
                    lifecycleLoading ||
                    !repaymentDraft.methodKey ||
                    (repaymentDraft.methodKey === "mobile-money" &&
                      requiresMobileMoneyOperator &&
                      !repaymentDraft.mobileMoneyOperator) ||
                    (repaymentDraft.repaymentType === "partial" && !repaymentDraft.amount)
                  }
                >
                  {lifecycleLoading
                    ? "Processing..."
                    : repaymentSummaryData
                    ? "Pay Now"
                    : "Review Payment"}
                </button>
              </div>
              {repaymentDraft.methodKey === "mobile-money" && requiresMobileMoneyOperator ? (
                <div className="warning-note">
                  <strong>Gateway:</strong> {collectionGateway || "Mobile money"} requires you to
                  choose the operator before sending the prompt.
                </div>
              ) : null}
            </div>
          ) : null}

          {lifecycleAction === "extension" ? (
            <div className="portal-stack">
              <div className="offer-card">
                <div className="offer-card-head">
                  <p className="section-kicker">Extension Options</p>
                  <h2>Choose extension</h2>
                </div>
                <div className="term-grid">
                  {(activeLoan.extensionOptions || []).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="term-card"
                      onClick={() => onReviewExtension(item.key)}
                    >
                      <strong>{item.label}</strong>
                      <div className="term-card-meta-row">
                        <span>{item.days} days</span>
                        <span>{item.feeRate}% fee</span>
                      </div>
                      <span className="term-card-amount">
                        {formatCurrency(item.feeAmount || 0)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {extensionSummaryData?.extension ? (
                <div className="review-card">
                  <ReviewRow label="Selected Option" value={extensionSummaryData.extension.label} />
                  <ReviewRow
                    label="Extension Fee"
                    value={formatCurrency(extensionSummaryData.extension.feeAmount || 0)}
                  />
                  <ReviewRow
                    label="Extended Due Date"
                    value={formatDate(extensionSummaryData.extension.extendedDueDate)}
                    emphasis
                  />
                  <div className="warning-note">
                    <strong>Rule:</strong> extension is only allowed on or before the due date, and the new date starts from the current due date.
                  </div>
                </div>
              ) : null}

              <div className="offer-card">
                <div className="offer-card-head">
                  <p className="section-kicker">Charge Method</p>
                  <h2>Extension Payment Method</h2>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>Payment method</span>
                    <select
                      value={extensionDraft.methodKey}
                      onChange={(event) =>
                        onExtensionDraftChange("methodKey", event.target.value)
                      }
                    >
                      <option value="">Select payment method</option>
                      {(activeLoan.repaymentOptions || []).map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {extensionDraft.methodKey === "mobile-money" &&
                  mobileMoneyOperatorOptions.length > 0 ? (
                    <label className="field">
                      <span>Mobile money operator</span>
                      <select
                        value={extensionDraft.mobileMoneyOperator}
                        onChange={(event) =>
                          onExtensionDraftChange("mobileMoneyOperator", event.target.value)
                        }
                      >
                        <option value="">Select operator</option>
                        {mobileMoneyOperatorOptions.map((item) => (
                          <option key={item.key} value={item.key}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              </div>

              <div className="actions portal-actions">
                <button type="button" className="ghost-btn" onClick={onClearLifecycleAction}>
                  Back
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={extensionSummaryData ? onSubmitExtension : () => onReviewExtension(extensionDraft.extensionKey)}
                  disabled={
                    lifecycleLoading ||
                    !extensionDraft.methodKey ||
                    (extensionDraft.methodKey === "mobile-money" &&
                      requiresMobileMoneyOperator &&
                      !extensionDraft.mobileMoneyOperator) ||
                    !extensionDraft.extensionKey
                  }
                >
                  {lifecycleLoading
                    ? "Processing..."
                    : extensionSummaryData
                    ? "Pay Extension Fee"
                    : "Review Extension"}
                </button>
              </div>
            </div>
          ) : null}

          {!lifecycleAction ? (
            <div className="actions portal-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={onOpenRepayment}
                disabled={!activeLoan.canMakePayment}
              >
                Make Payment
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={onOpenExtension}
                disabled={!activeLoan.canExtend || !(activeLoan.extensionOptions || []).length}
              >
                Extension
              </button>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="portal-stack">
        <div className="loan-lock-card">
          <div className="offer-card-head">
            <p className="section-kicker">Loan Status</p>
            <h2>Application unavailable</h2>
          </div>
          <span className="status-pill">{offer.activeLoanStatus || "Review"}</span>
          <p className="lock-copy">
            You already have a loan linked to your account. Finish the current loan before starting
            another application.
          </p>
          <div className="level-overview-grid">
            <div className="level-box">
              <strong>{offer.levelLabel}</strong>
              <span>Available credit now: {formatCurrency(offer.availableCredit || 0)}</span>
              <span>{offer.nextLevelMessage}</span>
            </div>
            <div className="level-progress-box">
              <strong>Next level</strong>
              <p>Repay the current loan successfully to unlock Level {offer.nextLevel} offers.</p>
              <div className="level-progress-bar">
                <span style={{ width: "35%" }} />
              </div>
              <small>Current status: {offer.activeLoanStatus || "Review"}</small>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="portal-stack">
      {loanRequest.stage === "builder" ? (
        <>
          <div className="offer-card">
            <div className="offer-card-head">
              <p className="section-kicker">Loan Amount</p>
              <h2>{formatCurrency(selectedAmount)}</h2>
            </div>
            <input
              className="amount-slider"
              type="range"
              min={offer.minAmount}
              max={offer.maxAmount}
              step="10"
              value={selectedAmount}
              onChange={(event) => onChange("amount", Number(event.target.value))}
            />
            <div className="range-row">
              <span>{formatCurrency(offer.minAmount)}</span>
              <span>{formatCurrency(offer.maxAmount)}</span>
            </div>
            <div className="level-pill-row">
              <span className="level-pill">{offer.levelLabel}</span>
            </div>
          </div>

          <div className="offer-card">
            <div className="offer-card-head">
              <p className="section-kicker">Loan Term</p>
              <h2>Choose a term</h2>
            </div>
            <div className="term-grid">
              {offer.termOptions.map((term) => (
                <button
                  key={term.key}
                  type="button"
                  className={`term-card ${loanRequest.termKey === term.key ? "term-card-active" : ""}`}
                  onClick={() => onChange("termKey", term.key)}
                >
                  <strong>{term.label}</strong>
                  <div className="term-card-meta-row">
                    <span>{term.interestRate}% interest</span>
                    <span>+{term.serviceFeeRate}% service</span>
                  </div>
                  <span className="term-card-amount">
                    +{term.processingFeeRate}% processing
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="offer-card offer-card-level">
            <div className="offer-card-head">
              <p className="section-kicker">Your Loan Level</p>
              <h2>{offer.levelLabel}</h2>
            </div>
            <div className="level-overview-grid">
              <div className="level-box">
                <strong>{offer.levelLabel}</strong>
                <span>Loan Range: {formatCurrency(offer.minAmount)} - {formatCurrency(offer.maxAmount)}</span>
                <span>Interest varies by term</span>
              </div>
              <div className="level-progress-box">
                <strong>Progress to Next Level</strong>
                <p>{offer.nextLevelMessage}</p>
                <div className="level-progress-bar">
                  <span style={{ width: offer.canApply ? "72%" : "35%" }} />
                </div>
                <small>Target: Level {offer.nextLevel}</small>
              </div>
            </div>
          </div>

          <div className="offer-card">
            <div className="form-grid">
              <label className="field">
                <span>Payout method</span>
                <select
                  value={loanRequest.paymentMethod}
                  onChange={(event) => onChange("paymentMethod", event.target.value)}
                >
                  <option value="">Select payout method</option>
                  {(offer.paymentMethods || []).map((method) => (
                    <option key={`${method.method}-${method.operator}`} value={method.method}>
                      {method.method}
                    </option>
                  ))}
                </select>
              </label>
              {!String(loanRequest.paymentMethod || "").includes("@") && mobileMoneyOperatorOptions.length > 0 ? (
                <label className="field">
                  <span>Service provider</span>
                  <select
                    value={loanRequest.paymentOperator || ""}
                    onChange={(event) => onChange("paymentOperator", event.target.value)}
                  >
                    <option value="">Select service provider</option>
                    {mobileMoneyOperatorOptions.map((network) => (
                      <option key={network.key || network.label} value={network.label || network.key}>
                        {network.label || network.key}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <Field
                label="Use of loan"
                value={loanRequest.useLoan}
                onChange={(value) => onChange("useLoan", value)}
              />
            </div>
          </div>

          <div className="actions portal-actions">
            <button type="button" className="ghost-btn" onClick={onGoReview}>
              Review loan
            </button>
          </div>
        </>
      ) : (
        <div className="portal-stack">
          <div className="review-card">
            <div className="offer-card-head">
              <p className="section-kicker">Loan Summary</p>
              <h2>{formatCurrency(selectedAmount)}</h2>
            </div>
            <ReviewRow label="Loan Amount" value={formatCurrency(selectedAmount)} />
            <ReviewRow label="Interest" value={formatCurrency(loanSummary?.interestAmount || 0)} />
            <ReviewRow label="Service Fee" value={formatCurrency(loanSummary?.serviceFeeAmount || 0)} />
            <ReviewRow label="Processing Fee" value={formatCurrency(loanSummary?.processingFeeAmount || 0)} />
            <ReviewRow label="Commitment Fee" value={formatCurrency(loanSummary?.commitmentFeeAmount || 0)} />
            <ReviewRow label="Total Repayment" value={formatCurrency(loanSummary?.totalRepayment || 0)} emphasis />
            <div className="warning-note">
              <strong>Important:</strong> Overdue penalty of <strong>2% per day</strong> applies to late payments.
            </div>
            <ReviewRow label="Total Fee Rate" value={`${loanSummary?.totalFeeRate || 0}%`} />
            <ReviewRow label="Due Date" value={formatDate(loanSummary?.dueDate)} />
            <ReviewRow label="Payout method" value={loanRequest.paymentMethod || "-"} />
            {!String(loanRequest.paymentMethod || "").includes("@") ? (
              <ReviewRow label="Service provider" value={loanRequest.paymentOperator || "-"} />
            ) : null}
          </div>

          <div className="terms-card">
            <div className="offer-card-head">
              <p className="section-kicker">Terms and Conditions</p>
              <h2>Read before applying</h2>
            </div>
            <ol className="terms-list">
              <li>Loan approval is subject to admin review.</li>
              <li>Personal and financial information is used only for loan processing.</li>
              <li>Default on repayment may result in penalties and affect future eligibility.</li>
              <li>Support is available through customer service if your status changes.</li>
              <li>By checking the box below, you agree to these terms.</li>
            </ol>

            <label className="terms-check">
              <input
                type="checkbox"
                checked={loanRequest.acceptedTerms}
                onChange={(event) => onChange("acceptedTerms", event.target.checked)}
              />
              <span>I have read and agree to the Terms and Conditions</span>
            </label>
          </div>

          <div className="actions portal-actions">
            <button type="button" className="ghost-btn" onClick={onGoBuilder}>
              Back
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={onApply}
              disabled={!loanRequest.acceptedTerms || loanApplying}
            >
              {loanApplying
                ? "Applying..."
                : loanRequest.acceptedTerms
                ? "Apply Loan"
                : "Accept Terms to Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileApplicationFlow({
  activeStep,
  applicationStep,
  formData,
  draftLoading,
  submitLoading,
  updateSection,
  updateEmergencyContact,
  handleSaveDraft,
  previousStep,
  nextStep,
  handleSubmit,
}) {
  return (
    <>
      <div className="section-head apply-head">
        <div>
          <p className="section-kicker">Profile setup</p>
          <h2>{activeStep.label}</h2>
          <p className="support-copy">
            Step {applicationStep + 1} of {APPLICATION_STEPS.length}. Finish this screen before moving on.
          </p>
        </div>
        <span className="section-count">
          {applicationStep + 1}/{APPLICATION_STEPS.length}
        </span>
      </div>

      {activeStep.id === "personal" ? (
        <div className="form-grid">
          <Field label="First name" value={formData.personal.firstName} onChange={(value) => updateSection("personal", "firstName", value)} />
          <Field label="Middle name" value={formData.personal.middleName} onChange={(value) => updateSection("personal", "middleName", value)} />
          <Field label="Last name" value={formData.personal.lastName} onChange={(value) => updateSection("personal", "lastName", value)} />
          <Field label="Phone" value={formData.personal.phone} onChange={(value) => updateSection("personal", "phone", value)} />
          <Field label="Alternative phone" value={formData.personal.backupPhone} onChange={(value) => updateSection("personal", "backupPhone", value)} />
          <Field label="Email" type="email" value={formData.personal.email} onChange={(value) => updateSection("personal", "email", value)} />
          <Field label="Date of birth" type="date" value={formData.personal.dob} onChange={(value) => updateSection("personal", "dob", value)} />
          <SelectField label="Gender" value={formData.personal.gender} options={["Male", "Female"]} onChange={(value) => updateSection("personal", "gender", value)} />
          <SelectField label="Marital status" value={formData.personal.maritalStatus} options={maritalStatuses} onChange={(value) => updateSection("personal", "maritalStatus", value)} />
          <SelectField label="Education level" value={formData.personal.educationalLevel} options={educationLevels} onChange={(value) => updateSection("personal", "educationalLevel", value)} />
          <SelectField label="Currently in school" value={formData.personal.schoolStatus} options={["Yes", "No"]} onChange={(value) => updateSection("personal", "schoolStatus", value)} />
          <SelectField label="Residence type" value={formData.personal.residenceType} options={residenceTypes} onChange={(value) => updateSection("personal", "residenceType", value)} />
          <Field label="Years at residence" value={formData.personal.residenceTime} onChange={(value) => updateSection("personal", "residenceTime", value)} />
          <Field label="Digital address" value={formData.personal.digitalAddress} onChange={(value) => updateSection("personal", "digitalAddress", value)} />
          <Field label="Area name" value={formData.personal.areaName} onChange={(value) => updateSection("personal", "areaName", value)} />
          <Field label="Landmark" value={formData.personal.landmark} onChange={(value) => updateSection("personal", "landmark", value)} />
          <Field label="Main income source" value={formData.personal.incomeSource} onChange={(value) => updateSection("personal", "incomeSource", value)} />
          <Field label="Number of dependants" value={formData.personal.dependants} onChange={(value) => updateSection("personal", "dependants", value)} />
        </div>
      ) : null}

      {activeStep.id === "education" ? (
        <div className="form-grid">
          <Field label="Current or last school" value={formData.education.currentSchoolName} onChange={(value) => updateSection("education", "currentSchoolName", value)} />
          <SelectField label="Highest level" value={formData.education.highestLevel} options={educationLevels} onChange={(value) => updateSection("education", "highestLevel", value)} />
          <Field label="Course / program" value={formData.education.courseOfStudy} onChange={(value) => updateSection("education", "courseOfStudy", value)} />
          <Field label="Graduation year" value={formData.education.graduationYear} onChange={(value) => updateSection("education", "graduationYear", value)} />
          <TextAreaField label="School address" value={formData.education.schoolAddress} onChange={(value) => updateSection("education", "schoolAddress", value)} />
        </div>
      ) : null}

      {activeStep.id === "work" ? (
        <div className="form-grid">
          <Field label="Profession / role" value={formData.work.workContent} onChange={(value) => updateSection("work", "workContent", value)} />
          <Field label="Company name" value={formData.work.workUnit} onChange={(value) => updateSection("work", "workUnit", value)} />
          <Field label="Industry" value={formData.work.industry} onChange={(value) => updateSection("work", "industry", value)} />
          <Field label="Work address" value={formData.work.workAddress} onChange={(value) => updateSection("work", "workAddress", value)} />
          <Field label="Company city / locality" value={formData.work.companyAddress} onChange={(value) => updateSection("work", "companyAddress", value)} />
          <Field label="Nearest landmark" value={formData.work.landmarkCompany} onChange={(value) => updateSection("work", "landmarkCompany", value)} />
          <SelectField label="Work hours" value={formData.work.workHours} options={workHoursOptions} onChange={(value) => updateSection("work", "workHours", value)} />
          <Field label="Monthly income" value={formData.work.currentIncome} onChange={(value) => updateSection("work", "currentIncome", value)} />
        </div>
      ) : null}

      {activeStep.id === "emergency" ? (
        <div className="stacked-sections">
          {formData.emergency.contacts.map((contact, index) => (
            <div key={`contact-${index}`} className="mini-card">
              <div className="mini-card-head">
                <h3>Emergency contact {index + 1}</h3>
                <span>Required</span>
              </div>
              <div className="form-grid">
                <Field label="Name" value={contact.name} onChange={(value) => updateEmergencyContact(index, "name", value)} />
                <Field label="Phone" value={contact.phone} onChange={(value) => updateEmergencyContact(index, "phone", value)} />
                <SelectField label="Relationship" value={contact.relationship} options={relationshipOptions} onChange={(value) => updateEmergencyContact(index, "relationship", value)} />
                <SelectField label="Education level" value={contact.educationalLevel} options={educationLevels} onChange={(value) => updateEmergencyContact(index, "educationalLevel", value)} />
                <TextAreaField label="Address" value={contact.address} onChange={(value) => updateEmergencyContact(index, "address", value)} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeStep.id === "identity" ? (
        <div className="identity-stack">
          <div className="identity-header">
            <div>
              <p className="section-kicker">Identity check</p>
              <h2>ID verification</h2>
              <p className="support-copy">
                Upload the front, back, and a selfie holding your document exactly as shown below.
              </p>
            </div>
          </div>

          <div className="form-grid compact-grid">
            <SelectField label="ID type" value={formData.identity.idType} options={idTypes} onChange={(value) => updateSection("identity", "idType", value)} />
            <Field label="ID number" value={formData.identity.idNumber} onChange={(value) => updateSection("identity", "idNumber", value)} />
          </div>

          <UploadGuideCard
            title={`${formData.identity.idType || "National ID"} Photo (front)`}
            sideLabel="Front"
            helperText={`Front photo of ${formData.identity.idType || "National ID"} card`}
            file={formData.identity.frontPhoto}
            onChange={(file) => updateSection("identity", "frontPhoto", file)}
            variant="front"
            buttonText="Upload front photo"
          />

          <UploadGuideCard
            title={`${formData.identity.idType || "National ID"} Photo (back)`}
            sideLabel="Back"
            helperText={`Back photo of ${formData.identity.idType || "National ID"} card`}
            file={formData.identity.backPhoto}
            onChange={(file) => updateSection("identity", "backPhoto", file)}
            variant="back"
            buttonText="Upload back photo"
          />

          <UploadGuideCard
            title={`Please take a photo holding your ${formData.identity.idType || "National ID"} front`}
            helperText="Selfie with your document clearly visible"
            file={formData.identity.selfiePhoto}
            onChange={(file) => updateSection("identity", "selfiePhoto", file)}
            variant="selfie"
            buttonText={`Selfie with your ${formData.identity.idType || "National ID"}`}
            fullWidth
          />
        </div>
      ) : null}

      <div className="actions portal-actions">
        <button type="button" className="ghost-btn" onClick={previousStep} disabled={applicationStep === 0}>
          Back
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => handleSaveDraft()}
          disabled={draftLoading || submitLoading}
        >
          {draftLoading ? "Saving..." : "Save draft"}
        </button>
        {applicationStep === APPLICATION_STEPS.length - 1 ? (
          <button
            type="button"
            className="primary-btn"
            onClick={handleSubmit}
            disabled={submitLoading || draftLoading}
          >
            {submitLoading ? "Submitting..." : "Submit customer"}
          </button>
        ) : (
          <button
            type="button"
            className="primary-btn"
            onClick={nextStep}
            disabled={submitLoading || draftLoading}
          >
            {draftLoading ? "Saving..." : "Continue"}
          </button>
        )}
      </div>
    </>
  );
}

function RecordsTab({ records, paymentHistory, onStartApplication }) {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  return (
    <div className="portal-stack">
      <div className="records-tab-switcher">
        <button
          type="button"
          className={`records-tab-btn ${!showPaymentHistory ? "records-tab-btn-active" : ""}`}
          onClick={() => setShowPaymentHistory(false)}
        >
          Loan Records
        </button>
        <button
          type="button"
          className={`records-tab-btn ${showPaymentHistory ? "records-tab-btn-active" : ""}`}
          onClick={() => setShowPaymentHistory(true)}
        >
          Payment History
        </button>
      </div>

      {!showPaymentHistory && records.length === 0 ? (
        <div className="empty-state-card">
          <h3>No records yet</h3>
          <p>Your loan and repayment records will appear here once activity starts.</p>
          <button type="button" className="primary-btn quick-btn" onClick={onStartApplication}>
            Open Apply
          </button>
        </div>
      ) : showPaymentHistory && !(paymentHistory || []).length ? (
        <div className="empty-state-card">
          <h3>No payment history yet</h3>
          <p>Your repayments and extension transactions will appear here.</p>
        </div>
      ) : (
        <div className="record-card-list">
          {!showPaymentHistory
            ? records.map((record) => (
                <div key={record.id} className="record-card">
                  <div className="record-card-top">
                    <div className={`record-icon ${record.direction === "credit" ? "record-credit" : "record-debit"}`}>
                      {record.direction === "credit" ? "L" : "R"}
                    </div>
                    <div className="record-main">
                      <div className="record-title-row">
                        <strong>{record.type}</strong>
                        <span className={`record-amount ${record.direction === "credit" ? "record-amount-plus" : "record-amount-minus"}`}>
                          {record.direction === "credit" ? "+" : "-"} {formatCurrency(record.amount)}
                        </span>
                      </div>
                      <span className="record-status">{record.status}</span>
                      {record.badges?.length ? (
                        <div className="record-badge-row">
                          {record.badges.map((badge) => (
                            <span
                              key={`${record.id}-${badge.label}`}
                              className={`record-badge record-badge-${badge.tone || "neutral"}`}
                            >
                              {badge.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <p>{record.subtitle}</p>
                      {record.metaRows?.length ? (
                        <div className="record-meta-grid">
                          {record.metaRows.map((item) => (
                            <div key={`${record.id}-${item.label}`} className="record-meta-card">
                              <small>{item.label}</small>
                              <strong>{item.value}</strong>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <small>{formatDate(record.date)}</small>
                    </div>
                  </div>
                </div>
              ))
            : (paymentHistory || []).map((item, index) => (
                <details
                  key={item.id || item.reference || `${item.loanId}-${index}`}
                  className="payment-history-card"
                >
                  <summary>
                    <span>
                      <strong>{item.transactionTypeLabel || item.transactionType || "Payment"}</strong>
                      <small>{formatCurrency(item.amount || 0)} · {item.status || "-"}</small>
                    </span>
                    <small>{formatDate(item.date)}</small>
                  </summary>
                  <div className="payment-history-body">
                    <ReviewRow label="Reference" value={item.reference || "-"} />
                    <ReviewRow label="Loan ID" value={item.loanId || "-"} />
                    <ReviewRow label="Loan Amount" value={formatCurrency(item.loanAmount || 0)} />
                    <ReviewRow
                      label="Remaining Balance"
                      value={formatCurrency(item.remainingBalance || 0)}
                    />
                    <ReviewRow label="Method" value={item.methodLabel || "-"} />
                  </div>
                </details>
              ))}
        </div>
      )}
    </div>
  );
}

function LoanStatusMetric({ label, value, emphasis = false }) {
  return (
    <div className={`loan-status-metric ${emphasis ? "loan-status-metric-emphasis" : ""}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function ProfileTab({ displayName, sessionAccount, formData, offer, onEditProfile, onResetPin, onLogout }) {
  const profile = sessionAccount?.customer || {};
  const hasVerification = Boolean(formData.identity.frontPhoto && formData.identity.backPhoto);
  const countryLabel =
    sessionAccount?.country?.name ||
    profile.countryName ||
    formData.personal.countryCode ||
    "-";

  return (
    <div className="portal-stack">
      <div className="profile-hero-card">
        <div className="profile-avatar">{getInitials(displayName)}</div>
        <div className="profile-hero-copy">
          <h2>{displayName}</h2>
          <p>ID: {profile.userId || sessionAccount?.userId || "-"}</p>
        </div>
      </div>

      <div className="profile-metric-grid">
        <ProfileMetricCard title="Email" value={formData.personal.email || "-"} />
        <ProfileMetricCard title="Phone" value={formData.personal.phone || sessionAccount?.phone || "-"} />
        <ProfileMetricCard title="Country" value={countryLabel} />
        <ProfileMetricCard
          title="ID Verification"
          value={hasVerification ? "Verified" : "Not Verified"}
          highlight={!hasVerification}
        />
        <ProfileMetricCard
          title="Account Created"
          value={formatDate(profile.createdAt || sessionAccount?.createdAt)}
        />
      </div>

      <div className="credit-score-card">
        <div className="mini-card-head">
          <h3>Credit Score</h3>
          <span>{offer?.creditScore || 0}</span>
        </div>
        <div className="level-progress-bar">
          <span style={{ width: `${Math.min(((offer?.creditScore || 0) / 850) * 100, 100)}%` }} />
        </div>
      </div>

      <button type="button" className="profile-action-btn" onClick={onEditProfile}>
        Edit Profile
      </button>
      <button type="button" className="profile-action-btn" onClick={onResetPin}>
        Change PIN
      </button>
      <button type="button" className="profile-action-btn profile-logout-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

function BottomNav({ activeTab, onChange }) {
  return (
    <nav className="portal-nav">
      {PORTAL_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-item ${activeTab === tab.id ? "nav-item-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-icon">{tab.label.slice(0, 1)}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function FeatureActionCard({ tone, title, text, buttonLabel, onClick }) {
  return (
    <div className={`feature-action-card feature-action-${tone}`}>
      <strong>{title}</strong>
      <p>{text}</p>
      <button type="button" onClick={onClick}>
        {buttonLabel}
      </button>
    </div>
  );
}

function GuideAccordion({ title, items, tone }) {
  return (
    <details className={`guide-accordion guide-${tone}`}>
      <summary>{title}</summary>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}

function ReviewRow({ label, value, emphasis = false }) {
  return (
    <div className={`review-row ${emphasis ? "review-row-emphasis" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProfileMetricCard({ title, value, highlight = false }) {
  return (
    <div className={`profile-metric-card ${highlight ? "profile-metric-warn" : ""}`}>
      <small>{title}</small>
      <strong>{value}</strong>
    </div>
  );
}

function UploadGuideCard({
  title,
  sideLabel,
  helperText,
  file,
  onChange,
  variant,
  buttonText,
  fullWidth = false,
}) {
  const previewSrc = useMemo(() => getIdentityPreviewSrc(file), [file]);

  useEffect(() => {
    return () => {
      if (previewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  return (
    <div className={`upload-guide-card ${fullWidth ? "upload-guide-full" : ""}`}>
      <div className="upload-guide-head">
        <h3>{title}</h3>
      </div>
      <div className={`upload-guide-body ${fullWidth ? "upload-guide-body-full" : ""}`}>
        {sideLabel ? (
          <div className="upload-guide-copy">
            <strong>{sideLabel}</strong>
            <p>{helperText}</p>
          </div>
        ) : null}
        <div className={`id-illustration id-illustration-${variant}`}>
          <div className="corner top-left" />
          <div className="corner top-right" />
          <div className="corner bottom-left" />
          <div className="corner bottom-right" />
          {previewSrc ? (
            <>
              <img className="id-preview-image" src={previewSrc} alt={title} />
              <span className="id-preview-badge">Preview</span>
            </>
          ) : (
            <div className={`id-art id-art-${variant}`}>
              <div className="art-card" />
              <div className="art-avatar" />
              <div className="art-line art-line-1" />
              <div className="art-line art-line-2" />
              <div className="art-line art-line-3" />
              <div className="art-line art-line-4" />
            </div>
          )}
        </div>
      </div>
      <label className={`upload-cta ${fullWidth ? "upload-cta-primary" : ""}`}>
        <input type="file" accept="image/*" onChange={(event) => onChange(event.target.files?.[0] || null)} />
        <span>{buttonText}</span>
      </label>
      <div className="upload-meta">
        <small>{file ? file.name : helperText}</small>
        {file?.needsReupload ? <small>Please re-upload before submitting.</small> : null}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder || label}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CountrySelectField({ label, value, onChange, countries }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {(countries || []).map((country) => (
          <option key={country.code} value={country.code}>
            {country.name} ({country.dialCode})
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="field field-wide">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export default App;
