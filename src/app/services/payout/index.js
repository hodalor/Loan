const fetch = require("node-fetch");
const config = require("../../../config");
const { getActiveCountryConfig } = require("../systemConfig");

const DEFAULT_GATEWAY_TIMEOUT_MS = 15000;

const normalizeOperator = (value = "") => value.toLowerCase().trim();
const toSubunitAmount = (amount = 0) => Math.round(Number(amount || 0) * 100);
const digitsOnly = (value = "") => String(value || "").replace(/\D/g, "");
const toValidPhoneLength = (value = "") => {
  const digits = digitsOnly(value);
  return digits.startsWith("0") ? digits.slice(1).length : digits.length;
};
const normalizeBridgePhoneNumber = (value = "", { dialCode = "", phoneExample = "" } = {}) => {
  const digits = digitsOnly(value);
  const dialDigits = digitsOnly(dialCode);

  if (!digits) return "";
  if (!dialDigits) return digits;
  if (digits.startsWith(dialDigits)) return digits;
  if (digits.startsWith("0")) return `${dialDigits}${digits.slice(1)}`;

  const expectedLocalLength = toValidPhoneLength(phoneExample);
  if (expectedLocalLength > 0 && digits.length === expectedLocalLength) {
    return `${dialDigits}${digits}`;
  }

  return digits;
};
const getGatewayTimeoutMs = () => {
  const configuredTimeout = Number(config.paymentRequestTimeoutMs);

  if (Number.isFinite(configuredTimeout) && configuredTimeout > 0) {
    return configuredTimeout;
  }

  return DEFAULT_GATEWAY_TIMEOUT_MS;
};

const parseJsonSafely = (body = "") => {
  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch (error) {
    return {
      rawBody: body,
    };
  }
};

const isTimeoutError = (error = {}) =>
  error?.name === "AbortError" ||
  error?.code === "ETIMEDOUT" ||
  error?.type === "aborted";

const buildGatewayFailure = ({
  provider,
  channel = "",
  reference,
  message,
  raw = null,
  pending = false,
}) => ({
  success: false,
  pending,
  provider,
  channel,
  reference,
  message,
  raw,
});

const formatBridgeRequestTime = (value = new Date()) => {
  const date = new Date(value);
  const pad = (item) => String(item).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const buildBridgeAuthHeader = (username = "", password = "") =>
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
const resolveBridgeCallbackUrl = (configuredUrl = "", fallbackUrl = "") => {
  const rawValue = String(configuredUrl || "").trim();

  if (!rawValue) return fallbackUrl;

  try {
    const parsed = new URL(rawValue);

    if (parsed.pathname && parsed.pathname !== "/") {
      return parsed.toString();
    }

    const resolvedFallback = new URL(fallbackUrl);
    parsed.pathname = resolvedFallback.pathname;
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch (error) {
    return fallbackUrl;
  }
};

const getBridgeCredentials = (systemConfig = {}) => ({
  username: String(systemConfig.apiKey || config.bridgeApiUsername || "").trim(),
  password: String(systemConfig.apiSecret || config.bridgeApiPassword || "").trim(),
  serviceId: Number.parseInt(
    String(config.bridgeServiceId || "").trim(),
    10
  ),
});

const mapOperatorToBridgeNetworkCode = (operator = "") => {
  const normalized = normalizeOperator(operator);

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

const getDisplayName = (user = {}, loan = {}) => {
  const parts = [
    user?.IDinfo?.firstName,
    user?.IDinfo?.middleName,
    user?.IDinfo?.lastName,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  if (parts.length > 0) return parts.join(" ");
  return String(user?.userId || loan?.userId || "Customer").trim();
};

const fetchJsonWithTimeout = async (url, options = {}, providerName = "Gateway") => {
  const timeoutMs = getGatewayTimeoutMs();
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;

  let timeoutId = null;

  try {
    const requestPromise = fetch(url, {
      ...options,
      ...(controller ? { signal: controller.signal } : {}),
    });

    let response;

    if (controller) {
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      response = await requestPromise;
    } else {
      response = await Promise.race([
        requestPromise,
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            const timeoutError = new Error(
              `${providerName} request timed out after ${timeoutMs}ms`
            );
            timeoutError.code = "ETIMEDOUT";
            reject(timeoutError);
          }, timeoutMs);
        }),
      ]);
    }

    const body = await response.text();
    const payload = parseJsonSafely(body);

    return { response, payload };
  } catch (error) {
    const timeoutMessage = `${providerName} request timed out. Please retry later.`;
    const failure = new Error(
      isTimeoutError(error)
        ? timeoutMessage
        : error?.message || `${providerName} request failed.`
    );

    failure.code = isTimeoutError(error) ? "ETIMEDOUT" : error?.code;
    failure.originalError = error;
    throw failure;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const mapOperatorToNsanoMno = (operator = "") => {
  const normalized = normalizeOperator(operator);

  if (normalized.includes("airtel")) return "AIRTELZM";
  if (normalized.includes("mtn")) return "MTNZM";
  if (normalized.includes("zamtel")) return "ZAMTELZM";

  return null;
};

const mapOperatorToPaystackBankCode = (operator = "") => {
  const normalized = normalizeOperator(operator);

  if (normalized.includes("mtn")) return config.paystackMtnBankCode;
  if (normalized.includes("airtel")) return config.paystackAirtelBankCode;
  if (normalized.includes("zamtel")) return config.paystackZamtelBankCode;

  return "";
};

const resolvePaymentMethod = (user, loan) => {
  const normalizedOperator = String(loan?.paymentOperator || "").trim();
  const availableMethods =
    user && Array.isArray(user.paymentMethods)
      ? user.paymentMethods.filter((item) => String(item?.method || "").trim())
      : [];
  const matchedMethod =
    availableMethods.find((item) => item.method === loan.paymentMethod) || null;
  const fallbackMobileMethod =
    availableMethods.find((item) => {
      const method = String(item?.method || "").trim();
      const operator = String(item?.operator || "").trim();
      if (!method || method.includes("@")) return false;
      if (!normalizedOperator) return true;
      return normalizeOperator(operator) === normalizeOperator(normalizedOperator);
    }) ||
    availableMethods.find((item) => {
      const method = String(item?.method || "").trim();
      return method && !method.includes("@");
    }) ||
    null;

  if (matchedMethod) {
    if (!String(loan?.paymentMethod || "").trim()) {
      loan.paymentMethod = String(matchedMethod.method || "").trim();
    }

    return {
      ...matchedMethod,
      operator: normalizedOperator || matchedMethod.operator || "",
    };
  }

  if (loan?.paymentMethod) {
    return {
      method: loan.paymentMethod,
      operator: normalizedOperator,
      email: "",
      isVerified: false,
    };
  }

  if (fallbackMobileMethod) {
    loan.paymentMethod = String(fallbackMobileMethod.method || "").trim();

    return {
      ...fallbackMobileMethod,
      operator: normalizedOperator || fallbackMobileMethod.operator || "",
    };
  }

  const fallbackPhone = String(user?.phone || "").trim();
  if (fallbackPhone) {
    loan.paymentMethod = fallbackPhone;

    return {
      method: fallbackPhone,
      operator: normalizedOperator,
      email: user?.email || "",
      isVerified: false,
    };
  }

  return null;
};

const isTruthyGatewayResponse = (response = {}) => {
  const code = `${response.response_code || response.status || ""}`.toLowerCase();
  const status = `${
    response.status ||
    response.message ||
    response.response_message ||
    response?.data?.status ||
    ""
  }`.toLowerCase();

  return (
    response.status === true ||
    code === "100" ||
    code === "success" ||
    status.includes("success") ||
    status.includes("completed") ||
    status.includes("queued")
  );
};

const payWithZynle = async ({ loan, systemConfig }) => {
  try {
    const { response, payload } = await fetchJsonWithTimeout(
      config.paymentBaseUrl,
      {
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
            method: "runPayToEwallet",
            request_id: `loan-${loan.ID}`,
            receiver_id: loan.paymentMethod,
            reference_no: loan.ID,
            amount: loan.amount,
          },
        }),
      },
      "ZynlePay"
    );

    return {
      success: response.ok && isTruthyGatewayResponse(payload),
      provider: "zynlepay",
      channel: "momo",
      reference: loan.ID,
      message:
        payload.message ||
        payload.response_message ||
        (response.ok ? "Payout request submitted to ZynlePay" : "ZynlePay failed"),
      raw: payload,
    };
  } catch (error) {
    return buildGatewayFailure({
      provider: "zynlepay",
      channel: "momo",
      reference: loan.ID,
      message: error.message || "ZynlePay payout request failed.",
      raw: error.originalError?.message || null,
    });
  }
};

const payWithNsano = async ({ loan, paymentMethod, systemConfig }) => {
  const mno = mapOperatorToNsanoMno(paymentMethod?.operator);

  if (!mno) {
    return {
      success: false,
      provider: "nsano",
      channel: paymentMethod?.operator || "unknown",
      reference: loan.ID,
      message: "The selected payment operator is not supported by Nsano routing.",
      raw: null,
    };
  }

  try {
    const { response, payload } = await fetchJsonWithTimeout(
      `${config.nsanoApiEndpoint}${systemConfig.apiKey || config.nsanoApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          kuwaita: "malipo",
          amount: `${loan.amount}`,
          mno,
          refID: `${loan.ID}`,
          msisdn: paymentMethod.method,
        }),
      },
      "Nsano"
    );

    return {
      success: response.ok && isTruthyGatewayResponse(payload),
      provider: "nsano",
      channel: mno,
      reference: loan.ID,
      message:
        payload.message ||
        payload.response_message ||
        (response.ok ? "Payout request submitted to Nsano" : "Nsano failed"),
      raw: payload,
    };
  } catch (error) {
    return buildGatewayFailure({
      provider: "nsano",
      channel: mno,
      reference: loan.ID,
      message: error.message || "Nsano payout request failed.",
      raw: error.originalError?.message || null,
    });
  }
};

const payWithPaystack = async ({ loan, paymentMethod }) => {
  if (!config.paystackSecretKey) {
    return {
      success: false,
      provider: "paystack",
      channel: "mobile_money",
      reference: loan.ID,
      message: "Paystack secret key is not configured.",
      raw: null,
    };
  }

  const bankCode = mapOperatorToPaystackBankCode(paymentMethod?.operator);
  if (!bankCode) {
    return {
      success: false,
      provider: "paystack",
      channel: paymentMethod?.operator || "mobile_money",
      reference: loan.ID,
      message: "The selected payment operator is not configured for Paystack transfers.",
      raw: null,
    };
  }

  try {
    const { response: recipientResponse, payload: recipientPayload } =
      await fetchJsonWithTimeout(
        `${config.paystackBaseUrl}/transferrecipient`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.paystackSecretKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            type: "mobile_money",
            name: `${loan.userId || "customer"} payout`,
            account_number: paymentMethod.method,
            bank_code: bankCode,
            currency: config.paystackCurrency,
          }),
        },
        "Paystack recipient"
      );
    const recipientCode = recipientPayload?.data?.recipient_code;

    if (!recipientResponse.ok || !recipientCode) {
      return {
        success: false,
        provider: "paystack",
        channel: bankCode,
        reference: loan.ID,
        message:
          recipientPayload?.message || "Paystack recipient creation failed.",
        raw: recipientPayload,
      };
    }

    const transferReference = `loan-${String(loan.ID || Date.now()).toLowerCase()}-${Date.now()}`;
    const { response: transferResponse, payload: transferPayload } =
      await fetchJsonWithTimeout(
        `${config.paystackBaseUrl}/transfer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.paystackSecretKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            source: "balance",
            amount: toSubunitAmount(loan.amount),
            recipient: recipientCode,
            reason: `Loan disbursement ${loan.ID || ""}`.trim(),
            reference: transferReference.slice(0, 50),
            currency: config.paystackCurrency,
          }),
        },
        "Paystack transfer"
      );

    return {
      success: transferResponse.ok && isTruthyGatewayResponse(transferPayload),
      provider: "paystack",
      channel: bankCode,
      reference: transferPayload?.data?.reference || transferReference,
      message:
        transferPayload?.message ||
        (transferResponse.ok ? "Payout request submitted to Paystack" : "Paystack failed"),
      raw: transferPayload,
    };
  } catch (error) {
    return buildGatewayFailure({
      provider: "paystack",
      channel: bankCode,
      reference: loan.ID,
      message: error.message || "Paystack payout request failed.",
      raw: error.originalError?.message || null,
    });
  }
};

const payWithBridge = async ({ loan, user, paymentMethod, systemConfig }) => {
  const bridgeCredentials = getBridgeCredentials(systemConfig);
  const networkCode = mapOperatorToBridgeNetworkCode(paymentMethod?.operator);
  const activeCountry = getActiveCountryConfig(systemConfig);
  const normalizedCustomerNumber = normalizeBridgePhoneNumber(paymentMethod?.method, {
    dialCode: user?.countryDialCode || activeCountry?.dialCode || "",
    phoneExample: activeCountry?.phoneExample || "",
  });

  if (!bridgeCredentials.username || !bridgeCredentials.password || !bridgeCredentials.serviceId) {
    return buildGatewayFailure({
      provider: "bridge",
      channel: "momo",
      reference: loan.ID,
      message:
        "Bridge credentials are incomplete. Set BRIDGE_API_USERNAME, BRIDGE_API_PASSWORD, and BRIDGE_SERVICE_ID.",
    });
  }

  if (!networkCode) {
    return buildGatewayFailure({
      provider: "bridge",
      channel: paymentMethod?.operator || "unknown",
      reference: loan.ID,
      message: "The selected payment operator is not supported by Bridge routing.",
      raw: {
        operator: paymentMethod?.operator || "",
        paymentMethod: paymentMethod?.method || "",
      },
    });
  }

  if (!normalizedCustomerNumber) {
    return buildGatewayFailure({
      provider: "bridge",
      channel: networkCode || "momo",
      reference: loan.ID,
      message: "A valid payout phone number is required for Bridge disbursement.",
      raw: {
        operator: paymentMethod?.operator || "",
        paymentMethod: paymentMethod?.method || "",
        dialCode: user?.countryDialCode || activeCountry?.dialCode || "",
      },
    });
  }

  try {
    const transactionId = `bridge-payout-${String(loan.ID || Date.now())}-${Date.now()}`.slice(
      0,
      80
    );
    const callbackUrl = resolveBridgeCallbackUrl(
      config.bridgeCallbackUrl || systemConfig.callbackUrl,
      "http://localhost:5000/loans/bridge/webhook"
    );
    const requestBody = {
      service_id: bridgeCredentials.serviceId,
      reference: `Loan disbursement ${loan.ID || ""}`.trim(),
      customer_number: normalizedCustomerNumber,
      transaction_id: transactionId,
      trans_type: "MTC",
      amount: Number(loan.amount || 0),
      nw: networkCode,
      nickname: getDisplayName(user, loan),
      payment_option: "MOM",
      currency_code: activeCountry?.currencyCode || config.bridgeCurrencyCode,
      currency_val: config.bridgeCurrencyValue,
      callback_url: callbackUrl,
      request_time: formatBridgeRequestTime(),
    };
    const { response, payload } = await fetchJsonWithTimeout(
      `${config.bridgeBaseUrl}/make_payment`,
      {
        method: "POST",
        headers: {
          Authorization: buildBridgeAuthHeader(
            bridgeCredentials.username,
            bridgeCredentials.password
          ),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      },
      "Bridge"
    );
    const accepted = response.ok && `${payload?.response_code || ""}` === "202";

    return {
      success: false,
      pending: accepted,
      provider: "bridge",
      channel: networkCode,
      reference: transactionId,
      message: accepted
        ? payload?.response_message || "Bridge payout accepted and is awaiting callback."
        : payload?.response_message || "Bridge payout request failed.",
      raw: {
        request: requestBody,
        response: payload,
      },
    };
  } catch (error) {
    return buildGatewayFailure({
      provider: "bridge",
      channel: networkCode,
      reference: loan.ID,
      message: error.message || "Bridge payout request failed.",
      raw: {
        customerNumber: normalizedCustomerNumber,
        originalNumber: paymentMethod?.method || "",
        operator: paymentMethod?.operator || "",
        gatewayError: error.originalError?.message || null,
      },
    });
  }
};

const processLoanDisbursement = async ({
  loan,
  user,
  systemConfig,
  paymentMethodOverride = null,
}) => {
  const paymentMethod = paymentMethodOverride || resolvePaymentMethod(user, loan);
  const disbursementGateway = String(
    systemConfig.disbursementGateway || systemConfig.activeChannel || ""
  ).trim();

  if (!paymentMethod) {
    return {
      success: false,
      provider: disbursementGateway || systemConfig.activeChannel,
      channel: "",
      reference: loan.ID,
      message: "Customer payment method could not be resolved for disbursement.",
      raw: null,
    };
  }

  if (disbursementGateway === "bridge") {
    return payWithBridge({ loan, user, paymentMethod, systemConfig });
  }

  if (disbursementGateway === "nsano") {
    return payWithNsano({ loan, paymentMethod, systemConfig });
  }

  if (disbursementGateway === "paystack") {
    return payWithPaystack({ loan, paymentMethod, systemConfig });
  }

  return payWithZynle({ loan, paymentMethod, systemConfig });
};

const payWithZynleTransfer = async ({ transfer, systemConfig }) => {
  try {
    const { response, payload } = await fetchJsonWithTimeout(
      config.paymentBaseUrl,
      {
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
            method: "runPayToEwallet",
            request_id: transfer.reference,
            receiver_id: transfer.destinationNumber,
            reference_no: transfer.reference,
            amount: transfer.amount,
          },
        }),
      },
      "ZynlePay"
    );

    return {
      success: response.ok && isTruthyGatewayResponse(payload),
      provider: "zynlepay",
      channel: "momo",
      reference: transfer.reference,
      message:
        payload.message ||
        payload.response_message ||
        (response.ok ? "Payout request submitted to ZynlePay" : "ZynlePay failed"),
      raw: payload,
    };
  } catch (error) {
    return buildGatewayFailure({
      provider: "zynlepay",
      channel: "momo",
      reference: transfer.reference,
      message: error.message || "ZynlePay payout request failed.",
      raw: error.originalError?.message || null,
    });
  }
};

const payWithNsanoTransfer = async ({ transfer, systemConfig }) => {
  const mno = mapOperatorToNsanoMno(transfer.destinationOperator);

  if (!mno) {
    return buildGatewayFailure({
      provider: "nsano",
      channel: transfer.destinationOperator || "unknown",
      reference: transfer.reference,
      message: "The selected payment operator is not supported by Nsano routing.",
    });
  }

  try {
    const { response, payload } = await fetchJsonWithTimeout(
      `${config.nsanoApiEndpoint}${systemConfig.apiKey || config.nsanoApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          kuwaita: "malipo",
          amount: `${transfer.amount}`,
          mno,
          refID: `${transfer.reference}`,
          msisdn: transfer.destinationNumber,
        }),
      },
      "Nsano"
    );

    return {
      success: response.ok && isTruthyGatewayResponse(payload),
      provider: "nsano",
      channel: mno,
      reference: transfer.reference,
      message:
        payload.message ||
        payload.response_message ||
        (response.ok ? "Payout request submitted to Nsano" : "Nsano failed"),
      raw: payload,
    };
  } catch (error) {
    return buildGatewayFailure({
      provider: "nsano",
      channel: mno,
      reference: transfer.reference,
      message: error.message || "Nsano payout request failed.",
      raw: error.originalError?.message || null,
    });
  }
};

const payWithPaystackTransfer = async ({ transfer }) => {
  if (!config.paystackSecretKey) {
    return buildGatewayFailure({
      provider: "paystack",
      channel: "mobile_money",
      reference: transfer.reference,
      message: "Paystack secret key is not configured.",
    });
  }

  const bankCode = mapOperatorToPaystackBankCode(transfer.destinationOperator);
  if (!bankCode) {
    return buildGatewayFailure({
      provider: "paystack",
      channel: transfer.destinationOperator || "mobile_money",
      reference: transfer.reference,
      message: "The selected payment operator is not configured for Paystack transfers.",
    });
  }

  try {
    const { response: recipientResponse, payload: recipientPayload } =
      await fetchJsonWithTimeout(
        `${config.paystackBaseUrl}/transferrecipient`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.paystackSecretKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            type: "mobile_money",
            name: `${transfer.recipientName || "staff"} payout`,
            account_number: transfer.destinationNumber,
            bank_code: bankCode,
            currency: config.paystackCurrency,
          }),
        },
        "Paystack recipient"
      );
    const recipientCode = recipientPayload?.data?.recipient_code;

    if (!recipientResponse.ok || !recipientCode) {
      return buildGatewayFailure({
        provider: "paystack",
        channel: bankCode,
        reference: transfer.reference,
        message: recipientPayload?.message || "Paystack recipient creation failed.",
        raw: recipientPayload,
      });
    }

    const transferReference = `${String(transfer.reference || Date.now()).toLowerCase()}-${Date.now()}`;
    const { response: transferResponse, payload: transferPayload } =
      await fetchJsonWithTimeout(
        `${config.paystackBaseUrl}/transfer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.paystackSecretKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            source: "balance",
            amount: toSubunitAmount(transfer.amount),
            recipient: recipientCode,
            reason: String(transfer.reason || "Staff payment").trim(),
            reference: transferReference.slice(0, 50),
            currency: config.paystackCurrency,
          }),
        },
        "Paystack transfer"
      );

    return {
      success: transferResponse.ok && isTruthyGatewayResponse(transferPayload),
      provider: "paystack",
      channel: bankCode,
      reference: transferPayload?.data?.reference || transferReference,
      message:
        transferPayload?.message ||
        (transferResponse.ok ? "Payout request submitted to Paystack" : "Paystack failed"),
      raw: transferPayload,
    };
  } catch (error) {
    return buildGatewayFailure({
      provider: "paystack",
      channel: bankCode,
      reference: transfer.reference,
      message: error.message || "Paystack payout request failed.",
      raw: error.originalError?.message || null,
    });
  }
};

const payWithBridgeTransfer = async ({ transfer, systemConfig }) => {
  const bridgeCredentials = getBridgeCredentials(systemConfig);
  const activeCountry = getActiveCountryConfig(systemConfig);
  const normalizedCustomerNumber = normalizeBridgePhoneNumber(transfer.destinationNumber, {
    dialCode: activeCountry?.dialCode || "",
    phoneExample: activeCountry?.phoneExample || "",
  });

  if (!bridgeCredentials.username || !bridgeCredentials.password || !bridgeCredentials.serviceId) {
    return buildGatewayFailure({
      provider: "bridge",
      channel: "momo",
      reference: transfer.reference,
      message:
        "Bridge credentials are incomplete. Set BRIDGE_API_USERNAME, BRIDGE_API_PASSWORD, and BRIDGE_SERVICE_ID.",
    });
  }

  const networkCode = mapOperatorToBridgeNetworkCode(transfer.destinationOperator);
  if (!networkCode) {
    return buildGatewayFailure({
      provider: "bridge",
      channel: transfer.destinationOperator || "momo",
      reference: transfer.reference,
      message: "The selected mobile money operator is not supported for Bridge payouts.",
      raw: {
        operator: transfer.destinationOperator || "",
        destinationNumber: transfer.destinationNumber || "",
      },
    });
  }

  if (!normalizedCustomerNumber) {
    return buildGatewayFailure({
      provider: "bridge",
      channel: networkCode,
      reference: transfer.reference,
      message: "A valid mobile money number is required for Bridge payouts.",
      raw: {
        operator: transfer.destinationOperator || "",
        destinationNumber: transfer.destinationNumber || "",
        dialCode: activeCountry?.dialCode || "",
      },
    });
  }

  try {
    const callbackUrl = resolveBridgeCallbackUrl(
      config.bridgeCallbackUrl,
      `${config.baseUrl}/admin/fund-requests/bridge-webhook`
    );
    const requestBody = {
      service_id: bridgeCredentials.serviceId,
      reference: String(transfer.reason || "Staff payment").trim(),
      customer_number: normalizedCustomerNumber,
      transaction_id: transfer.reference,
      trans_type: "MTC",
      amount: Number(transfer.amount || 0),
      nw: networkCode,
      nickname: transfer.recipientName || "Staff",
      payment_option: "MOM",
      currency_code: activeCountry?.currencyCode || config.bridgeCurrencyCode,
      currency_val: config.bridgeCurrencyValue,
      callback_url: callbackUrl,
      request_time: formatBridgeRequestTime(),
    };

    const { response, payload } = await fetchJsonWithTimeout(
      `${config.bridgeBaseUrl}/make_payment`,
      {
        method: "POST",
        headers: {
          Authorization: buildBridgeAuthHeader(
            bridgeCredentials.username,
            bridgeCredentials.password
          ),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      },
      "Bridge"
    );

    const ok = response.status === 202 || response.ok;
    return {
      success: ok && response.status !== 202 && isTruthyGatewayResponse(payload),
      pending: response.status === 202,
      provider: "bridge",
      channel: networkCode,
      reference: transfer.reference,
      message:
        payload?.status_desc ||
        payload?.message ||
        (response.status === 202
          ? "Bridge accepted the payout request and is awaiting callback confirmation."
          : response.ok
          ? "Payout request submitted to Bridge"
          : "Bridge payout failed"),
      raw: {
        request: requestBody,
        response: payload,
      },
    };
  } catch (error) {
    return buildGatewayFailure({
      provider: "bridge",
      channel: transfer.destinationOperator || "momo",
      reference: transfer.reference,
      message: error.message || "Bridge payout request failed.",
      raw: {
        customerNumber: normalizedCustomerNumber,
        originalNumber: transfer.destinationNumber || "",
        operator: transfer.destinationOperator || "",
        gatewayError: error.originalError?.message || null,
      },
    });
  }
};

const processInternalTransfer = async ({
  amount,
  recipientNumber,
  recipientName,
  operator,
  reference,
  reason,
  systemConfig = {},
}) => {
  const provider = String(
    systemConfig.disbursementGateway || systemConfig.activeChannel || "zynlepay"
  )
    .trim()
    .toLowerCase();
  const transfer = {
    amount: Number(amount || 0),
    destinationNumber: String(recipientNumber || "").trim(),
    destinationOperator: String(operator || "").trim(),
    recipientName: String(recipientName || "Staff").trim(),
    reference: String(reference || `fund-${Date.now()}`).trim(),
    reason: String(reason || "Staff payment").trim(),
  };

  if (!transfer.destinationNumber || transfer.amount <= 0) {
    return buildGatewayFailure({
      provider,
      channel: transfer.destinationOperator,
      reference: transfer.reference,
      message: "A valid destination number and amount are required for payment sending.",
    });
  }

  if (provider === "bridge") {
    return payWithBridgeTransfer({ transfer, systemConfig });
  }

  if (provider === "nsano") {
    return payWithNsanoTransfer({ transfer, systemConfig });
  }

  if (provider === "paystack") {
    return payWithPaystackTransfer({ transfer, systemConfig });
  }

  return payWithZynleTransfer({ transfer, systemConfig });
};

module.exports = {
  processLoanDisbursement,
  processInternalTransfer,
  resolvePaymentMethod,
};
