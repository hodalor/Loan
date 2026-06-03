const express = require("express");
const crypto = require("crypto");
const fetch = require("node-fetch");
const CustomerAccess = require("../../models/customerAccess");
const GatewayTransactions = require("../../models/gatewayTransactions");
const Loans = require("../../models/loans");
const User = require("../../models/users");
const { upload } = require("../../../libs/uploadImage");
const { resolveUploadedFileUrl, resolveUserMediaUrls } = require("../../../libs/mediaStorage");
const config = require("../../../config");
const { _encrypt, _decrypt } = require("../../../libs/encrypt");
const _generateString = require("../../../libs/generateID");
const _payLoan = require("../../handlers/loanHandlers/payLoan");
const _saveLoan = require("../../handlers/loanHandlers/saveLoan");
const _clearLoan = require("../../handlers/userHandlers/clearUserLoan");
const _createExt = require("../../handlers/userHandlers/createExt");
const {
  requestOtp,
  verifyOtp,
  consumeVerifiedOtp,
} = require("../../services/customerAuth");
const { getSystemConfig, getActiveCountryConfig } = require("../../services/systemConfig");
const { verifyFirebasePhoneToken } = require("../../services/customerAuth/firebase");
const { logSystemEvent } = require("../../../libs/logger");

const router = express.Router();

const sanitizePhone = (value = "") => String(value).trim();
const normalizePhoneDigits = (value = "") => String(value || "").replace(/\D+/g, "");
const buildPhoneLookupCandidates = (values = [], dialCode = "") => {
  const countryDigits = normalizePhoneDigits(dialCode);
  const candidates = new Set();

  values.flat().forEach((value) => {
    const rawValue = sanitizePhone(value);
    const digits = normalizePhoneDigits(rawValue);

    if (rawValue) {
      candidates.add(rawValue);
    }

    if (!digits) {
      return;
    }

    candidates.add(digits);

    const localDigits = digits.startsWith("0") ? digits.slice(1) : digits;
    if (localDigits) {
      candidates.add(localDigits);
      candidates.add(`0${localDigits}`);
    }

    if (countryDigits) {
      const withoutCountryDigits = digits.startsWith(countryDigits)
        ? digits.slice(countryDigits.length)
        : localDigits;
      const subscriberDigits = withoutCountryDigits.replace(/^0+/, "");

      if (subscriberDigits) {
        candidates.add(subscriberDigits);
        candidates.add(`0${subscriberDigits}`);
        candidates.add(`${countryDigits}${subscriberDigits}`);
        candidates.add(`+${countryDigits}${subscriberDigits}`);
      }
    }
  });

  return Array.from(candidates).filter(Boolean);
};
const buildPhoneLookupQuery = (values = [], dialCode = "") => {
  const candidates = buildPhoneLookupCandidates(values, dialCode);

  if (candidates.length <= 1) {
    return { phone: candidates[0] || sanitizePhone(values[0] || "") };
  }

  return {
    phone: {
      $in: candidates,
    },
  };
};
const parseJsonField = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};
const normalizeEmergencyContact = (contact = {}) => ({
  name: contact.name || "",
  phone: contact.phone || "",
  educationalLevel: contact.educationalLevel || "",
  relationship: contact.relationship || "",
  address: contact.address || "",
});
const uploadIdentityPhotos = (req, res, next) =>
  upload.fields([
    { name: "frontPhoto", maxCount: 1 },
    { name: "backPhoto", maxCount: 1 },
    { name: "selfiePhoto", maxCount: 1 },
  ])(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: 0,
        message: error.message || "Invalid image upload.",
      });
    }

    return next();
  });
const toMoney = (value = 0) => Number.parseFloat(Number(value || 0).toFixed(2));
const normalizeLevel = (value) => {
  const parsed = Number.parseInt(String(value || "1"), 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 20);
};
const getDefaultLevelDefinition = (level) => ({
  level,
  label: level <= 1 ? "Starter Level" : `Level ${level}`,
  minAmount: level * 50,
  maxAmount: level * 100,
});
const getConfiguredLevelDefinition = (level, systemConfig = {}) => {
  const levels = Array.isArray(systemConfig.loanLevels) ? systemConfig.loanLevels : [];
  const exactLevel = levels.find(
    (item) => Number(item?.level) === level && item?.isEnabled !== false
  );

  return exactLevel || getDefaultLevelDefinition(level);
};
const SETTLED_PAYMENT_STATUSES = ["Paid", "Payed"];
const hasSettledPaymentStatus = (status = "") =>
  SETTLED_PAYMENT_STATUSES.includes(String(status || "").trim());
const isSettledLoan = (loan = {}) =>
  hasSettledPaymentStatus(loan?.paymentStatus) ||
  String(loan?.caseStatus || "").trim() === "Completed" ||
  (toMoney(loan?.repaymentAmount || 0) > 0 &&
    toMoney(loan?.amountPaid || 0) + 0.009 >= toMoney(loan?.repaymentAmount || 0));
const countSettledLoans = (user = {}) =>
  (user.loan?.loans || []).filter(
    (loan) => loan.loanStatus === "Granted" && isSettledLoan(loan)
  ).length;
const getDefaultPaymentMethod = (user = {}) => ({
  method: sanitizePhone(user.phone || ""),
  operator: "",
  email: user.email || "",
  isVerified: false,
});
const getPortalPaymentMethods = (user = {}) =>
  Array.isArray(user.paymentMethods) && user.paymentMethods.length > 0
    ? user.paymentMethods
    : user.phone
    ? [getDefaultPaymentMethod(user)]
    : [];
const resolveBridgeCallbackUrl = (req, configuredUrl = "", fallbackPath = "") => {
  const fallbackUrl = `${req.protocol}://${req.get("host")}${fallbackPath}`;
  const rawValue = String(configuredUrl || "").trim();

  if (!rawValue) return fallbackUrl;

  try {
    const parsed = new URL(rawValue);

    if (parsed.pathname && parsed.pathname !== "/") {
      return parsed.toString();
    }

    parsed.pathname = fallbackPath;
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch (error) {
    return fallbackUrl;
  }
};
const buildLoanCalculations = ({ amount, term }) => {
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
  dueDate.setDate(dueDate.getDate() + term.days);

  return {
    interestAmount,
    serviceFeeAmount,
    processingFeeAmount,
    commitmentFeeAmount,
    totalFeeRate:
      term.interestRate +
      term.serviceFeeRate +
      term.processingFeeRate +
      term.commitmentFeeRate,
    totalRepayment,
    dueDate: dueDate.toISOString(),
  };
};
const getConfiguredLoanTerms = (systemConfig = {}) =>
  (Array.isArray(systemConfig.loanTerms) ? systemConfig.loanTerms : [])
    .filter((term) => term?.isEnabled)
    .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
const buildCountryProfile = (country = {}) => ({
  code: String(country.code || "").trim().toUpperCase(),
  name: String(country.name || "").trim(),
  locale: String(country.locale || "en-US").trim(),
  timeZone: String(country.timeZone || "UTC").trim(),
  currencyCode: String(country.currencyCode || "USD").trim(),
  currencySymbol: String(country.currencySymbol || "$").trim(),
  dialCode: String(country.dialCode || "+1").trim(),
  phoneExample: String(country.phoneExample || "").trim(),
  paymentProviders: Array.isArray(country.paymentProviders)
    ? country.paymentProviders.filter((item) => item?.isEnabled !== false)
    : [],
  mobileMoneyNetworks: Array.isArray(country.mobileMoneyNetworks)
    ? country.mobileMoneyNetworks.filter((item) => item?.isEnabled !== false)
    : [],
  cardProviders: Array.isArray(country.cardProviders)
    ? country.cardProviders.filter((item) => item?.isEnabled !== false)
    : [],
});
const findConfiguredCountry = (systemConfig = {}, countryCode = "") => {
  const countries = Array.isArray(systemConfig.countries) ? systemConfig.countries : [];
  const normalizedCode = String(countryCode || "").trim().toUpperCase();

  if (!normalizedCode) {
    return getActiveCountryConfig(systemConfig);
  }

  return (
    countries.find((item) => String(item.code || "").trim().toUpperCase() === normalizedCode) ||
    getActiveCountryConfig(systemConfig)
  );
};
const resolveCountryProfile = ({ systemConfig = {}, customer = null, access = null, countryCode = "" }) =>
  buildCountryProfile(
    findConfiguredCountry(
      systemConfig,
      countryCode || customer?.countryCode || access?.countryCode || systemConfig?.activeCountryCode
    )
  );
const buildPortalContent = (systemConfig = {}) => ({
  appName: systemConfig.portalContent?.appName || "SPEED CASH",
  logoUrl: systemConfig.portalContent?.logoUrl || "",
  homeBannerImageUrl: systemConfig.portalContent?.homeBannerImageUrl || "",
  tagline:
    systemConfig.portalContent?.tagline ||
    "Fast customer login, application tracking, and identity verification.",
  footerText: systemConfig.portalContent?.footerText || "All rights reserved.",
  footerVersion: systemConfig.portalContent?.footerVersion || "1.5.0",
  homeBannerBadge: systemConfig.portalContent?.homeBannerBadge || "",
  homeBannerTitle: systemConfig.portalContent?.homeBannerTitle || "",
  homeBannerMessage: systemConfig.portalContent?.homeBannerMessage || "",
  faqs: systemConfig.portalContent?.faqs || [],
  repaymentTutorials: systemConfig.portalContent?.repaymentTutorials || [],
  supportPhone: systemConfig.portalContent?.supportPhone || "",
  supportEmail: systemConfig.portalContent?.supportEmail || "",
  supportWhatsapp: systemConfig.portalContent?.supportWhatsapp || "",
  activeCountry: buildCountryProfile(getActiveCountryConfig(systemConfig)),
  countries: (Array.isArray(systemConfig.countries) ? systemConfig.countries : [])
    .filter((country) => country?.isEnabled !== false)
    .map((country) => buildCountryProfile(country)),
  authVerification: {
    otpMode: systemConfig.authVerification?.otpMode === "real" ? "real" : "demo",
    firebaseWebConfig: {
      apiKey: systemConfig.authVerification?.firebaseWebConfig?.apiKey || "",
      authDomain: systemConfig.authVerification?.firebaseWebConfig?.authDomain || "",
      projectId: systemConfig.authVerification?.firebaseWebConfig?.projectId || "",
      storageBucket: systemConfig.authVerification?.firebaseWebConfig?.storageBucket || "",
      messagingSenderId:
        systemConfig.authVerification?.firebaseWebConfig?.messagingSenderId || "",
      appId: systemConfig.authVerification?.firebaseWebConfig?.appId || "",
    },
  },
});
const buildLifecycleConfig = (systemConfig = {}) => ({
  overduePenaltyRate: Number(systemConfig.overduePenaltyRate || 0),
  allowPartialRepayment: Boolean(systemConfig.allowPartialRepayment),
  activeCountry: buildCountryProfile(getActiveCountryConfig(systemConfig)),
  collectionGateway: getCollectionGateway(systemConfig),
  requiresMobileMoneyOperator: getCollectionGateway(systemConfig) === "bridge",
  repaymentOptions: (Array.isArray(systemConfig.repaymentOptions) ? systemConfig.repaymentOptions : [])
    .filter((item) => item?.isEnabled)
    .map((item) => ({
      key: item.key,
      label: item.label,
    })),
  mobileMoneyNetworks: buildGatewayAwareMobileMoneyNetworks(systemConfig),
  extensionPeriods: (Array.isArray(systemConfig.extensionPeriods) ? systemConfig.extensionPeriods : [])
    .filter((item) => item?.isEnabled)
    .sort((left, right) => Number(left.days || 0) - Number(right.days || 0)),
});
const isTruthyGatewayResponse = (response = {}) => {
  const code = `${response.response_code || response.status || ""}`.toLowerCase();
  const status = `${response.status || response.message || response.response_message || ""}`.toLowerCase();

  return (
    code === "100" ||
    code === "success" ||
    status.includes("success") ||
    status.includes("completed")
  );
};
const isPendingGatewayResponse = (response = {}) =>
  `${response.response_code || response.status || ""}`.toLowerCase() === "990" ||
  `${response.message || response.response_message || ""}`.toLowerCase().includes("pending");
const toSubunitAmount = (amount = 0) => Math.round(Number(amount || 0) * 100);
const sanitizePortalTransaction = (transaction = {}) => ({
  provider: transaction.provider || "paystack",
  reference: transaction.reference || "",
  transactionType: transaction.transactionType || "",
  status: transaction.status || "pending",
  processed: Boolean(transaction.processed),
  amount: Number(transaction.amount || 0),
  currency: transaction.currency || config.paystackCurrency || "GHS",
  methodKey: transaction.methodKey || "",
  loanId: transaction.loanId || "",
  checkoutUrl: transaction.checkoutUrl || "",
  verifiedAt: transaction.verifiedAt || null,
  processedAt: transaction.processedAt || null,
  failureReason: transaction.failureReason || "",
});
const buildPortalPaymentHistory = async (user = null, loans = []) => {
  const loanList = Array.isArray(loans) ? loans : [];
  const gatewayTransactions = user?.phone
    ? await GatewayTransactions.find({ phone: user.phone }).sort({ createdAt: -1 }).limit(30).lean()
    : [];

  const gatewayRecords = gatewayTransactions.map((transaction, index) => {
    const relatedLoan = loanList.find(
      (loan) => String(loan?.ID || "") === String(transaction.loanId || "")
    );

    return {
      id: `gateway-${transaction.reference || index}`,
      ...sanitizePortalTransaction(transaction),
      transactionTypeLabel:
        transaction.transactionType === "extension" ? "Loan Extension" : "Loan Repayment",
      methodLabel: String(transaction.methodKey || "")
        .replaceAll("-", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      date: transaction.processedAt || transaction.verifiedAt || transaction.createdAt || null,
      loanAmount: Number(relatedLoan?.amount || 0),
      remainingBalance: Number(
        relatedLoan?.clearRemainingAmount ||
          relatedLoan?.amountRemain ||
          relatedLoan?.amountToPay ||
          relatedLoan?.repaymentAmount ||
          0
      ),
      loanStatus: relatedLoan?.loanStatus || "",
      paymentStatus: relatedLoan?.paymentStatus || "",
    };
  });

  const embeddedPaymentRecords = loanList.flatMap((loan, loanIndex) =>
    (Array.isArray(loan?.paymentRecords) ? loan.paymentRecords : []).map((record, recordIndex) => ({
      id: `embedded-${loan?.ID || loanIndex}-${recordIndex}`,
      provider: "manual",
      reference: "",
      transactionType: "repayment",
      transactionTypeLabel: "Loan Repayment",
      status: "success",
      processed: true,
      amount: Number(record?.amountPaid || 0),
      currency: config.paystackCurrency || "GHS",
      methodKey: "",
      methodLabel: "Recorded Payment",
      loanId: loan?.ID || "",
      checkoutUrl: "",
      verifiedAt: record?.datePaid || null,
      processedAt: record?.datePaid || null,
      failureReason: "",
      date: record?.datePaid || loan?.dp || loan?.updatedAt || loan?.doa || null,
      loanAmount: Number(loan?.amount || 0),
      remainingBalance: Number(
        loan?.clearRemainingAmount ||
          loan?.amountRemain ||
          loan?.amountToPay ||
          loan?.repaymentAmount ||
          0
      ),
      loanStatus: loan?.loanStatus || "",
      paymentStatus: loan?.paymentStatus || "",
    }))
  );

  const gatewayMatchKeys = new Set(
    gatewayRecords.map((record) => {
      const dateKey = record.date ? new Date(record.date).toISOString().slice(0, 10) : "";
      return `${record.loanId}|${Number(record.amount || 0).toFixed(2)}|${dateKey}`;
    })
  );

  return [...gatewayRecords, ...embeddedPaymentRecords]
    .filter((record) => {
      if (!record.id.startsWith("embedded-")) {
        return true;
      }
      const dateKey = record.date ? new Date(record.date).toISOString().slice(0, 10) : "";
      const dedupeKey = `${record.loanId}|${Number(record.amount || 0).toFixed(2)}|${dateKey}`;
      return !gatewayMatchKeys.has(dedupeKey);
    })
    .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0));
};
const getPaystackReferenceFromPayload = (payload = {}) =>
  String(
    payload?.data?.reference ||
      payload?.reference ||
      payload?.trxref ||
      payload?.event?.data?.reference ||
      ""
  ).trim();
const getPaystackVerificationUrl = (reference = "") =>
  `${config.paystackBaseUrl}/transaction/verify/${encodeURIComponent(reference)}`;
const toLoanTime = (value) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};
const buildCanonicalEmbeddedLoanState = (globalLoans = [], currentLoan = {}) => {
  const normalizedLoans = (Array.isArray(globalLoans) ? globalLoans : [])
    .map((loan) => ({ ...loan }))
    .sort((left, right) => toLoanTime(right.doa || right.createdAt) - toLoanTime(left.doa || left.createdAt));
  const activeLoan =
    normalizedLoans.find((loan) => loan.loanStatus === "Review") ||
    normalizedLoans.find((loan) => loan.loanStatus === "Granted" && !isSettledLoan(loan)) ||
    normalizedLoans[0] ||
    null;

  return {
    isApplied: Boolean(
      activeLoan &&
        (activeLoan.loanStatus === "Review" ||
          (activeLoan.loanStatus === "Granted" && !isSettledLoan(activeLoan)))
    ),
    loanStatus: activeLoan?.loanStatus || "Not applied",
    paymentStatus: activeLoan?.paymentStatus || "Not payed",
    acumulatedOverDue: Number(currentLoan?.acumulatedOverDue || 0),
    loans: normalizedLoans,
  };
};
const normalizeLoanSnapshot = (loan = {}) => ({
  isApplied: Boolean(loan?.isApplied),
  loanStatus: String(loan?.loanStatus || "Not applied"),
  paymentStatus: String(loan?.paymentStatus || "Not payed"),
  acumulatedOverDue: Number(loan?.acumulatedOverDue || 0),
  loans: (Array.isArray(loan?.loans) ? loan.loans : []).map((item) => ({
    ...item,
    _id: item?._id ? String(item._id) : undefined,
  })),
});
const syncUserLoanSnapshotWithCollection = async (user = null, globalLoans = []) => {
  if (!user?._id) {
    return user;
  }

  const canonicalLoan = buildCanonicalEmbeddedLoanState(globalLoans, user.loan);
  const currentLoan = normalizeLoanSnapshot(user.loan || {});
  const nextLoan = normalizeLoanSnapshot(canonicalLoan);

  if (JSON.stringify(currentLoan) === JSON.stringify(nextLoan)) {
    return {
      ...user,
      loan: canonicalLoan,
    };
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        loan: canonicalLoan,
      },
    }
  );

  return {
    ...user,
    loan: canonicalLoan,
  };
};
const mergeLoanCollections = (user = {}, globalLoans = []) => {
  const embeddedLoans = Array.isArray(user.loan?.loans) ? user.loan.loans : [];
  const embeddedMap = new Map(embeddedLoans.map((loan) => [loan.ID, loan]));

  return (Array.isArray(globalLoans) ? globalLoans : [])
    .map((loan) => ({
      ...(embeddedMap.get(loan.ID) || {}),
      ...loan,
    }))
    .sort(
      (left, right) => toLoanTime(right.doa || right.createdAt) - toLoanTime(left.doa || left.createdAt)
    );
};
const getUserLoanHistory = (user = {}, globalLoans = []) =>
  mergeLoanCollections(user, globalLoans);
const getCurrentPortalLoan = (user = {}, globalLoans = []) => {
  const loans = getUserLoanHistory(user, globalLoans);
  return (
    loans.find((loan) => loan.loanStatus === "Review") ||
    loans.find((loan) => loan.loanStatus === "Granted" && !isSettledLoan(loan)) ||
    loans.find((loan) => loan.loanStatus === "Rejected") ||
    loans[0] ||
    null
  );
};
const startOfDay = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
const getDayDifference = (futureDateValue, compareDateValue = new Date()) => {
  const today = startOfDay(compareDateValue);
  const targetDate = startOfDay(futureDateValue);

  if (!today || !targetDate) return null;

  return Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
const buildActiveLoanView = (user = {}, systemConfig = {}, globalLoans = []) => {
  const loan = getCurrentPortalLoan(user, globalLoans);
  if (!loan) return null;

  const lifecycleConfig = buildLifecycleConfig(systemConfig);
  const amount = toMoney(loan.amount || 0);
  const repaymentAmount = toMoney(loan.repaymentAmount || 0);
  const amountPaid = toMoney(loan.amountPaid || 0);
  const outstandingBalance = Math.max(repaymentAmount - amountPaid, 0);
  const dueDate = loan.dop || null;
  const settledLoan = isSettledLoan(loan);
  const daysRemaining = dueDate
    ? getDayDifference(dueDate, settledLoan && loan.dp ? loan.dp : new Date())
    : null;
  const overdueDays = daysRemaining !== null && daysRemaining < 0 ? Math.abs(daysRemaining) : 0;
  const overduePenalty = toMoney(
    overdueDays > 0
      ? ((Number(lifecycleConfig.overduePenaltyRate || 0) / 100) * outstandingBalance) *
          overdueDays
      : 0
  );
  const totalDue = toMoney(outstandingBalance + overduePenalty);

  let statusKey = "not-applied";
  let title = "No active loan";
  let message = "You can apply for a new loan.";
  const payoutStatus = `${loan.payoutStatus || ""}`.toLowerCase();
  const isAwaitingDisbursement =
    loan.loanStatus === "Granted" &&
    (!loan.isDisbursed &&
      (payoutStatus === "" ||
        payoutStatus === "pending" ||
        payoutStatus === "pending-manual" ||
        payoutStatus === "processing" ||
        payoutStatus === "verified"));

  if (loan.loanStatus === "Review") {
    statusKey = "review";
    title = "Loan under review";
    message = "Please be patient. Customer service will call to verify your application.";
  } else if (loan.loanStatus === "Rejected") {
    statusKey = "rejected";
    title = "Loan rejected";
    message = "This request was not approved. You can apply again if you are eligible.";
  } else if (isAwaitingDisbursement) {
    statusKey = "awaiting-disbursement";
    title = "Loan approved, awaiting disbursement";
    message =
      "Your loan has been approved and the disbursement is still waiting for final confirmation.";
  } else if (loan.loanStatus === "Granted" && settledLoan) {
    statusKey = "paid";
    title = "Loan fully paid";
    message = "Your loan is fully repaid. You can apply again if a new offer is available.";
  } else if (loan.loanStatus === "Granted" && overdueDays > 0) {
    statusKey = "overdue";
    title = "Loan overdue";
    message = "Your loan is overdue. Make payment as soon as possible to avoid more penalties.";
  } else if (loan.loanStatus === "Granted") {
    statusKey = "approved";
    title = "Loan approved";
    message = "Your loan is active. You can make a repayment or extend before the due date.";
  }

  const extensionOptions =
    statusKey === "approved" && daysRemaining !== null && daysRemaining >= 0
      ? lifecycleConfig.extensionPeriods.map((item) => ({
          ...item,
          feeAmount: toMoney((amount * Number(item.feeRate || 0)) / 100),
          extendedDueDate: new Date(
            new Date(dueDate).getTime() + Number(item.days || 0) * 24 * 60 * 60 * 1000
          ).toISOString(),
        }))
      : [];

  return {
    loanId: loan.ID || loan.loanId || "",
    statusKey,
    status: loan.loanStatus || "Not applied",
    title,
    message,
    amount,
    repaymentAmount,
    amountPaid,
    outstandingBalance,
    overduePenalty,
    totalDue,
    dueDate,
    disbursedAt: loan.dod || null,
    daysRemaining,
    overdueDays,
    canApply: statusKey === "rejected" || statusKey === "paid" || statusKey === "not-applied",
    canMakePayment: statusKey === "approved" || statusKey === "overdue",
    canExtend: statusKey === "approved" && daysRemaining !== null && daysRemaining >= 0,
    repaymentOptions: lifecycleConfig.repaymentOptions,
    allowPartialRepayment: lifecycleConfig.allowPartialRepayment,
    extensionOptions,
  };
};
const getRepaymentSourceAccount = ({
  user = {},
  methodKey = "",
  mobileMoneyOperator = "",
}) => {
  const paymentMethods = Array.isArray(user.paymentMethods) ? user.paymentMethods : [];
  const normalizedMethodKey = String(methodKey || "").trim().toLowerCase();
  const normalizedOperator = String(mobileMoneyOperator || "").trim();

  if (normalizedMethodKey === "mobile-money") {
    return {
      method: sanitizePhone(user.phone || paymentMethods[0]?.method || ""),
      operator:
        normalizedOperator ||
        paymentMethods.find((item) => item?.isVerified)?.operator ||
        paymentMethods[0]?.operator ||
        "",
    };
  }

  return (
    paymentMethods.find((item) => item?.isVerified) ||
    paymentMethods[0] || {
      method: sanitizePhone(user.phone || ""),
      operator: "Default",
    }
  );
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const buildGatewayPollUrl = (req, systemConfig = {}) => {
  const configuredUrl =
    String(systemConfig.callbackUrl || config.callbackUrl || "").trim() ||
    `${req.protocol}://${req.get("host")}/callback`;

  try {
    const callbackUrl = new URL(configuredUrl);
    if (callbackUrl.pathname === "/callback") {
      callbackUrl.pathname = "/";
      callbackUrl.search = "";
      return callbackUrl.toString();
    }

    return configuredUrl;
  } catch (error) {
    return `${req.protocol}://${req.get("host")}/`;
  }
};
const formatBridgeRequestTime = (value = new Date()) => {
  const date = new Date(value);
  const pad = (item) => String(item).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const buildBridgeAuthHeader = (username = "", password = "") =>
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
const normalizeBridgeReference = (value = "") =>
  String(value || "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
const getBridgeReferenceVariants = (value = "") => {
  const rawValue = String(value || "").trim();
  const normalizedValue = normalizeBridgeReference(value);

  return [rawValue, normalizedValue].filter(
    (item, index, list) => Boolean(item) && list.indexOf(item) === index
  );
};
const getBridgeCallbackReferenceCandidates = (payload = {}) =>
  [
    payload.trans_ref,
    payload.transaction_id,
    payload.client_ref,
    payload.reference,
    payload.collection_trans_id,
    payload.trans_id,
  ]
    .flatMap((value) => getBridgeReferenceVariants(value))
    .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index);
const getBridgeCallbackReference = (payload = {}) =>
  getBridgeCallbackReferenceCandidates(payload)[0] || "";
const getBridgeCallbackStatus = (payload = {}) =>
  String(payload.trans_status || payload.status_code || payload.status || payload.code || "").trim();
const getBridgeCallbackMessage = (payload = {}) =>
  String(payload.status_desc || payload.description || payload.message || "").trim();
const isBridgeAcceptedInitialization = (response, payload = {}) => {
  const normalizedStatus = String(
    payload?.response_code || payload?.status || payload?.code || ""
  ).trim();

  return response.status === 202 || normalizedStatus === "202";
};
const getCanonicalLoanWritebackId = (loan = {}) =>
  String(loan?._id || loan?.loanId || loan?.ID || "").trim();
const normalizeGatewayKey = (value = "") => String(value || "").trim().toLowerCase();
const getBridgeCredentials = (systemConfig = {}) => ({
  username: String(systemConfig.apiKey || config.bridgeApiUsername || "").trim(),
  password: String(systemConfig.apiSecret || config.bridgeApiPassword || "").trim(),
  serviceId: Number.parseInt(String(config.bridgeServiceId || "").trim(), 10),
});
const mapOperatorToBridgeNetworkCode = (operator = "") => {
  const normalized = String(operator || "").trim().toLowerCase();

  if (normalized.includes("mtn")) return "MTN";
  if (
    normalized.includes("telecel") ||
    normalized.includes("vodafone") ||
    normalized.includes("vod")
  ) {
    return "VOD";
  }
  if (normalized.includes("airtel") || normalized.includes("tigo")) return "AIR";

  return "";
};
const getCollectionGateway = (systemConfig = {}) =>
  normalizeGatewayKey(
    systemConfig.collectionGateway || systemConfig.gatewayProvider || systemConfig.activeChannel
  );
const buildGatewayAwareMobileMoneyNetworks = (systemConfig = {}) => {
  const activeCountry = buildCountryProfile(getActiveCountryConfig(systemConfig));
  const allNetworks = Array.isArray(activeCountry.mobileMoneyNetworks)
    ? activeCountry.mobileMoneyNetworks
    : [];
  const gateway = getCollectionGateway(systemConfig);

  if (gateway === "bridge") {
    return allNetworks.filter((network) =>
      Boolean(mapOperatorToBridgeNetworkCode(network?.label || network?.key || ""))
    );
  }

  return allNetworks;
};
const runCollectionCharge = async ({
  amount,
  senderId,
  requestId,
  systemConfig,
}) => {
  const response = await fetch(config.paymentBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      auth: {
        merchant_id: config.merchantId,
        api_id: config.myApiID,
        api_key: systemConfig.apiKey || config.myApiKey,
        service_id: "1002",
        channel: "momo",
      },
      data: {
        method: "runBillPayment",
        request_id: requestId,
        sender_id: senderId,
        reference_no: requestId,
        amount: amount,
      },
    }),
  });

  const payload = await response.json();

  return {
    ok: response.ok,
    payload,
    senderId:
      payload?.response?.sender_id ||
      payload?.sender_id ||
      senderId,
  };
};
const initializeBridgeCharge = async ({
  req,
  user,
  amount,
  methodKey = "",
  systemConfig,
  referencePrefix,
  transactionType,
  loanId,
  mobileMoneyOperator,
  context = {},
}) => {
  const sourceAccount = getRepaymentSourceAccount({
    user,
    methodKey,
    mobileMoneyOperator,
  });
  const bridgeCredentials = getBridgeCredentials(systemConfig);
  const networkCode = mapOperatorToBridgeNetworkCode(sourceAccount?.operator);
  const activeCountry = getActiveCountryConfig(systemConfig);

  if (!bridgeCredentials.username || !bridgeCredentials.password || !bridgeCredentials.serviceId) {
    return {
      success: false,
      message:
        "Bridge credentials are incomplete. Set BRIDGE_API_USERNAME, BRIDGE_API_PASSWORD, and BRIDGE_SERVICE_ID.",
    };
  }

  if (!sourceAccount?.method) {
    return {
      success: false,
      message: "No repayment account is linked to this customer profile.",
    };
  }

  if (!networkCode) {
    return {
      success: false,
      message: "The selected mobile money operator is not supported by Bridge.",
    };
  }

  const reference = normalizeBridgeReference(
    `${referencePrefix}-${Date.now()}-${String(user.userId || "customer").trim().toLowerCase()}`
  ).slice(0, 80);
  const callbackUrl = resolveBridgeCallbackUrl(
    req,
    config.bridgeCallbackUrl || systemConfig.callbackUrl,
    "/users/portal/bridge/webhook"
  );

  const response = await fetch(`${config.bridgeBaseUrl}/make_payment`, {
    method: "POST",
    headers: {
      Authorization: buildBridgeAuthHeader(
        bridgeCredentials.username,
        bridgeCredentials.password
      ),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      service_id: bridgeCredentials.serviceId,
      reference: `${transactionType === "extension" ? "Loan extension" : "Loan repayment"} ${loanId || ""}`.trim(),
      customer_number: sourceAccount.method,
      transaction_id: reference,
      trans_type: "CTM",
      amount: toMoney(amount),
      nw: networkCode,
      nickname: user?.IDinfo?.firstName || user?.userId || "Customer",
      payment_option: "MOM",
      currency_code: activeCountry?.currencyCode || config.bridgeCurrencyCode,
      currency_val: config.bridgeCurrencyValue,
      callback_url: callbackUrl,
      request_time: formatBridgeRequestTime(),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  const accepted = isBridgeAcceptedInitialization(response, payload);

  if (!accepted) {
    return {
      success: false,
      message:
        payload?.response_message || payload?.message || "Bridge could not initialize the payment.",
      raw: payload,
    };
  }

  await GatewayTransactions.findOneAndUpdate(
    { reference },
    {
      $set: {
        provider: "bridge",
        reference,
        transactionType,
        status: "pending",
        processed: false,
        phone: sanitizePhone(user.phone || ""),
        userId: user.userId || "",
        loanId: loanId || "",
        methodKey: "mobile-money",
        amount: toMoney(amount),
        currency: activeCountry?.currencyCode || config.bridgeCurrencyCode,
        checkoutUrl: "",
        context,
        rawInitializeResponse: payload,
        failureReason: "",
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return {
    success: false,
    pending: true,
    provider: "bridge",
    message:
      payload?.response_message ||
      "Bridge payment request submitted. Approve the prompt on the customer's phone.",
    raw: payload,
    reference,
  };
};
const pollGatewayFeedback = async ({ req, senderId, systemConfig }) => {
  const pollUrl = buildGatewayPollUrl(req, systemConfig);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await sleep(4000 * (attempt + 1));

    try {
      const response = await fetch(pollUrl);
      const payload = await response.json();

      if (
        payload &&
        `${payload.sender_id || payload?.response?.sender_id || ""}` === `${senderId}`
      ) {
        return payload;
      }
    } catch (error) {
      console.log(error);
    }
  }

  return null;
};
const initializePaystackCharge = async ({
  req,
  user,
  amount,
  methodKey,
  referencePrefix,
  transactionType,
  loanId,
  context = {},
}) => {
  if (!config.paystackSecretKey) {
    return {
      success: false,
      message: "Paystack secret key is not configured.",
    };
  }

  const callbackUrl =
    config.paystackCallbackUrl ||
    `${req.protocol}://${req.get("host")}/users/portal/paystack/callback`;
  const channels =
    methodKey === "card" ? ["card"] : ["mobile_money", "card"];
  const reference = normalizeBridgeReference(
    `${referencePrefix}-${Date.now()}-${String(user.userId || "customer").trim().toLowerCase()}`
  ).slice(0, 80);

  const response = await fetch(`${config.paystackBaseUrl}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: user.email || `${sanitizePhone(user.phone || "customer")}@speedcash.local`,
      amount: toSubunitAmount(amount),
      reference,
      callback_url: callbackUrl,
      currency: config.paystackCurrency,
      channels,
      metadata: {
        userId: user.userId || "",
        phone: user.phone || "",
        referencePrefix,
        methodKey,
        transactionType,
        loanId,
        context,
      },
    }),
  });
  const payload = await response.json();

  if (!response.ok || payload?.status !== true) {
    return {
      success: false,
      message: payload?.message || "Paystack could not initialize the payment.",
      raw: payload,
    };
  }

  const checkoutUrl = payload?.data?.authorization_url || "";

  await GatewayTransactions.findOneAndUpdate(
    { reference },
    {
      $set: {
        provider: "paystack",
        reference,
        transactionType,
        status: "pending",
        processed: false,
        phone: sanitizePhone(user.phone || ""),
        userId: user.userId || "",
        loanId: loanId || "",
        methodKey,
        amount: toMoney(amount),
        currency: config.paystackCurrency,
        checkoutUrl,
        context,
        rawInitializeResponse: payload,
        failureReason: "",
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return {
    success: false,
    pending: true,
    message: "Paystack checkout initialized. Complete the payment to finish this request.",
    raw: payload,
    checkoutUrl,
    reference,
  };
};
const verifyPaystackCharge = async (reference) => {
  if (!config.paystackSecretKey) {
    return {
      success: false,
      pending: false,
      message: "Paystack secret key is not configured.",
    };
  }

  const response = await fetch(getPaystackVerificationUrl(reference), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      Accept: "application/json",
    },
  });
  const payload = await response.json();
  const paymentStatus = String(payload?.data?.status || "").toLowerCase();

  return {
    success: response.ok && payload?.status === true && paymentStatus === "success",
    pending: ["pending", "ongoing", "processing", "queued"].includes(paymentStatus),
    failed:
      !["", "success", "pending", "ongoing", "processing", "queued"].includes(
        paymentStatus
      ),
    message: payload?.message || payload?.data?.gateway_response || "Unable to verify payment.",
    raw: payload,
  };
};
const verifyBridgeCharge = async (transaction, webhookEvent = null) => {
  const event = webhookEvent || transaction?.rawWebhookEvent || null;
  const callbackStatus = getBridgeCallbackStatus(event || {});
  const normalizedTransactionStatus = String(transaction?.status || "").trim().toLowerCase();

  if (callbackStatus === "000" || normalizedTransactionStatus === "success") {
    return {
      success: true,
      pending: false,
      message:
        getBridgeCallbackMessage(event || {}) ||
        "Bridge payment completed successfully.",
      raw: event || transaction?.rawWebhookEvent || transaction?.rawInitializeResponse || null,
    };
  }

  if (
    callbackStatus === "002" ||
    ["pending", "processing", "queued"].includes(normalizedTransactionStatus)
  ) {
    return {
      success: false,
      pending: true,
      message:
        getBridgeCallbackMessage(event || {}) ||
        "Bridge payment is still pending.",
      raw: event || transaction?.rawWebhookEvent || transaction?.rawInitializeResponse || null,
    };
  }

  if (
    callbackStatus === "001" ||
    callbackStatus === "003" ||
    normalizedTransactionStatus === "failed"
  ) {
    return {
      success: false,
      pending: false,
      message:
        getBridgeCallbackMessage(event || {}) ||
        transaction?.failureReason ||
        "Bridge payment failed.",
      raw: event || transaction?.rawWebhookEvent || transaction?.rawInitializeResponse || null,
    };
  }

  return {
    success: false,
    pending: true,
    message: "Bridge payment is still awaiting callback confirmation.",
    raw: event || transaction?.rawWebhookEvent || transaction?.rawInitializeResponse || null,
  };
};
const applyPortalGatewayTransaction = async (transaction) => {
  const user = await User.findOne({ phone: transaction.phone });
  if (!user) {
    throw new Error("Customer profile not found for this payment.");
  }

  const systemConfig = await getSystemConfig();
  const currentUserData = user.toObject();
  const globalLoans = await Loans.find({ userId: user.userId }).lean();
  const activeLoanView = buildActiveLoanView(currentUserData, systemConfig, globalLoans);

  if (!activeLoanView || activeLoanView.loanId !== transaction.loanId) {
    throw new Error("Loan details changed before this payment could be applied.");
  }

  if (transaction.transactionType === "repayment") {
    const payAmount = toMoney(transaction.amount || 0);
    const amountToApply = Math.min(payAmount, toMoney(activeLoanView.outstandingBalance || 0));
    const isFullSettlement = payAmount + 0.009 >= toMoney(activeLoanView.totalDue || 0);
    const globalLoan = await Loans.findOne({ ID: activeLoanView.loanId });

    if (!globalLoan) {
      throw new Error("Loan record not found.");
    }

    const userResult = await _clearLoan({
      ID: activeLoanView.loanId,
      dp: new Date(),
      userId: user.userId,
      clear: isFullSettlement,
      amt: amountToApply,
    });
    const canonicalLoanWritebackId = getCanonicalLoanWritebackId(globalLoan);
    const loanResult = await _payLoan({
      id: canonicalLoanWritebackId,
      payAmount: amountToApply,
    });

    if (!userResult || !loanResult) {
      const error = new Error("Payment was confirmed but the loan record could not be updated.");
      error.details = {
        attemptedLoanIdentifiers: {
          transactionLoanId: transaction.loanId || "",
          activeLoanViewLoanId: activeLoanView.loanId || "",
          globalLoanLoanId: globalLoan.loanId || "",
          globalLoanID: globalLoan.ID || "",
          globalLoanMongoId: String(globalLoan._id || ""),
          canonicalLoanWritebackId,
        },
        repaymentValues: {
          gatewayAmount: payAmount,
          amountToApply,
          outstandingBalance: toMoney(activeLoanView.outstandingBalance || 0),
          totalDue: toMoney(activeLoanView.totalDue || 0),
          isFullSettlement,
        },
        updateResults: {
          userResult: Boolean(userResult),
          loanResult: Boolean(loanResult),
        },
      };
      throw error;
    }
  }

  if (transaction.transactionType === "extension") {
    const extensionKey = String(transaction.context?.extensionKey || "").trim();
    const extensionOption =
      (activeLoanView.extensionOptions || []).find((item) => item.key === extensionKey) ||
      transaction.context?.extensionOption;

    if (!extensionOption) {
      throw new Error("The selected extension option is no longer available.");
    }

    const globalLoan = await Loans.findOne({ ID: activeLoanView.loanId });
    if (!globalLoan) {
      throw new Error("Loan record not found.");
    }

    const nextDueDate = new Date(extensionOption.extendedDueDate);
    const extensionRecord = {
      loanId: activeLoanView.loanId,
      extPeriod: extensionOption.label,
      extHandlingFee: `${toMoney(extensionOption.feeAmount || 0)}`,
      extExpDate: nextDueDate,
      extStatus: "Approved",
      source: "self",
      requestStatus: "Approved",
      requestedBy: "Customer",
      approvedBy: "System",
    };

    globalLoan.dop = nextDueDate;
    globalLoan.extRecords = [
      ...(Array.isArray(globalLoan.extRecords) ? globalLoan.extRecords : []),
      extensionRecord,
    ];

    const savedLoan = await globalLoan.save();
    const savedUserExtension = await _createExt({
      ID: activeLoanView.loanId,
      dop: nextDueDate,
      userId: user.userId,
      extRecord: extensionRecord,
    });

    if (!savedLoan || !savedUserExtension) {
      throw new Error(
        "Payment was confirmed but the extension could not be applied to the loan."
      );
    }
  }

  const summary = await buildPortalSummaryData(null, transaction.phone);
  if (!summary) {
    throw new Error("Customer portal data could not be refreshed after payment.");
  }

  return summary;
};
const finalizePortalGatewayTransaction = async ({ reference, webhookEvent = null }) => {
  const transaction = await GatewayTransactions.findOne({ reference });

  if (!transaction) {
    await logSystemEvent({
      level: "warn",
      category: "payment",
      source: "customer.portal.gatewayVerification",
      action: "verify",
      status: "failed",
      message: "Portal gateway verification could not find the transaction reference.",
      metadata: {
        reference,
      },
    });
    return {
      success: 0,
      message: "Transaction reference was not found.",
      status: "missing",
    };
  }

  if (transaction.processed) {
    const summary = await buildPortalSummaryData(null, transaction.phone);
    return {
      success: 1,
      message: "Payment already confirmed.",
      status: "success",
      data: {
        ...(summary || {}),
        transaction: sanitizePortalTransaction(transaction),
      },
    };
  }

  const verification =
    String(transaction.provider || "").trim() === "bridge"
      ? await verifyBridgeCharge(transaction, webhookEvent)
      : await verifyPaystackCharge(reference);
  await GatewayTransactions.updateOne(
    { _id: transaction._id },
    {
      $set: {
        rawVerifyResponse: verification.raw || null,
        rawWebhookEvent: webhookEvent || transaction.rawWebhookEvent || null,
        status: verification.success
          ? "success"
          : verification.pending
          ? "pending"
          : "failed",
        verifiedAt: verification.success ? new Date() : transaction.verifiedAt,
        failureReason: verification.success ? "" : verification.message || "",
      },
    }
  );

  if (!verification.success) {
    await logSystemEvent({
      level: verification.pending ? "warn" : "error",
      category: "payment",
      source: "customer.portal.gatewayVerification",
      action: "verify",
      status: verification.pending ? "pending" : "failed",
      message:
        verification.message ||
        (verification.pending
          ? "Portal gateway payment is still pending."
          : "Portal gateway verification failed."),
      metadata: {
        reference,
        provider: transaction.provider,
        transactionType: transaction.transactionType,
        phone: transaction.phone,
      },
      details: verification.raw || webhookEvent || null,
    });
    return {
      success: verification.pending ? 2 : 0,
      message: verification.message,
      status: verification.pending ? "pending" : "failed",
      data: {
        transaction: sanitizePortalTransaction({
          ...transaction.toObject(),
          status: verification.pending ? "pending" : "failed",
          failureReason: verification.success ? "" : verification.message || "",
        }),
      },
    };
  }

  const claimedTransaction = await GatewayTransactions.findOneAndUpdate(
    { _id: transaction._id, processed: false },
    {
      $set: {
        status: "processing",
      },
    },
    { new: true }
  );

  if (!claimedTransaction) {
    const latestTransaction = await GatewayTransactions.findOne({ reference });
    const summary = latestTransaction?.phone
      ? await buildPortalSummaryData(null, latestTransaction.phone)
      : null;

    return {
      success: latestTransaction?.processed ? 1 : 2,
      message: latestTransaction?.processed
        ? "Payment already confirmed."
        : "Payment is still being processed.",
      status: latestTransaction?.processed ? "success" : "processing",
      data: {
        ...(summary || {}),
        transaction: sanitizePortalTransaction(latestTransaction || {}),
      },
    };
  }

  try {
    const summary = await applyPortalGatewayTransaction(claimedTransaction);

    await GatewayTransactions.updateOne(
      { _id: claimedTransaction._id },
      {
        $set: {
          status: "success",
          processed: true,
          processedAt: new Date(),
          rawWebhookEvent: webhookEvent || claimedTransaction.rawWebhookEvent || null,
          failureReason: "",
        },
      }
    );

    const latestTransaction = await GatewayTransactions.findOne({ reference }).lean();

    await logSystemEvent({
      level: "info",
      category: "payment",
      source: "customer.portal.gatewayVerification",
      action: "apply",
      status: "success",
      message:
        claimedTransaction.transactionType === "extension"
          ? "Portal extension payment completed successfully."
          : "Portal repayment completed successfully.",
      metadata: {
        reference,
        provider: claimedTransaction.provider,
        transactionType: claimedTransaction.transactionType,
        phone: claimedTransaction.phone,
        amount: claimedTransaction.amount,
      },
    });

    return {
      success: 1,
      message:
        claimedTransaction.transactionType === "extension"
          ? "Extension completed successfully."
          : "Payment completed successfully.",
      status: "success",
      data: {
        ...(summary || {}),
        transaction: sanitizePortalTransaction(latestTransaction || {}),
      },
    };
  } catch (error) {
    await GatewayTransactions.updateOne(
      { _id: claimedTransaction._id },
      {
        $set: {
          status: "verified",
          processed: false,
          failureReason: error.message || "Payment verified but processing failed.",
        },
      }
    );

    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "customer.portal.gatewayVerification",
      action: "apply",
      status: "failed",
      message: error.message || "Portal gateway transaction failed during final processing.",
      metadata: {
        reference,
        provider: claimedTransaction.provider,
        transactionType: claimedTransaction.transactionType,
        phone: claimedTransaction.phone,
        amount: claimedTransaction.amount,
      },
      details: {
        stack: error.stack || "",
        ...(error.details || {}),
      },
    });

    return {
      success: 0,
      message: error.message || "Payment verified but processing failed.",
      status: "verified",
      data: {
        transaction: sanitizePortalTransaction({
          ...claimedTransaction.toObject(),
          status: "verified",
          failureReason: error.message || "Payment verified but processing failed.",
        }),
      },
    };
  }
};
const processCustomerGatewayCharge = async ({
  req,
  user,
  amount,
  methodKey,
  systemConfig,
  referencePrefix,
  transactionType,
  loanId,
  mobileMoneyOperator = "",
  context = {},
}) => {
  if (
    (systemConfig.collectionGateway === "paystack" ||
      systemConfig.gatewayProvider === "paystack" ||
      systemConfig.activeChannel === "paystack") &&
    (methodKey === "mobile-money" || methodKey === "card")
  ) {
    return initializePaystackCharge({
      req,
      user,
      amount,
      methodKey,
      referencePrefix,
      transactionType,
      loanId,
      context,
    });
  }

  if (methodKey !== "mobile-money") {
    return {
      success: false,
      message:
        "Card payments are only available when Paystack is the selected collection gateway.",
    };
  }

  if (
    systemConfig.collectionGateway === "bridge" ||
    systemConfig.gatewayProvider === "bridge"
  ) {
    return initializeBridgeCharge({
      req,
      user,
      amount,
      methodKey,
      systemConfig,
      referencePrefix,
      transactionType,
      loanId,
      mobileMoneyOperator,
      context,
    });
  }

  const sourceAccount = getRepaymentSourceAccount({
    user,
    methodKey,
    mobileMoneyOperator,
  });
  if (!sourceAccount?.method) {
    return {
      success: false,
      message: "No repayment account is linked to this customer profile.",
    };
  }

  const requestId = `${referencePrefix}-${await _generateString(10)}`;
  const initialCharge = await runCollectionCharge({
    amount,
    senderId: sourceAccount.method,
    requestId,
    systemConfig,
  });

  if (!initialCharge.ok) {
    return {
      success: false,
      message:
        initialCharge.payload?.message ||
        initialCharge.payload?.response_message ||
        "Gateway request failed.",
      raw: initialCharge.payload,
      sourceAccount,
    };
  }

  const directSuccess = isTruthyGatewayResponse(initialCharge.payload);
  if (directSuccess) {
    return {
      success: true,
      message:
        initialCharge.payload?.message ||
        initialCharge.payload?.response_message ||
        "Payment completed successfully.",
      raw: initialCharge.payload,
      sourceAccount,
    };
  }

  if (isPendingGatewayResponse(initialCharge.payload)) {
    const feedbackPayload = await pollGatewayFeedback({
      req,
      senderId: initialCharge.senderId,
      systemConfig,
    });

    if (feedbackPayload && isTruthyGatewayResponse(feedbackPayload)) {
      return {
        success: true,
        message:
          feedbackPayload.message ||
          feedbackPayload.response_message ||
          "Payment confirmed successfully.",
        raw: feedbackPayload,
        sourceAccount,
      };
    }
  }

  return {
    success: false,
    message:
      initialCharge.payload?.message ||
      initialCharge.payload?.response_message ||
      "Transaction failed, please try again.",
    raw: initialCharge.payload,
    sourceAccount,
  };
};
const buildPortalOffer = (user = {}, systemConfig = {}, globalLoans = []) => {
  const level = normalizeLevel(user.level);
  const settledLoans = countSettledLoans(user);
  const levelConfig = getConfiguredLevelDefinition(level, systemConfig);
  const { minAmount, maxAmount } = levelConfig;
  const activeLoan = buildActiveLoanView(user, systemConfig, globalLoans);
  const canApply =
    Boolean(user.isActive) &&
    (!Boolean(user.loan?.isApplied) || Boolean(activeLoan?.canApply));
  const termOptions = getConfiguredLoanTerms(systemConfig).map((term) => ({
    ...term,
    ...buildLoanCalculations({
      amount: maxAmount,
      term,
    }),
  }));

  return {
    level,
    levelLabel: levelConfig.label,
    minAmount,
    maxAmount,
    defaultAmount: maxAmount,
    availableCredit: canApply ? maxAmount : 0,
    settledLoans,
    creditScore: Math.min(650 + settledLoans * 25 + level * 5, 850),
    nextLevel: Math.min(level + 1, 20),
    nextLevelMessage: canApply
      ? "Repay this loan successfully to unlock the next level."
      : "Finish the current loan before requesting another one.",
    canApply,
    activeLoanStatus: activeLoan?.title || user.loan?.loanStatus || "Not applied",
    paymentMethods: getPortalPaymentMethods(user),
    termOptions,
  };
};
const buildPortalSummaryData = async (req, phone) => {
  const [updatedUser, refreshedAccess, refreshedConfig] = await Promise.all([
    User.findOne({ phone }).lean(),
    CustomerAccess.findOne({ phone }).lean(),
    getSystemConfig(),
  ]);

  if (!updatedUser) return null;

  const refreshedLoans = await Loans.find({ userId: updatedUser.userId }).lean();
  const syncedUser = await syncUserLoanSnapshotWithCollection(updatedUser, refreshedLoans);
  const resolvedCustomer = await resolveUserMediaUrls(req, syncedUser);
  const paymentHistory = await buildPortalPaymentHistory(syncedUser, refreshedLoans);

  return {
    loanHistory: refreshedLoans,
    paymentHistory,
    activeLoan: buildActiveLoanView(syncedUser, refreshedConfig, refreshedLoans),
    offer: buildPortalOffer(syncedUser, refreshedConfig, refreshedLoans),
    content: buildPortalContent(refreshedConfig),
    lifecycleConfig: buildLifecycleConfig(refreshedConfig),
    country: resolveCountryProfile({
      systemConfig: refreshedConfig,
      customer: syncedUser,
      access: refreshedAccess,
    }),
    customer: resolvedCustomer,
    transaction: null,
  };
};
const buildProfilePayload = ({
  application = {},
  files = {},
  existingUser = null,
  access = null,
  systemConfig = {},
}) => {
  const personal = application.personal || {};
  const education = application.education || {};
  const work = application.work || {};
  const identity = application.identity || {};
  const emergencyContacts = application.emergency?.contacts || [];
  const countryProfile = resolveCountryProfile({
    systemConfig,
    customer: existingUser,
    access,
    countryCode: application.countryCode || personal.countryCode,
  });

  const contact1 = normalizeEmergencyContact(emergencyContacts[0]);
  const contact2 = normalizeEmergencyContact(emergencyContacts[1]);
  const contact3 = normalizeEmergencyContact(emergencyContacts[2]);

  return {
    email:
      personal.email ||
      existingUser?.email ||
      `${sanitizePhone(personal.phone || existingUser?.phone || "customer")}@speedcash.local`,
    phone: sanitizePhone(personal.phone || existingUser?.phone || ""),
    countryCode:
      countryProfile.code || existingUser?.countryCode || access?.countryCode || "",
    countryName:
      countryProfile.name || existingUser?.countryName || access?.countryName || "",
    countryDialCode:
      countryProfile.dialCode || existingUser?.countryDialCode || access?.countryDialCode || "",
    locale: countryProfile.locale || existingUser?.locale || access?.locale || "",
    timeZone: countryProfile.timeZone || existingUser?.timeZone || access?.timeZone || "UTC",
    currencyCode:
      countryProfile.currencyCode || existingUser?.currencyCode || access?.currencyCode || "",
    currencySymbol:
      countryProfile.currencySymbol ||
      existingUser?.currencySymbol ||
      access?.currencySymbol ||
      "",
    isActive: existingUser?.isActive ?? true,
    isVerified: existingUser?.isVerified ?? true,
    isRegistered: true,
    level: existingUser?.level || "1",
    contacts: existingUser?.contacts || [],
    userImage: files.selfiePhoto || existingUser?.userImage || "",
    IDinfo: {
      idFront: files.frontPhoto || existingUser?.IDinfo?.idFront || identity.frontPhoto?.name || "",
      idBack: files.backPhoto || existingUser?.IDinfo?.idBack || identity.backPhoto?.name || "",
      firstName: personal.firstName || existingUser?.IDinfo?.firstName || "",
      lastName: personal.lastName || existingUser?.IDinfo?.lastName || "",
      middleName: personal.middleName || existingUser?.IDinfo?.middleName || "",
      gender: personal.gender || existingUser?.IDinfo?.gender || "",
      gCardNumber: identity.idNumber || existingUser?.IDinfo?.gCardNumber || "",
    },
    pesonalInfo: {
      dob: personal.dob || existingUser?.pesonalInfo?.dob || "",
      schoolStatus:
        personal.schoolStatus === "Yes"
          ? true
          : personal.schoolStatus === "No"
          ? false
          : existingUser?.pesonalInfo?.schoolStatus ?? false,
      educationalLevel:
        personal.educationalLevel ||
        education.highestLevel ||
        existingUser?.pesonalInfo?.educationalLevel ||
        "",
      residenceType: personal.residenceType || existingUser?.pesonalInfo?.residenceType || "",
      dAddress: personal.digitalAddress || existingUser?.pesonalInfo?.dAddress || "",
      areaName: personal.areaName || existingUser?.pesonalInfo?.areaName || "",
      landMark: personal.landmark || existingUser?.pesonalInfo?.landMark || "",
      residenceTime: personal.residenceTime || existingUser?.pesonalInfo?.residenceTime || "",
      incomeSource: personal.incomeSource || existingUser?.pesonalInfo?.incomeSource || "",
      maritalStatus: personal.maritalStatus || existingUser?.pesonalInfo?.maritalStatus || "",
      relativesINOC: personal.dependants || existingUser?.pesonalInfo?.relativesINOC || "",
      bUPphone: personal.backupPhone || existingUser?.pesonalInfo?.bUPphone || "",
    },
    educationInfo: {
      currentSchoolName:
        education.currentSchoolName || existingUser?.educationInfo?.currentSchoolName || "",
      highestLevel:
        education.highestLevel ||
        personal.educationalLevel ||
        existingUser?.educationInfo?.highestLevel ||
        existingUser?.pesonalInfo?.educationalLevel ||
        "",
      courseOfStudy: education.courseOfStudy || existingUser?.educationInfo?.courseOfStudy || "",
      graduationYear: education.graduationYear || existingUser?.educationInfo?.graduationYear || "",
      schoolAddress: education.schoolAddress || existingUser?.educationInfo?.schoolAddress || "",
    },
    workInfo: {
      workUnit: work.workUnit || existingUser?.workInfo?.workUnit || "",
      industry: work.industry || existingUser?.workInfo?.industry || "",
      workAddress: work.workAddress || existingUser?.workInfo?.workAddress || "",
      companyAddress: work.companyAddress || existingUser?.workInfo?.companyAddress || "",
      LNDmarkCompany: work.landmarkCompany || existingUser?.workInfo?.LNDmarkCompany || "",
      workHours: work.workHours || existingUser?.workInfo?.workHours || "",
      currentIncome: work.currentIncome || existingUser?.workInfo?.currentIncome || "",
      workContent: work.workContent || existingUser?.workInfo?.workContent || "",
    },
    emergncyContacts: {
      contact1: {
        name: contact1.name,
        phone: contact1.phone,
        educationalLevel: contact1.educationalLevel,
        relationship: contact1.relationship,
      },
      contact2: {
        name: contact2.name,
        phone: contact2.phone,
        educationalLevel: contact2.educationalLevel,
        relationship: contact2.relationship,
      },
      contact3: {
        name: contact3.name,
        phone: contact3.phone,
        educationalLevel: contact3.educationalLevel,
        relationship: contact3.relationship,
      },
    },
    paymentMethods: existingUser?.paymentMethods || [],
    loan: existingUser?.loan || {
      isApplied: false,
      loanStatus: "Not applied",
      paymentStatus: "Not payed",
      acumulatedOverDue: 0,
      loans: [],
    },
  };
};

router.post("/auth/request-otp", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const purpose = req.body?.purpose || "signup";
    const systemConfig = await getSystemConfig();
    const countryProfile = resolveCountryProfile({
      systemConfig,
      countryCode: req.body?.countryCode,
    });

    if (!phone) {
      return res.status(400).json({
        success: 0,
        message: "Phone number is required.",
      });
    }

    const phoneLookup = buildPhoneLookupQuery([phone], countryProfile.dialCode);
    const existingUser = await User.findOne(phoneLookup).lean();
    const existingAccess = await CustomerAccess.findOne(phoneLookup).lean();

    if (purpose === "signup" && existingAccess?.isPinSet) {
      return res.status(400).json({
        success: 0,
        message: "This phone already has a PIN. Please log in or reset your PIN.",
      });
    }

    const otp = requestOtp({ phone, purpose });

    return res.status(200).json({
      success: 1,
      message: "OTP requested successfully.",
      data: {
        phone,
        purpose,
        country: countryProfile,
        userExists: Boolean(existingUser),
        accountExists: Boolean(existingAccess?.isPinSet),
        otpCode: otp.code,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/auth/verify-otp", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const otp = sanitizePhone(req.body?.otp);
    const purpose = req.body?.purpose || "signup";
    const systemConfig = await getSystemConfig();
    const countryProfile = resolveCountryProfile({
      systemConfig,
      countryCode: req.body?.countryCode,
    });

    if (!phone || !otp) {
      return res.status(400).json({
        success: 0,
        message: "Phone number and OTP are required.",
      });
    }

    const response = verifyOtp({ phone, otp, purpose });

    if (!response.success) {
      return res.status(400).json({
        success: 0,
        message: response.message,
      });
    }

    return res.status(200).json({
      success: 1,
      message: "OTP verified successfully.",
      data: {
        phone,
        purpose,
        country: countryProfile,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/auth/set-pin", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const pin = sanitizePhone(req.body?.pin);
    const purpose = req.body?.purpose || "signup";
    const systemConfig = await getSystemConfig();
    const countryProfile = resolveCountryProfile({
      systemConfig,
      countryCode: req.body?.countryCode,
    });

    if (!phone || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: 0,
        message: "A valid phone number and 4-digit PIN are required.",
      });
    }

    let verification = null;
    if (systemConfig.authVerification?.otpMode === "real") {
      verification = await verifyFirebasePhoneToken({
        idToken: req.body?.firebaseIdToken,
        phone,
        firebaseWebConfig: systemConfig.authVerification?.firebaseWebConfig,
      });
    } else {
      verification = consumeVerifiedOtp({ phone, purpose });
    }

    if (!verification?.success) {
      return res.status(400).json({
        success: 0,
        message: verification?.message || "Phone verification is required before setting a PIN.",
      });
    }

    const phoneLookup = buildPhoneLookupQuery(
      [phone, verification?.phoneNumber],
      countryProfile.dialCode
    );
    const existingUser = await User.findOne(phoneLookup);
    const existingAccess = await CustomerAccess.findOne(phoneLookup);
    const canonicalPhone = sanitizePhone(
      existingAccess?.phone || existingUser?.phone || phone
    );
    const encryptedPin = await _encrypt(pin);

    const access = await CustomerAccess.findOneAndUpdate(
      phoneLookup,
      {
        $set: {
          phone: canonicalPhone,
          pin: encryptedPin,
          userId: existingUser?.userId || null,
          customerId: existingUser?._id || null,
          isPinSet: true,
          countryCode: countryProfile.code || existingUser?.countryCode || "",
          countryName: countryProfile.name || existingUser?.countryName || "",
          countryDialCode: countryProfile.dialCode || existingUser?.countryDialCode || "",
          locale: countryProfile.locale || existingUser?.locale || "",
          timeZone: countryProfile.timeZone || existingUser?.timeZone || "UTC",
          currencyCode: countryProfile.currencyCode || existingUser?.currencyCode || "",
          currencySymbol: countryProfile.currencySymbol || existingUser?.currencySymbol || "",
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: 1,
      message: purpose === "reset" ? "PIN reset successfully." : "PIN created successfully.",
      data: {
        phone: access.phone,
        userId: access.userId || "",
        isExistingCustomer: Boolean(existingUser),
        country: resolveCountryProfile({
          systemConfig,
          customer: existingUser,
          access,
        }),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const pin = sanitizePhone(req.body?.pin);
    const systemConfig = await getSystemConfig();
    const countryProfile = resolveCountryProfile({
      systemConfig,
      countryCode: req.body?.countryCode,
    });

    if (!phone || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: 0,
        message: "Phone number and 4-digit PIN are required.",
      });
    }

    const phoneLookup = buildPhoneLookupQuery([phone], countryProfile.dialCode);
    const access = await CustomerAccess.findOne(phoneLookup);

    if (!access || !access.pin) {
      return res.status(404).json({
        success: 0,
        message: "No PIN account found for this phone number.",
      });
    }

    const decryptedPin = await _decrypt(access.pin);
    if (decryptedPin !== pin) {
      return res.status(400).json({
        success: 0,
        message: "Phone number or PIN is not correct.",
      });
    }

    access.lastLoginAt = new Date();

    const existingUser = await User.findOne(
      buildPhoneLookupQuery([phone, access.phone], countryProfile.dialCode)
    ).lean();
    access.userId = existingUser?.userId || access.userId;
    access.customerId = existingUser?._id || access.customerId;
    await access.save();

    return res.status(200).json({
      success: 1,
      message: "Login successful.",
      data: {
        phone: access.phone,
        userId: access.userId || "",
        customerId: access.customerId || "",
        hasProfile: Boolean(existingUser),
        customer: existingUser || null,
        draftApplication: access.draftApplication || null,
        country: resolveCountryProfile({
          systemConfig,
          customer: existingUser,
          access,
        }),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/portal/summary", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);

    if (!phone) {
      return res.status(400).json({
        success: 0,
        message: "Phone number is required.",
      });
    }

    const [access, customer, systemConfig] = await Promise.all([
      CustomerAccess.findOne({ phone }).lean(),
      User.findOne({ phone }).lean(),
      getSystemConfig(),
    ]);

    if (!access || !access.isPinSet) {
      return res.status(404).json({
        success: 0,
        message: "No customer access found for this phone number.",
      });
    }

    const globalLoans = customer?.userId ? await Loans.find({ userId: customer.userId }).lean() : [];
    const syncedCustomer =
      customer && customer.userId
        ? await syncUserLoanSnapshotWithCollection(customer, globalLoans)
        : customer;
    const resolvedCustomer = await resolveUserMediaUrls(req, syncedCustomer);

    return res.status(200).json({
      success: 1,
      data: {
        phone,
        hasProfile: Boolean(syncedCustomer),
        customer: resolvedCustomer || null,
        loanHistory: globalLoans,
        draftApplication: access.draftApplication || null,
        country: resolveCountryProfile({
          systemConfig,
          customer: syncedCustomer,
          access,
        }),
        offer: syncedCustomer ? buildPortalOffer(syncedCustomer, systemConfig, globalLoans) : null,
        content: buildPortalContent(systemConfig),
        lifecycleConfig: buildLifecycleConfig(systemConfig),
        activeLoan: syncedCustomer
          ? buildActiveLoanView(syncedCustomer, systemConfig, globalLoans)
          : null,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.get("/portal/content", async (_req, res) => {
  try {
    const systemConfig = await getSystemConfig();

    return res.status(200).json({
      success: 1,
      data: buildPortalContent(systemConfig),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/portal/repayment-summary", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const repaymentType = req.body?.repaymentType === "partial" ? "partial" : "full";
    const partialAmount = toMoney(req.body?.amount || 0);

    if (!phone) {
      return res.status(400).json({
        success: 0,
        message: "Phone number is required.",
      });
    }

    const [user, systemConfig] = await Promise.all([
      User.findOne({ phone }).lean(),
      getSystemConfig(),
    ]);

    if (!user) {
      return res.status(404).json({
        success: 0,
        message: "Customer profile not found.",
      });
    }

    const globalLoans = await Loans.find({ userId: user.userId }).lean();
    const activeLoan = buildActiveLoanView(user, systemConfig, globalLoans);
    if (!activeLoan || !activeLoan.canMakePayment) {
      return res.status(400).json({
        success: 0,
        message: "There is no active loan available for repayment.",
      });
    }

    if (repaymentType === "partial" && !buildLifecycleConfig(systemConfig).allowPartialRepayment) {
      return res.status(400).json({
        success: 0,
        message: "Partial repayment is currently disabled.",
      });
    }

    const payableAmount =
      repaymentType === "full" ? activeLoan.totalDue : Math.min(partialAmount, activeLoan.totalDue);

    return res.status(200).json({
      success: 1,
      data: {
        repaymentType,
        amount: payableAmount,
        activeLoan,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/portal/extension-summary", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const extensionKey = String(req.body?.extensionKey || "").trim();

    if (!phone || !extensionKey) {
      return res.status(400).json({
        success: 0,
        message: "Phone number and extension option are required.",
      });
    }

    const [user, systemConfig] = await Promise.all([
      User.findOne({ phone }).lean(),
      getSystemConfig(),
    ]);

    if (!user) {
      return res.status(404).json({
        success: 0,
        message: "Customer profile not found.",
      });
    }

    const globalLoans = await Loans.find({ userId: user.userId }).lean();
    const activeLoan = buildActiveLoanView(user, systemConfig, globalLoans);
    if (!activeLoan || !activeLoan.canExtend) {
      return res.status(400).json({
        success: 0,
        message: "Loan extension is only available before or on the due date.",
      });
    }

    const selectedOption = (activeLoan.extensionOptions || []).find(
      (item) => item.key === extensionKey
    );

    if (!selectedOption) {
      return res.status(400).json({
        success: 0,
        message: "The selected extension option is not available.",
      });
    }

    return res.status(200).json({
      success: 1,
      data: {
        activeLoan,
        extension: selectedOption,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/portal/pay-loan", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const repaymentType = req.body?.repaymentType === "partial" ? "partial" : "full";
    const requestedAmount = toMoney(req.body?.amount || 0);
    const methodKey = String(req.body?.methodKey || "").trim();
    const mobileMoneyOperator = String(req.body?.mobileMoneyOperator || "").trim();

    if (!phone || !methodKey) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.payLoan",
        action: "init",
        status: "failed",
        message: "Portal repayment request was rejected because required fields were missing.",
        req,
        metadata: {
          phone,
          methodKey,
        },
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const [user, systemConfig] = await Promise.all([
      User.findOne({ phone }),
      getSystemConfig(),
    ]);

    if (!user) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.payLoan",
        action: "init",
        status: "failed",
        message: "Portal repayment request failed because the customer profile was not found.",
        req,
        metadata: {
          phone,
        },
      });
      return res.status(404).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const currentUserData = user.toObject();
    const globalLoans = await Loans.find({ userId: user.userId }).lean();
    const activeLoanView = buildActiveLoanView(currentUserData, systemConfig, globalLoans);
    if (!activeLoanView || !activeLoanView.canMakePayment) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.payLoan",
        action: "init",
        status: "failed",
        message: "Portal repayment request failed because there is no payable active loan.",
        req,
        metadata: {
          phone,
          userId: user.userId,
        },
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const payAmount =
      repaymentType === "full"
        ? toMoney(activeLoanView.totalDue || 0)
        : Math.min(requestedAmount, toMoney(activeLoanView.totalDue || 0));

    if (payAmount <= 0) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.payLoan",
        action: "init",
        status: "failed",
        message: "Portal repayment request failed because the amount was invalid.",
        req,
        metadata: {
          phone,
          userId: user.userId,
          repaymentType,
          requestedAmount,
        },
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const gatewayResult = await processCustomerGatewayCharge({
      req,
      user,
      amount: payAmount,
      methodKey,
      systemConfig,
      referencePrefix: "repayment",
      transactionType: "repayment",
      loanId: activeLoanView.loanId,
      context: {
        repaymentType,
      },
      mobileMoneyOperator,
    });

    if (!gatewayResult.success) {
      if (gatewayResult.pending) {
        await logSystemEvent({
          level: "info",
          category: "payment",
          source: "customer.portal.payLoan",
          action: "gateway-init",
          status: "pending",
          message: "Portal repayment is waiting for gateway confirmation.",
          req,
          metadata: {
            phone,
            userId: user.userId,
            amount: payAmount,
            reference: gatewayResult.reference,
            provider: gatewayResult.provider,
            repaymentType,
            mobileMoneyOperator,
          },
          details: gatewayResult.raw || null,
        });
        return res.status(200).json({
          success: 2,
          message: "Continue to make payment.",
          data: {
            provider:
              gatewayResult.provider ||
              systemConfig.collectionGateway ||
              systemConfig.gatewayProvider,
            checkoutUrl: gatewayResult.checkoutUrl,
            reference: gatewayResult.reference,
            activeLoan: activeLoanView,
          },
        });
      }

      await logSystemEvent({
        level: "error",
        category: "payment",
        source: "customer.portal.payLoan",
        action: "gateway-init",
        status: "failed",
        message: gatewayResult.message || "Portal repayment gateway initialization failed.",
        req,
        metadata: {
          phone,
          userId: user.userId,
          amount: payAmount,
          provider: gatewayResult.provider,
          repaymentType,
          mobileMoneyOperator,
        },
        details: gatewayResult.raw || null,
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const globalLoan = await Loans.findOne({ ID: activeLoanView.loanId });
    if (!globalLoan) {
      await logSystemEvent({
        level: "error",
        category: "payment",
        source: "customer.portal.payLoan",
        action: "apply",
        status: "failed",
        message: "Portal repayment succeeded at gateway level but the loan record was not found.",
        req,
        metadata: {
          phone,
          userId: user.userId,
          amount: payAmount,
          loanId: activeLoanView.loanId,
        },
      });
      return res.status(404).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const userResult = await _clearLoan({
      ID: activeLoanView.loanId,
      dp: new Date(),
      userId: user.userId,
      clear: payAmount >= toMoney(activeLoanView.totalDue || 0),
      amt: payAmount,
    });
    const loanResult = await _payLoan({
      id: getCanonicalLoanWritebackId(globalLoan),
      payAmount,
    });

    if (!userResult || !loanResult) {
      await logSystemEvent({
        level: "error",
        category: "payment",
        source: "customer.portal.payLoan",
        action: "apply",
        status: "failed",
        message: "Portal repayment was received but the loan records could not be fully updated.",
        req,
        metadata: {
          phone,
          userId: user.userId,
          amount: payAmount,
          loanId: activeLoanView.loanId,
          repaymentType,
        },
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const [updatedUser, refreshedConfig] = await Promise.all([
      User.findOne({ phone }).lean(),
      getSystemConfig(),
    ]);

    await logSystemEvent({
      level: "info",
      category: "payment",
      source: "customer.portal.payLoan",
      action: "apply",
      status: "success",
      message: "Portal repayment completed successfully.",
      req,
      metadata: {
        phone,
        userId: user.userId,
        amount: payAmount,
        loanId: activeLoanView.loanId,
        repaymentType,
        mobileMoneyOperator,
      },
    });

    return res.status(200).json({
      success: 1,
      message: "Payment completed successfully.",
      data: {
        loanHistory: await Loans.find({ userId: updatedUser.userId }).lean(),
        activeLoan: buildActiveLoanView(
          updatedUser,
          refreshedConfig,
          await Loans.find({ userId: updatedUser.userId }).lean()
        ),
        offer: buildPortalOffer(
          updatedUser,
          refreshedConfig,
          await Loans.find({ userId: updatedUser.userId }).lean()
        ),
        content: buildPortalContent(refreshedConfig),
        lifecycleConfig: buildLifecycleConfig(refreshedConfig),
      },
    });
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "customer.portal.payLoan",
      action: "apply",
      status: "failed",
      message: error.message || "Portal repayment failed with an internal error.",
      req,
      details: {
        stack: error.stack || "",
      },
      metadata: {
        phone: sanitizePhone(req.body?.phone),
        methodKey: String(req.body?.methodKey || "").trim(),
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Payment failed. Try later.",
    });
  }
});

router.post("/portal/extend-loan", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const extensionKey = String(req.body?.extensionKey || "").trim();
    const methodKey = String(req.body?.methodKey || "").trim();
    const mobileMoneyOperator = String(req.body?.mobileMoneyOperator || "").trim();

    if (!phone || !extensionKey || !methodKey) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.extendLoan",
        action: "init",
        status: "failed",
        message: "Portal extension request was rejected because required fields were missing.",
        req,
        metadata: {
          phone,
          extensionKey,
          methodKey,
        },
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const [user, systemConfig] = await Promise.all([
      User.findOne({ phone }),
      getSystemConfig(),
    ]);

    if (!user) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.extendLoan",
        action: "init",
        status: "failed",
        message: "Portal extension request failed because the customer profile was not found.",
        req,
        metadata: {
          phone,
        },
      });
      return res.status(404).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const currentUserData = user.toObject();
    const globalLoans = await Loans.find({ userId: user.userId }).lean();
    const activeLoanView = buildActiveLoanView(currentUserData, systemConfig, globalLoans);
    if (!activeLoanView || !activeLoanView.canExtend) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.extendLoan",
        action: "init",
        status: "failed",
        message: "Portal extension request failed because the loan is not eligible for extension.",
        req,
        metadata: {
          phone,
          userId: user.userId,
          loanId: activeLoanView?.loanId || "",
        },
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const extensionOption = (activeLoanView.extensionOptions || []).find(
      (item) => item.key === extensionKey
    );

    if (!extensionOption) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.extendLoan",
        action: "init",
        status: "failed",
        message: "Portal extension request failed because the selected option was invalid.",
        req,
        metadata: {
          phone,
          userId: user.userId,
          extensionKey,
          loanId: activeLoanView.loanId,
        },
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const gatewayResult = await processCustomerGatewayCharge({
      req,
      user,
      amount: toMoney(extensionOption.feeAmount || 0),
      methodKey,
      systemConfig,
      referencePrefix: "extension",
      transactionType: "extension",
      loanId: activeLoanView.loanId,
      context: {
        extensionKey: extensionOption.key,
        extensionOption,
      },
      mobileMoneyOperator,
    });

    if (!gatewayResult.success) {
      if (gatewayResult.pending) {
        await logSystemEvent({
          level: "info",
          category: "payment",
          source: "customer.portal.extendLoan",
          action: "gateway-init",
          status: "pending",
          message: "Portal extension payment is waiting for gateway confirmation.",
          req,
          metadata: {
            phone,
            userId: user.userId,
            amount: toMoney(extensionOption.feeAmount || 0),
            reference: gatewayResult.reference,
            provider: gatewayResult.provider,
            extensionKey,
            loanId: activeLoanView.loanId,
            mobileMoneyOperator,
          },
          details: gatewayResult.raw || null,
        });
        return res.status(200).json({
          success: 2,
          message: "Continue to make payment.",
          data: {
            provider:
              gatewayResult.provider ||
              systemConfig.collectionGateway ||
              systemConfig.gatewayProvider,
            checkoutUrl: gatewayResult.checkoutUrl,
            reference: gatewayResult.reference,
            activeLoan: activeLoanView,
            extension: extensionOption,
          },
        });
      }

      await logSystemEvent({
        level: "error",
        category: "payment",
        source: "customer.portal.extendLoan",
        action: "gateway-init",
        status: "failed",
        message: gatewayResult.message || "Portal extension gateway initialization failed.",
        req,
        metadata: {
          phone,
          userId: user.userId,
          amount: toMoney(extensionOption.feeAmount || 0),
          provider: gatewayResult.provider,
          extensionKey,
          loanId: activeLoanView.loanId,
          mobileMoneyOperator,
        },
        details: gatewayResult.raw || null,
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const globalLoan = await Loans.findOne({ ID: activeLoanView.loanId });
    if (!globalLoan) {
      await logSystemEvent({
        level: "error",
        category: "payment",
        source: "customer.portal.extendLoan",
        action: "apply",
        status: "failed",
        message: "Portal extension payment succeeded at gateway level but the loan record was not found.",
        req,
        metadata: {
          phone,
          userId: user.userId,
          extensionKey,
          loanId: activeLoanView.loanId,
        },
      });
      return res.status(404).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const nextDueDate = new Date(extensionOption.extendedDueDate);
    globalLoan.dop = nextDueDate;
    globalLoan.extRecords = [
      ...(Array.isArray(globalLoan.extRecords) ? globalLoan.extRecords : []),
      {
        loanId: activeLoanView.loanId,
        extPeriod: extensionOption.label,
        extHandlingFee: `${toMoney(extensionOption.feeAmount || 0)}`,
        extExpDate: nextDueDate,
        extStatus: "Approved",
        source: "self",
        requestStatus: "Approved",
        requestedBy: "Customer",
        approvedBy: "System",
      },
    ];

    const savedLoan = await globalLoan.save();
    const savedUserExtension = await _createExt({
      ID: activeLoanView.loanId,
      dop: nextDueDate,
      userId: user.userId,
      extRecord: {
        loanId: activeLoanView.loanId,
        extPeriod: extensionOption.label,
        extHandlingFee: `${toMoney(extensionOption.feeAmount || 0)}`,
        extExpDate: nextDueDate,
        extStatus: "Approved",
        source: "self",
        requestStatus: "Approved",
        requestedBy: "Customer",
        approvedBy: "System",
      },
    });

    if (!savedLoan || !savedUserExtension) {
      await logSystemEvent({
        level: "error",
        category: "payment",
        source: "customer.portal.extendLoan",
        action: "apply",
        status: "failed",
        message: "Portal extension payment was received but the due date update failed.",
        req,
        metadata: {
          phone,
          userId: user.userId,
          extensionKey,
          loanId: activeLoanView.loanId,
          amount: toMoney(extensionOption.feeAmount || 0),
        },
      });
      return res.status(400).json({
        success: 0,
        message: "Payment failed. Try later.",
      });
    }

    const [updatedUser, refreshedConfig] = await Promise.all([
      User.findOne({ phone }).lean(),
      getSystemConfig(),
    ]);

    await logSystemEvent({
      level: "info",
      category: "payment",
      source: "customer.portal.extendLoan",
      action: "apply",
      status: "success",
      message: "Portal extension completed successfully.",
      req,
      metadata: {
        phone,
        userId: user.userId,
        extensionKey,
        loanId: activeLoanView.loanId,
        amount: toMoney(extensionOption.feeAmount || 0),
      },
    });

    return res.status(200).json({
      success: 1,
      message: "Payment completed successfully.",
      data: {
        loanHistory: await Loans.find({ userId: updatedUser.userId }).lean(),
        activeLoan: buildActiveLoanView(
          updatedUser,
          refreshedConfig,
          await Loans.find({ userId: updatedUser.userId }).lean()
        ),
        offer: buildPortalOffer(
          updatedUser,
          refreshedConfig,
          await Loans.find({ userId: updatedUser.userId }).lean()
        ),
        content: buildPortalContent(refreshedConfig),
        lifecycleConfig: buildLifecycleConfig(refreshedConfig),
      },
    });
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "customer.portal.extendLoan",
      action: "apply",
      status: "failed",
      message: error.message || "Portal extension failed with an internal error.",
      req,
      details: {
        stack: error.stack || "",
      },
      metadata: {
        phone: sanitizePhone(req.body?.phone),
        methodKey: String(req.body?.methodKey || "").trim(),
        extensionKey: String(req.body?.extensionKey || "").trim(),
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Payment failed. Try later.",
    });
  }
});

const handlePortalGatewayVerification = async (req, res) => {
  try {
    const reference =
      getPaystackReferenceFromPayload(req.body) ||
      String(req.body?.reference || "").trim();

    if (!reference) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.gatewayVerification",
        action: "verify",
        status: "failed",
        message: "Portal gateway verification was requested without a reference.",
        req,
      });
      return res.status(400).json({
        success: 0,
        message: "Transaction reference is required.",
      });
    }

    const response = await finalizePortalGatewayTransaction({ reference });
    const statusCode =
      response.success === 1 ? 200 : response.success === 2 ? 202 : 400;

    return res.status(statusCode).json(response);
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "customer.portal.gatewayVerification",
      action: "verify",
      status: "failed",
      message: error.message || "Portal gateway verification failed with an internal error.",
      req,
      details: {
        stack: error.stack || "",
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
};

router.post("/portal/gateway/verify", handlePortalGatewayVerification);
router.post("/portal/paystack/verify", handlePortalGatewayVerification);

router.post("/portal/bridge/webhook", async (req, res) => {
  try {
    const referenceCandidates = getBridgeCallbackReferenceCandidates(req.body);
    if (referenceCandidates.length === 0) {
      return res.sendStatus(200);
    }

    const transaction = await GatewayTransactions.findOne({
      reference: { $in: referenceCandidates },
    });
    if (!transaction) {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "customer.portal.bridgeWebhook",
        action: "webhook-unmatched",
        status: "ignored",
        message: "Bridge portal webhook did not match any saved repayment transaction.",
        metadata: {
          bridgeStatus: getBridgeCallbackStatus(req.body),
          callbackReference: getBridgeCallbackReference(req.body),
          referenceCandidates,
        },
        details: req.body,
      });
      return res.sendStatus(200);
    }

    const reference = transaction.reference;

    if (transaction.processed || String(transaction.status || "").trim().toLowerCase() === "success") {
      return res.sendStatus(200);
    }

    const bridgeStatus = getBridgeCallbackStatus(req.body);
    const bridgeMessage = getBridgeCallbackMessage(req.body);
    await GatewayTransactions.updateOne(
      { _id: transaction._id },
      {
        $set: {
          rawWebhookEvent: req.body,
          status:
            bridgeStatus === "000"
              ? "success"
              : bridgeStatus === "002"
              ? "pending"
              : bridgeStatus === "001" || bridgeStatus === "003"
              ? "failed"
              : transaction.status,
          failureReason:
            bridgeStatus === "000"
              ? ""
              : bridgeMessage,
        },
      }
    );

    await logSystemEvent({
      level:
        bridgeStatus === "000"
          ? "info"
          : bridgeStatus === "002"
          ? "warn"
          : bridgeStatus === "001" || bridgeStatus === "003"
          ? "error"
          : "info",
      category: "payment",
      source: "customer.portal.bridgeWebhook",
      action: "webhook",
      status:
        bridgeStatus === "000"
          ? "success"
          : bridgeStatus === "002"
          ? "pending"
          : bridgeStatus === "001" || bridgeStatus === "003"
          ? "failed"
          : "received",
      message:
        bridgeStatus === "000"
          ? "Bridge portal webhook confirmed a successful transaction."
          : bridgeMessage || "Bridge portal webhook received.",
      metadata: {
        reference,
        bridgeStatus,
      },
      details: req.body,
    });

    if (bridgeStatus === "000") {
      await finalizePortalGatewayTransaction({
        reference,
        webhookEvent: req.body,
      });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "payment",
      source: "customer.portal.bridgeWebhook",
      action: "webhook",
      status: "failed",
      message: error.message || "Bridge portal webhook processing failed.",
      req,
      details: {
        stack: error.stack || "",
        body: req.body,
      },
    });
    return res.sendStatus(200);
  }
});

router.post("/portal/paystack/webhook", async (req, res) => {
  try {
    const signature = String(req.get("x-paystack-signature") || "").trim();
    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    const expectedSignature = config.paystackSecretKey
      ? crypto
          .createHmac("sha512", config.paystackSecretKey)
          .update(rawBody)
          .digest("hex")
      : "";

    if (!config.paystackSecretKey || !signature || signature !== expectedSignature) {
      return res.sendStatus(401);
    }

    if (req.body?.event === "charge.success") {
      const reference = getPaystackReferenceFromPayload(req.body);

      if (reference) {
        await finalizePortalGatewayTransaction({
          reference,
          webhookEvent: req.body,
        });
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

router.get("/portal/paystack/callback", async (req, res) => {
  try {
    const reference = getPaystackReferenceFromPayload(req.query);

    if (reference) {
      await finalizePortalGatewayTransaction({ reference });
    }

    return res.status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment Status</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; }
      .card { max-width: 460px; margin: 12vh auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 28px; box-shadow: 0 18px 50px rgba(15,23,42,0.08); }
      h1 { font-size: 20px; margin: 0 0 10px; }
      p { line-height: 1.6; color: #475569; margin: 0 0 14px; }
      .hint { font-size: 13px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Payment received</h1>
      <p>Your payment is being verified. You can return to the app and wait a few seconds for the loan status to refresh.</p>
      <p class="hint">Reference: ${reference || "-"}</p>
    </div>
    <script>
      (function () {
        try {
          if (window.opener && ${JSON.stringify(reference || "")}) {
            window.opener.postMessage(
              {
                type: "paystack-verified",
                reference: ${JSON.stringify(reference || "")}
              },
              "*"
            );
          }
          window.setTimeout(function () {
            window.close();
          }, 2500);
        } catch (error) {}
      })();
    </script>
  </body>
</html>`);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Unable to verify payment.");
  }
});

router.post("/portal/apply-loan", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const termKey = req.body?.termKey;
    const amount = Number.parseFloat(req.body?.amount);
    const useLoan = String(req.body?.useLoan || "Personal needs").trim();
    const acceptedTerms = Boolean(req.body?.acceptedTerms);
    const selectedMethod = sanitizePhone(req.body?.paymentMethod || "");
    const selectedOperator = String(req.body?.paymentOperator || "").trim();

    if (!phone || !termKey || Number.isNaN(amount)) {
      return res.status(400).json({
        success: 0,
        message: "Phone number, amount and term are required.",
      });
    }

    if (!acceptedTerms) {
      return res.status(400).json({
        success: 0,
        message: "You must accept the terms and conditions before applying.",
      });
    }

    const systemConfig = await getSystemConfig();
    const countryProfile = resolveCountryProfile({
      systemConfig,
      countryCode: req.body?.countryCode,
    });
    const phoneLookup = buildPhoneLookupQuery([phone], countryProfile.dialCode);
    const access = await CustomerAccess.findOne(phoneLookup);
    const user = await User.findOne(phoneLookup);

    if (!access || !access.isPinSet || !user) {
      return res.status(404).json({
        success: 0,
        message: "Customer profile not found. Complete registration first.",
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: 0,
        message: "You are not eligible for loans, please contact support.",
      });
    }

    if (user.loan?.isApplied) {
      return res.status(400).json({
        success: 0,
        message: "You already have an active loan in the system.",
      });
    }

    const globalLoans = await Loans.find({ userId: user.userId }).lean();
    const offer = buildPortalOffer(user, systemConfig, globalLoans);
    const term = offer.termOptions.find((item) => item.key === termKey);

    if (!term) {
      return res.status(400).json({
        success: 0,
        message: "The selected loan term is not available.",
      });
    }

    if (amount < offer.minAmount || amount > offer.maxAmount) {
      return res.status(400).json({
        success: 0,
        message: `Loan amount must be between ${offer.minAmount} and ${offer.maxAmount}.`,
      });
    }

    const paymentMethods = getPortalPaymentMethods(user);
    const payoutMethod =
      paymentMethods.find((method) => method.method === selectedMethod) || paymentMethods[0];
    const activeCountryProfile = resolveCountryProfile({
      systemConfig,
      customer: user,
      access,
    });
    const availableNetworks = Array.isArray(activeCountryProfile.mobileMoneyNetworks)
      ? activeCountryProfile.mobileMoneyNetworks
      : [];
    const isMobileMoneyPayout = !String(payoutMethod?.method || "").includes("@");
    const resolvedPaymentOperator = String(
      selectedOperator || payoutMethod?.operator || ""
    ).trim();

    if (!payoutMethod?.method) {
      return res.status(400).json({
        success: 0,
        message: "No payout method is available on this profile yet.",
      });
    }

    if (isMobileMoneyPayout && availableNetworks.length > 0 && !resolvedPaymentOperator) {
      return res.status(400).json({
        success: 0,
        message: "Select the mobile money provider for this payout number before continuing.",
      });
    }

    const calculations = buildLoanCalculations({ amount, term });
    const generatedID = await _generateString(6);
    const loans = {
      userId: user.userId,
      ID: generatedID,
      terms: offer.levelLabel,
      amount: toMoney(amount),
      duration: term.label,
      interest: term.interestRate,
      repaymentAmount: calculations.totalRepayment,
      usage: useLoan,
      paymentMethod: payoutMethod.method,
      paymentOperator: resolvedPaymentOperator,
      whereHeard: "Web Portal",
      facialRecog: user.userImage || "",
      dop: null,
      doa: new Date(),
      dod: null,
      dp: null,
      caseStatus: "Review",
      isNewLoan: true,
      loanStatus: "Review",
      paymentStatus: "Not paid",
      rvOfName: "",
      rvOfCom: "",
      contacts: user.contacts || [],
      gpsLocation: req.body?.gpsLocation || "",
    };

    const newLoan = [...(user.loan?.loans || []), loans];
    const loanData = {
      isApplied: true,
      loanStatus: "Review",
      paymentStatus: "Not paid",
      acumulatedOverDue: user.loan?.acumulatedOverDue || 0,
      loans: newLoan,
    };

    user.loan = loanData;
    const normalizedPaymentMethods = Array.isArray(user.paymentMethods) ? [...user.paymentMethods] : [];
    const matchedMethodIndex = normalizedPaymentMethods.findIndex(
      (method) => method?.method === payoutMethod.method
    );

    if (matchedMethodIndex >= 0) {
      normalizedPaymentMethods[matchedMethodIndex] = {
        ...normalizedPaymentMethods[matchedMethodIndex],
        operator:
          resolvedPaymentOperator || normalizedPaymentMethods[matchedMethodIndex]?.operator || "",
      };
    } else if (payoutMethod?.method) {
      normalizedPaymentMethods.push({
        ...payoutMethod,
        operator: resolvedPaymentOperator,
      });
    }

    user.paymentMethods = normalizedPaymentMethods.length > 0 ? normalizedPaymentMethods : paymentMethods;

    // #region debug-point A:pre-user-save
    (() => {
      const fs = require("fs");
      const envPath = ".dbg/apply-loan-payment-records.env";
      let url = "http://127.0.0.1:7777/event";
      let sessionId = "apply-loan-payment-records";

      try {
        const envContent = fs.readFileSync(envPath, "utf8");
        url = envContent.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || url;
        sessionId = envContent.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || sessionId;
      } catch {}

      const paymentRecordSummary = (Array.isArray(user.loan?.loans) ? user.loan.loans : []).map(
        (loanItem, index) => ({
          index,
          id: loanItem?.ID || "",
          paymentRecordsCount: Array.isArray(loanItem?.paymentRecords)
            ? loanItem.paymentRecords.length
            : 0,
          invalidPaymentRecordIndexes: (
            Array.isArray(loanItem?.paymentRecords) ? loanItem.paymentRecords : []
          )
            .map((record, recordIndex) => ({
              recordIndex,
              keys: Object.keys(record || {}),
            }))
            .filter(
              (record) =>
                !record.keys.includes("recordType") ||
                !record.keys.includes("loanId") ||
                !record.keys.includes("userId")
            ),
        })
      );

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          runId: "pre-fix",
          hypothesisId: "A",
          location: "backend/src/app/routes/user/customerAuth.js:3213",
          msg: "[DEBUG] portal apply-loan before user save",
          data: {
            phone,
            userId: user.userId,
            loanCount: Array.isArray(user.loan?.loans) ? user.loan.loans.length : 0,
            paymentRecordSummary,
          },
          ts: Date.now(),
        }),
      }).catch(() => {});
    })();
    // #endregion
    const savedUser = await user.save();
    const latestEmbeddedLoan = Array.isArray(savedUser.loan?.loans)
      ? savedUser.loan.loans[savedUser.loan.loans.length - 1]
      : null;
    loans.paymentStatus = loanData.paymentStatus;
    loans.loanStatus = loanData.loanStatus;
    loans.loanId = latestEmbeddedLoan?._id ? String(latestEmbeddedLoan._id) : "";

    const savedLoan = await _saveLoan(loans);
    if (!savedLoan) {
      return res.status(400).json({
        success: 0,
        message: "Loan application could not be saved. Please try again.",
      });
    }

    const refreshedLoans = await Loans.find({ userId: user.userId }).lean();

    return res.status(200).json({
      success: 1,
      message: "Loan application submitted successfully.",
      data: {
        loan: loans,
        loanHistory: refreshedLoans,
        offer: buildPortalOffer(
          savedUser,
          systemConfig,
          refreshedLoans
        ),
        content: buildPortalContent(systemConfig),
        lifecycleConfig: buildLifecycleConfig(systemConfig),
        activeLoan: buildActiveLoanView(
          savedUser,
          systemConfig,
          refreshedLoans
        ),
      },
    });
  } catch (error) {
    // #region debug-point E:apply-loan-catch
    (() => {
      const fs = require("fs");
      const envPath = ".dbg/apply-loan-payment-records.env";
      let url = "http://127.0.0.1:7777/event";
      let sessionId = "apply-loan-payment-records";

      try {
        const envContent = fs.readFileSync(envPath, "utf8");
        url = envContent.match(/DEBUG_SERVER_URL=(.+)/)?.[1] || url;
        sessionId = envContent.match(/DEBUG_SESSION_ID=(.+)/)?.[1] || sessionId;
      } catch {}

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          runId: "pre-fix",
          hypothesisId: "E",
          location: "backend/src/app/routes/user/customerAuth.js:3255",
          msg: "[DEBUG] portal apply-loan threw error",
          data: {
            name: error?.name || "",
            message: error?.message || "",
            validationKeys: error?.errors ? Object.keys(error.errors) : [],
            firstValidationError: error?.errors
              ? error.errors[Object.keys(error.errors)[0]]?.message || ""
              : "",
          },
          ts: Date.now(),
        }),
      }).catch(() => {});
    })();
    // #endregion
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/application/save-draft", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const application = req.body?.application;
    const systemConfig = await getSystemConfig();
    const countryProfile = resolveCountryProfile({
      systemConfig,
      countryCode: req.body?.countryCode || application?.countryCode,
    });

    if (!phone || !application) {
      return res.status(400).json({
        success: 0,
        message: "Phone number and application data are required.",
      });
    }

    const access = await CustomerAccess.findOneAndUpdate(
      { phone },
      {
        $set: {
          phone,
          draftApplication: application,
          countryCode: countryProfile.code,
          countryName: countryProfile.name,
          countryDialCode: countryProfile.dialCode,
          locale: countryProfile.locale,
          timeZone: countryProfile.timeZone,
          currencyCode: countryProfile.currencyCode,
          currencySymbol: countryProfile.currencySymbol,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: 1,
      message: "Draft saved successfully.",
      data: {
        phone: access.phone,
        updatedAt: access?.updatedAt || new Date(),
        country: countryProfile,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/application/update-profile", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const application = req.body?.application;

    if (!phone || !application) {
      return res.status(400).json({
        success: 0,
        message: "Phone number and application data are required.",
      });
    }

    const access = await CustomerAccess.findOne({ phone });
    const existingUser = await User.findOne({ phone });

    if (!access || !access.isPinSet || !existingUser) {
      return res.status(400).json({
        success: 0,
        message: "Existing customer profile not found.",
      });
    }

    const personal = application.personal || {};
    const countryProfile = resolveCountryProfile({
      systemConfig: await getSystemConfig(),
      customer: existingUser,
      access,
      countryCode: req.body?.countryCode || application?.countryCode || existingUser.countryCode,
    });

    existingUser.email = personal.email || existingUser.email;
    existingUser.countryCode = countryProfile.code || existingUser.countryCode || "";
    existingUser.countryName = countryProfile.name || existingUser.countryName || "";
    existingUser.countryDialCode =
      countryProfile.dialCode || existingUser.countryDialCode || "";
    existingUser.locale = countryProfile.locale || existingUser.locale || "";
    existingUser.timeZone = countryProfile.timeZone || existingUser.timeZone || "UTC";
    existingUser.currencyCode = countryProfile.currencyCode || existingUser.currencyCode || "";
    existingUser.currencySymbol =
      countryProfile.currencySymbol || existingUser.currencySymbol || "";
    existingUser.IDinfo = {
      ...(existingUser.IDinfo?.toObject?.() || existingUser.IDinfo || {}),
      gender: personal.gender || existingUser.IDinfo?.gender || "",
    };
    existingUser.pesonalInfo = {
      ...(existingUser.pesonalInfo?.toObject?.() || existingUser.pesonalInfo || {}),
      dob: personal.dob || existingUser.pesonalInfo?.dob || "",
      schoolStatus:
        personal.schoolStatus === "Yes"
          ? true
          : personal.schoolStatus === "No"
          ? false
          : existingUser.pesonalInfo?.schoolStatus ?? false,
      educationalLevel:
        personal.educationalLevel || existingUser.pesonalInfo?.educationalLevel || "",
      residenceType: personal.residenceType || existingUser.pesonalInfo?.residenceType || "",
      dAddress: personal.digitalAddress || existingUser.pesonalInfo?.dAddress || "",
      areaName: personal.areaName || existingUser.pesonalInfo?.areaName || "",
      landMark: personal.landmark || existingUser.pesonalInfo?.landMark || "",
      residenceTime: personal.residenceTime || existingUser.pesonalInfo?.residenceTime || "",
      incomeSource: personal.incomeSource || existingUser.pesonalInfo?.incomeSource || "",
      maritalStatus: personal.maritalStatus || existingUser.pesonalInfo?.maritalStatus || "",
      relativesINOC: personal.dependants || existingUser.pesonalInfo?.relativesINOC || "",
      bUPphone: personal.backupPhone || existingUser.pesonalInfo?.bUPphone || "",
    };
    existingUser.educationInfo = {
      ...(existingUser.educationInfo?.toObject?.() || existingUser.educationInfo || {}),
      highestLevel:
        personal.educationalLevel || existingUser.educationInfo?.highestLevel || "",
    };

    const savedUser = await existingUser.save({ validateModifiedOnly: true });

    await CustomerAccess.findOneAndUpdate(
      { phone },
      {
        $set: {
          countryCode: savedUser.countryCode || access.countryCode || "",
          countryName: savedUser.countryName || access.countryName || "",
          countryDialCode: savedUser.countryDialCode || access.countryDialCode || "",
          locale: savedUser.locale || access.locale || "",
          currencyCode: savedUser.currencyCode || access.currencyCode || "",
          currencySymbol: savedUser.currencySymbol || access.currencySymbol || "",
        },
      }
    );

    return res.status(200).json({
      success: 1,
      message: "Customer profile updated successfully.",
      data: {
        phone: savedUser.phone,
        userId: savedUser.userId,
        customerId: savedUser._id,
        hasProfile: true,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post(
  "/application/submit-profile",
  uploadIdentityPhotos,
  async (req, res) => {
    try {
      const phone = sanitizePhone(req.body?.phone);
      const application = parseJsonField(req.body?.application);

      if (!phone || !application) {
        return res.status(400).json({
          success: 0,
          message: "Phone number and application data are required.",
        });
      }

      const access = await CustomerAccess.findOne({ phone });
      if (!access || !access.isPinSet) {
        return res.status(400).json({
          success: 0,
          message: "PIN account not found. Verify phone and set PIN first.",
        });
      }

      const systemConfig = await getSystemConfig();
      const existingUser = await User.findOne({ phone });
      const files = {
        frontPhoto: req.files?.frontPhoto?.[0]
          ? await resolveUploadedFileUrl(req, req.files.frontPhoto[0], "identity/front", {
              requireSupabase: true,
            })
          : "",
        backPhoto: req.files?.backPhoto?.[0]
          ? await resolveUploadedFileUrl(req, req.files.backPhoto[0], "identity/back", {
              requireSupabase: true,
            })
          : "",
        selfiePhoto: req.files?.selfiePhoto?.[0]
          ? await resolveUploadedFileUrl(req, req.files.selfiePhoto[0], "identity/selfie", {
              requireSupabase: true,
            })
          : "",
      };

      const profile = buildProfilePayload({
        application,
        files,
        existingUser,
        access,
        systemConfig,
      });

      if (!profile.phone || !profile.email) {
        return res.status(400).json({
          success: 0,
          message: "Phone number and email are required to submit the profile.",
        });
      }

      let savedUser = null;

      if (existingUser) {
        existingUser.email = profile.email;
        existingUser.phone = profile.phone;
        existingUser.countryCode = profile.countryCode;
        existingUser.countryName = profile.countryName;
        existingUser.countryDialCode = profile.countryDialCode;
        existingUser.locale = profile.locale;
        existingUser.timeZone = profile.timeZone;
        existingUser.currencyCode = profile.currencyCode;
        existingUser.currencySymbol = profile.currencySymbol;
        existingUser.isActive = profile.isActive;
        existingUser.isVerified = profile.isVerified;
        existingUser.isRegistered = profile.isRegistered;
        existingUser.level = profile.level;
        existingUser.contacts = profile.contacts;
        existingUser.userImage = profile.userImage;
        existingUser.IDinfo = profile.IDinfo;
        existingUser.pesonalInfo = profile.pesonalInfo;
        existingUser.educationInfo = profile.educationInfo;
        existingUser.workInfo = profile.workInfo;
        existingUser.emergncyContacts = profile.emergncyContacts;
        existingUser.paymentMethods = profile.paymentMethods;
        existingUser.loan = profile.loan;
        savedUser = await existingUser.save();
      } else {
        const generatedID = await _generateString(6);
        savedUser = await new User({
          ...profile,
          userId: generatedID,
        }).save();
      }

      await CustomerAccess.findOneAndUpdate(
        { phone },
        {
          $set: {
            phone,
            userId: savedUser.userId,
            customerId: savedUser._id,
            draftApplication: null,
            countryCode: savedUser.countryCode || access.countryCode || "",
            countryName: savedUser.countryName || access.countryName || "",
            countryDialCode: savedUser.countryDialCode || access.countryDialCode || "",
            locale: savedUser.locale || access.locale || "",
            currencyCode: savedUser.currencyCode || access.currencyCode || "",
            currencySymbol: savedUser.currencySymbol || access.currencySymbol || "",
          },
        },
        {
          new: true,
        }
      );

      return res.status(200).json({
        success: 1,
        message: existingUser
          ? "Customer profile updated successfully."
          : "Customer profile created successfully.",
        data: {
          phone: savedUser.phone,
          userId: savedUser.userId,
          customerId: savedUser._id,
          hasProfile: true,
          country: resolveCountryProfile({
            systemConfig,
            customer: savedUser,
            access,
          }),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: 0,
        message:
          error.message ||
          "Profile submission failed before identity images could be saved.",
      });
    }
  }
);

module.exports = router;
