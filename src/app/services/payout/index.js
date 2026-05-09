const fetch = require("node-fetch");
const config = require("../../../config");

const DEFAULT_GATEWAY_TIMEOUT_MS = 15000;

const normalizeOperator = (value = "") => value.toLowerCase().trim();
const toSubunitAmount = (amount = 0) => Math.round(Number(amount || 0) * 100);
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
}) => ({
  success: false,
  provider,
  channel,
  reference,
  message,
  raw,
});

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
  if (!user || !Array.isArray(user.paymentMethods)) return null;

  return (
    user.paymentMethods.find((item) => item.method === loan.paymentMethod) || null
  );
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

const processLoanDisbursement = async ({ loan, user, systemConfig }) => {
  const paymentMethod = resolvePaymentMethod(user, loan);

  if (!paymentMethod) {
    return {
      success: false,
      provider: systemConfig.activeChannel,
      channel: "",
      reference: loan.ID,
      message: "Customer payment method could not be resolved for disbursement.",
      raw: null,
    };
  }

  if (systemConfig.activeChannel === "nsano") {
    return payWithNsano({ loan, paymentMethod, systemConfig });
  }

  if (systemConfig.activeChannel === "paystack") {
    return payWithPaystack({ loan, paymentMethod, systemConfig });
  }

  return payWithZynle({ loan, paymentMethod, systemConfig });
};

module.exports = {
  processLoanDisbursement,
  resolvePaymentMethod,
};
