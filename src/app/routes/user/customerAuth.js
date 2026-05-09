const express = require("express");
const crypto = require("crypto");
const fetch = require("node-fetch");
const CustomerAccess = require("../../models/customerAccess");
const GatewayTransactions = require("../../models/gatewayTransactions");
const Loans = require("../../models/loans");
const User = require("../../models/users");
const { upload } = require("../../../libs/uploadImage");
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

const router = express.Router();

const sanitizePhone = (value = "") => String(value).trim();
const buildFileUrl = (req, file) =>
  `${req.protocol}://${req.get("host")}/upload/${file.filename}`;
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
const countSettledLoans = (user = {}) =>
  (user.loan?.loans || []).filter(
    (loan) => loan.loanStatus === "Granted" && loan.paymentStatus === "Paid"
  ).length;
const getDefaultPaymentMethod = (user = {}) => ({
  method: sanitizePhone(user.phone || ""),
  operator: "Default",
  email: user.email || "",
  isVerified: false,
});
const getPortalPaymentMethods = (user = {}) =>
  Array.isArray(user.paymentMethods) && user.paymentMethods.length > 0
    ? user.paymentMethods
    : user.phone
    ? [getDefaultPaymentMethod(user)]
    : [];
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
  appName: systemConfig.portalContent?.appName || "Pathway Loans",
  logoUrl: systemConfig.portalContent?.logoUrl || "",
  tagline:
    systemConfig.portalContent?.tagline ||
    "Fast customer login, application tracking, and identity verification.",
  footerText: systemConfig.portalContent?.footerText || "All rights reserved.",
  footerVersion: systemConfig.portalContent?.footerVersion || "1.5.0",
  faqs: systemConfig.portalContent?.faqs || [],
  repaymentTutorials: systemConfig.portalContent?.repaymentTutorials || [],
  supportPhone: systemConfig.portalContent?.supportPhone || "",
  supportEmail: systemConfig.portalContent?.supportEmail || "",
  supportWhatsapp: systemConfig.portalContent?.supportWhatsapp || "",
  activeCountry: buildCountryProfile(getActiveCountryConfig(systemConfig)),
  countries: (Array.isArray(systemConfig.countries) ? systemConfig.countries : [])
    .filter((country) => country?.isEnabled !== false)
    .map((country) => buildCountryProfile(country)),
});
const buildLifecycleConfig = (systemConfig = {}) => ({
  overduePenaltyRate: Number(systemConfig.overduePenaltyRate || 0),
  allowPartialRepayment: Boolean(systemConfig.allowPartialRepayment),
  activeCountry: buildCountryProfile(getActiveCountryConfig(systemConfig)),
  repaymentOptions: (Array.isArray(systemConfig.repaymentOptions) ? systemConfig.repaymentOptions : [])
    .filter((item) => item?.isEnabled)
    .map((item) => ({
      key: item.key,
      label: item.label,
    })),
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
const mergeLoanCollections = (user = {}, globalLoans = []) => {
  const embeddedLoans = Array.isArray(user.loan?.loans) ? user.loan.loans : [];
  const globalMap = new Map(
    (Array.isArray(globalLoans) ? globalLoans : []).map((loan) => [loan.ID, loan])
  );

  const mergedLoans = embeddedLoans.map((loan) => ({
    ...loan,
    ...(globalMap.get(loan.ID) || {}),
  }));

  const knownIds = new Set(mergedLoans.map((loan) => loan.ID));
  const extraGlobalLoans = (Array.isArray(globalLoans) ? globalLoans : []).filter(
    (loan) => loan?.ID && !knownIds.has(loan.ID)
  );

  return [...mergedLoans, ...extraGlobalLoans].sort(
    (left, right) =>
      new Date(right.doa || right.createdAt || 0) - new Date(left.doa || left.createdAt || 0)
  );
};
const getUserLoanHistory = (user = {}, globalLoans = []) =>
  mergeLoanCollections(user, globalLoans);
const getCurrentPortalLoan = (user = {}, globalLoans = []) => {
  const loans = getUserLoanHistory(user, globalLoans);
  return (
    loans.find((loan) => loan.loanStatus === "Review") ||
    loans.find((loan) => loan.loanStatus === "Granted" && loan.paymentStatus !== "Paid") ||
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
const getDayDifference = (futureDateValue) => {
  const today = startOfDay(new Date());
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
  const daysRemaining = dueDate ? getDayDifference(dueDate) : null;
  const overdueDays = daysRemaining !== null && daysRemaining < 0 ? Math.abs(daysRemaining) : 0;
  const overduePenalty = toMoney(
    overdueDays > 0
      ? ((Number(lifecycleConfig.overduePenaltyRate || 0) / 100) * amount) * overdueDays
      : 0
  );
  const totalDue = toMoney(outstandingBalance + overduePenalty);

  let statusKey = "not-applied";
  let title = "No active loan";
  let message = "You can apply for a new loan.";
  const isAwaitingDisbursement =
    loan.loanStatus === "Granted" &&
    (!loan.isDisbursed || `${loan.payoutStatus || ""}`.toLowerCase() === "pending-manual");

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
      "Your loan has been approved and is waiting for manual disbursement confirmation.";
  } else if (loan.loanStatus === "Granted" && loan.paymentStatus === "Paid") {
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
const getRepaymentSourceAccount = (user = {}) => {
  const paymentMethods = Array.isArray(user.paymentMethods) ? user.paymentMethods : [];

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
  const reference = `${referencePrefix}-${Date.now()}-${String(user.userId || "customer").toLowerCase()}`.slice(
    0,
    80
  );

  const response = await fetch(`${config.paystackBaseUrl}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: user.email || `${sanitizePhone(user.phone || "customer")}@pathway.local`,
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
    const globalLoan = await Loans.findOne({ ID: activeLoanView.loanId });

    if (!globalLoan) {
      throw new Error("Loan record not found.");
    }

    const userResult = await _clearLoan({
      ID: activeLoanView.loanId,
      dp: new Date(),
      userId: user.userId,
      clear: payAmount >= toMoney(activeLoanView.totalDue || 0),
      amt: payAmount,
    });
    const loanResult = await _payLoan({
      id: globalLoan.loanId,
      payAmount,
    });

    if (!userResult || !loanResult) {
      throw new Error("Payment was confirmed but the loan record could not be updated.");
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

  const summary = await buildPortalSummaryData(transaction.phone);
  if (!summary) {
    throw new Error("Customer portal data could not be refreshed after payment.");
  }

  return summary;
};
const finalizePortalGatewayTransaction = async ({ reference, webhookEvent = null }) => {
  const transaction = await GatewayTransactions.findOne({ reference });

  if (!transaction) {
    return {
      success: 0,
      message: "Transaction reference was not found.",
      status: "missing",
    };
  }

  if (transaction.processed) {
    const summary = await buildPortalSummaryData(transaction.phone);
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

  const verification = await verifyPaystackCharge(reference);
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
      ? await buildPortalSummaryData(latestTransaction.phone)
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
  context = {},
}) => {
  if (
    (systemConfig.gatewayProvider === "paystack" ||
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
      message: "Card payments are only available when Paystack is the active gateway.",
    };
  }

  const sourceAccount = getRepaymentSourceAccount(user);
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
const buildPortalSummaryData = async (phone) => {
  const [updatedUser, refreshedAccess, refreshedConfig] = await Promise.all([
    User.findOne({ phone }).lean(),
    CustomerAccess.findOne({ phone }).lean(),
    getSystemConfig(),
  ]);

  if (!updatedUser) return null;

  const refreshedLoans = await Loans.find({ userId: updatedUser.userId }).lean();

  return {
    loanHistory: refreshedLoans,
    activeLoan: buildActiveLoanView(updatedUser, refreshedConfig, refreshedLoans),
    offer: buildPortalOffer(updatedUser, refreshedConfig, refreshedLoans),
    content: buildPortalContent(refreshedConfig),
    lifecycleConfig: buildLifecycleConfig(refreshedConfig),
    country: resolveCountryProfile({
      systemConfig: refreshedConfig,
      customer: updatedUser,
      access: refreshedAccess,
    }),
    customer: updatedUser,
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
      `${sanitizePhone(personal.phone || existingUser?.phone || "customer")}@pathway.local`,
    phone: sanitizePhone(personal.phone || existingUser?.phone || ""),
    countryCode:
      countryProfile.code || existingUser?.countryCode || access?.countryCode || "",
    countryName:
      countryProfile.name || existingUser?.countryName || access?.countryName || "",
    countryDialCode:
      countryProfile.dialCode || existingUser?.countryDialCode || access?.countryDialCode || "",
    locale: countryProfile.locale || existingUser?.locale || access?.locale || "",
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

    const existingUser = await User.findOne({ phone }).lean();
    const existingAccess = await CustomerAccess.findOne({ phone }).lean();

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

    const verification = consumeVerifiedOtp({ phone, purpose });
    if (!verification.success) {
      return res.status(400).json({
        success: 0,
        message: verification.message,
      });
    }

    const existingUser = await User.findOne({ phone });
    const encryptedPin = await _encrypt(pin);

    const access = await CustomerAccess.findOneAndUpdate(
      { phone },
      {
        $set: {
          phone,
          pin: encryptedPin,
          userId: existingUser?.userId || null,
          customerId: existingUser?._id || null,
          isPinSet: true,
          countryCode: countryProfile.code || existingUser?.countryCode || "",
          countryName: countryProfile.name || existingUser?.countryName || "",
          countryDialCode: countryProfile.dialCode || existingUser?.countryDialCode || "",
          locale: countryProfile.locale || existingUser?.locale || "",
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

    if (!phone || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        success: 0,
        message: "Phone number and 4-digit PIN are required.",
      });
    }

    const access = await CustomerAccess.findOne({ phone });

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

    const existingUser = await User.findOne({ phone }).lean();
    access.userId = existingUser?.userId || access.userId;
    access.customerId = existingUser?._id || access.customerId;
    await access.save();

    return res.status(200).json({
      success: 1,
      message: "Login successful.",
      data: {
        phone,
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

    const globalLoans = customer?.userId
      ? await Loans.find({ userId: customer.userId }).lean()
      : [];

    return res.status(200).json({
      success: 1,
      data: {
        phone,
        hasProfile: Boolean(customer),
        customer: customer || null,
        loanHistory: globalLoans,
        draftApplication: access.draftApplication || null,
        country: resolveCountryProfile({
          systemConfig,
          customer,
          access,
        }),
        offer: customer ? buildPortalOffer(customer, systemConfig, globalLoans) : null,
        content: buildPortalContent(systemConfig),
        lifecycleConfig: buildLifecycleConfig(systemConfig),
        activeLoan: customer ? buildActiveLoanView(customer, systemConfig, globalLoans) : null,
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

    if (!phone || !methodKey) {
      return res.status(400).json({
        success: 0,
        message: "Phone number and repayment method are required.",
      });
    }

    const [user, systemConfig] = await Promise.all([
      User.findOne({ phone }),
      getSystemConfig(),
    ]);

    if (!user) {
      return res.status(404).json({
        success: 0,
        message: "Customer profile not found.",
      });
    }

    const currentUserData = user.toObject();
    const globalLoans = await Loans.find({ userId: user.userId }).lean();
    const activeLoanView = buildActiveLoanView(currentUserData, systemConfig, globalLoans);
    if (!activeLoanView || !activeLoanView.canMakePayment) {
      return res.status(400).json({
        success: 0,
        message: "There is no active loan available for repayment.",
      });
    }

    const payAmount =
      repaymentType === "full"
        ? toMoney(activeLoanView.totalDue || 0)
        : Math.min(requestedAmount, toMoney(activeLoanView.totalDue || 0));

    if (payAmount <= 0) {
      return res.status(400).json({
        success: 0,
        message: "Repayment amount must be greater than zero.",
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
    });

    if (!gatewayResult.success) {
      if (gatewayResult.pending) {
        return res.status(200).json({
          success: 2,
          message: gatewayResult.message,
          data: {
            checkoutUrl: gatewayResult.checkoutUrl,
            reference: gatewayResult.reference,
            activeLoan: activeLoanView,
          },
        });
      }

      return res.status(400).json({
        success: 0,
        message: gatewayResult.message,
      });
    }

    const globalLoan = await Loans.findOne({ ID: activeLoanView.loanId });
    if (!globalLoan) {
      return res.status(404).json({
        success: 0,
        message: "Loan record not found.",
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
      id: globalLoan.loanId,
      payAmount,
    });

    if (!userResult || !loanResult) {
      return res.status(400).json({
        success: 0,
        message: "Payment was received but the loan record could not be updated.",
      });
    }

    const [updatedUser, refreshedConfig] = await Promise.all([
      User.findOne({ phone }).lean(),
      getSystemConfig(),
    ]);

    return res.status(200).json({
      success: 1,
      message:
        payAmount >= toMoney(activeLoanView.totalDue || 0)
          ? "Payment completed successfully. Your level has been updated if applicable."
          : "Payment completed successfully.",
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
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/portal/extend-loan", async (req, res) => {
  try {
    const phone = sanitizePhone(req.body?.phone);
    const extensionKey = String(req.body?.extensionKey || "").trim();
    const methodKey = String(req.body?.methodKey || "").trim();

    if (!phone || !extensionKey || !methodKey) {
      return res.status(400).json({
        success: 0,
        message: "Phone number, extension option and repayment method are required.",
      });
    }

    const [user, systemConfig] = await Promise.all([
      User.findOne({ phone }),
      getSystemConfig(),
    ]);

    if (!user) {
      return res.status(404).json({
        success: 0,
        message: "Customer profile not found.",
      });
    }

    const currentUserData = user.toObject();
    const globalLoans = await Loans.find({ userId: user.userId }).lean();
    const activeLoanView = buildActiveLoanView(currentUserData, systemConfig, globalLoans);
    if (!activeLoanView || !activeLoanView.canExtend) {
      return res.status(400).json({
        success: 0,
        message: "Loan extension is only available on or before the due date.",
      });
    }

    const extensionOption = (activeLoanView.extensionOptions || []).find(
      (item) => item.key === extensionKey
    );

    if (!extensionOption) {
      return res.status(400).json({
        success: 0,
        message: "The selected extension option is not available.",
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
    });

    if (!gatewayResult.success) {
      if (gatewayResult.pending) {
        return res.status(200).json({
          success: 2,
          message: gatewayResult.message,
          data: {
            checkoutUrl: gatewayResult.checkoutUrl,
            reference: gatewayResult.reference,
            activeLoan: activeLoanView,
            extension: extensionOption,
          },
        });
      }

      return res.status(400).json({
        success: 0,
        message: gatewayResult.message,
      });
    }

    const globalLoan = await Loans.findOne({ ID: activeLoanView.loanId });
    if (!globalLoan) {
      return res.status(404).json({
        success: 0,
        message: "Loan record not found.",
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
      return res.status(400).json({
        success: 0,
        message: "Extension payment was received but the loan due date could not be updated.",
      });
    }

    const [updatedUser, refreshedConfig] = await Promise.all([
      User.findOne({ phone }).lean(),
      getSystemConfig(),
    ]);

    return res.status(200).json({
      success: 1,
      message: "Extension completed successfully.",
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
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/portal/paystack/verify", async (req, res) => {
  try {
    const reference = getPaystackReferenceFromPayload(req.body);

    if (!reference) {
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
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
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

    const access = await CustomerAccess.findOne({ phone });
    const user = await User.findOne({ phone });

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

    const systemConfig = await getSystemConfig();
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

    if (!payoutMethod?.method) {
      return res.status(400).json({
        success: 0,
        message: "No payout method is available on this profile yet.",
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
    if (!Array.isArray(user.paymentMethods) || user.paymentMethods.length === 0) {
      user.paymentMethods = paymentMethods;
    }

    await user.save();
    loans.paymentStatus = loanData.paymentStatus;
    loans.loanStatus = loanData.loanStatus;
    await _saveLoan(loans);

    return res.status(200).json({
      success: 1,
      message: "Loan application submitted successfully.",
      data: {
        loan: loans,
        loanHistory: await Loans.find({ userId: user.userId }).lean(),
        offer: buildPortalOffer(
          user,
          systemConfig,
          await Loans.find({ userId: user.userId }).lean()
        ),
        content: buildPortalContent(systemConfig),
        lifecycleConfig: buildLifecycleConfig(systemConfig),
        activeLoan: buildActiveLoanView(
          user,
          systemConfig,
          await Loans.find({ userId: user.userId }).lean()
        ),
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
          ? buildFileUrl(req, req.files.frontPhoto[0])
          : "",
        backPhoto: req.files?.backPhoto?.[0]
          ? buildFileUrl(req, req.files.backPhoto[0])
          : "",
        selfiePhoto: req.files?.selfiePhoto?.[0]
          ? buildFileUrl(req, req.files.selfiePhoto[0])
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
        message: "Internal error: code(500)!",
      });
    }
  }
);

module.exports = router;
