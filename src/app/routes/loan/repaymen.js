const express = require("express");
const fetch = require("node-fetch");
const Users = require("../../models/users");
const GatewayTransactions = require("../../models/gatewayTransactions");
const _checkOverdues = require("../../../libs/checkOverdue");
const _payLoan = require("../../handlers/loanHandlers/payLoan");
const _checkLevel = require("../../../libs/levelCheck");
const config = require("../../../config");
const _generateString = require("../../../libs/generateID");
const { getSystemConfig, getActiveCountryConfig } = require("../../services/systemConfig");
const { logSystemEvent } = require("../../../libs/logger");

const LEGACY_GATEWAY_STATUS_URL = "https://zambia-1.onrender.com";
const router = express.Router();

const normalizeOperator = (value = "") => String(value || "").toLowerCase().trim();
const toMoney = (value = 0) => Number.parseFloat(Number(value || 0).toFixed(2));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const buildBridgeAuthHeader = (username = "", password = "") =>
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
const formatBridgeRequestTime = (value = new Date()) => {
  const date = new Date(value);
  const pad = (item) => String(item).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
const normalizeBridgeReference = (value = "") =>
  String(value || "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
const getBridgeCallbackReferenceCandidates = (payload = {}) =>
  [
    payload.trans_ref,
    payload.transaction_id,
    payload.client_ref,
    payload.reference,
    payload.collection_trans_id,
    payload.trans_id,
  ]
    .map((value) => normalizeBridgeReference(value))
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
const getBridgeCredentials = (systemConfig = {}) => ({
  username: String(systemConfig.apiKey || config.bridgeApiUsername || "").trim(),
  password: String(systemConfig.apiSecret || config.bridgeApiPassword || "").trim(),
  serviceId: Number.parseInt(String(config.bridgeServiceId || "").trim(), 10),
});
const getLegacyActiveLoan = (user = {}) =>
  Array.isArray(user?.loan?.loans)
    ? user.loan.loans.find((item) => item?.isNewLoan === true) || null
    : null;

const settleLegacyRepayment = async ({ user, payAmount }) => {
  const loans = Array.isArray(user?.loan?.loans) ? [...user.loan.loans] : [];
  const activeLoan = getLegacyActiveLoan(user);

  if (!activeLoan) {
    return {
      success: false,
      message: "No active loan was found for this customer.",
    };
  }

  const repaymentAmount = Number.parseFloat(activeLoan.repaymentAmount || 0) || 0;
  const amountPaid = Number.parseFloat(activeLoan.amountPaid || 0) || 0;
  const nextPaidAmount = amountPaid + Number.parseFloat(payAmount || 0);
  const computedAmount = repaymentAmount - nextPaidAmount;

  const updatedActiveLoan = {
    ...activeLoan,
    paymentStatus: computedAmount > 0 ? "Not paid" : "Paid",
    loanStatus: "Granted",
    isNewLoan: computedAmount > 0,
    dp: new Date(),
    amountPaid: JSON.stringify(nextPaidAmount),
  };

  const updatedLoans = loans.map((item) =>
    String(item?._id) === String(activeLoan._id) ? updatedActiveLoan : item
  );
  const overdueResponse = await _checkOverdues(updatedActiveLoan);
  const userOverdue = user?.loan?.acumulatedOverDue === undefined ? 0 : user.loan.acumulatedOverDue;
  const level =
    computedAmount > 0 || String(user.level || "") === "20"
      ? user.level
      : await _checkLevel(updatedLoans);
  const loanData = {
    isApplied: computedAmount > 0,
    loanStatus: "Granted",
    paymentStatus: computedAmount > 0 ? "Not paid" : "Paid",
    acumulatedOverDue: userOverdue + overdueResponse,
    loans: updatedLoans,
  };
  const updatedUser = await Users.updateOne(
    { _id: user._id },
    {
      $set: {
        loan: loanData,
        level,
      },
    }
  );

  if (updatedUser.modifiedCount < 1) {
    return {
      success: false,
      message: "Payment request failed while updating the customer loan record.",
    };
  }

  const posted = await _payLoan({ id: activeLoan._id, payAmount });

  return posted
    ? {
        success: true,
        message: "Payment made successfully.",
      }
    : {
        success: false,
        message: "Customer repayment was updated, but the loan ledger could not be posted.",
      };
};

const requestLegacyGatewayPayment = async ({ paymentMethod, payAmount }) => {
  const response = await fetch(config.paymentBaseUrl, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      auth: {
        merchant_id: config.merchantId,
        api_id: config.myApiID,
        api_key: config.myApiKey,
        service_id: "1002",
        channel: "momo",
      },
      data: {
        method: "runBillPayment",
        request_id: "perficent005",
        sender_id: paymentMethod,
        reference_no: await _generateString(12),
        amount: payAmount,
      },
    }),
  });

  return response.json();
};

const pollLegacyGatewayStatus = async (senderId = "") => {
  const pollWindows = [25000, 50000];

  for (const delay of pollWindows) {
    await sleep(delay);
    const response = await fetch(LEGACY_GATEWAY_STATUS_URL);
    const payload = await response.json();

    if (String(payload?.response_code || "") === "100" && payload?.sender_id === senderId) {
      return {
        success: true,
        payload,
      };
    }

    if (String(payload?.response_code || "") !== "990") {
      return {
        success: false,
        payload,
      };
    }
  }

  return {
    success: false,
    payload: null,
  };
};

router.patch("/repayLoan/:id", async (request, responses) => {
  try {
    const id = request.params.id;
    const user = await Users.findOne({ _id: id });
    const systemConfig = await getSystemConfig();

    if (!user) {
      return responses.status(404).json({
        success: 0,
        message: "Customer not found.",
      });
    }

    const { payAmount, paymentMethod, accountName, ntwrkOperator } = request.body;
    const activeGateway = String(systemConfig.collectionGateway || systemConfig.gatewayProvider || "zynlepay")
      .trim()
      .toLowerCase();

    if (activeGateway === "bridge") {
      const bridgeCredentials = getBridgeCredentials(systemConfig);
      const networkCode = mapOperatorToBridgeNetworkCode(ntwrkOperator);
      const activeCountry = getActiveCountryConfig(systemConfig);

      if (
        !bridgeCredentials.username ||
        !bridgeCredentials.password ||
        !bridgeCredentials.serviceId
      ) {
        return responses.status(400).json({
          success: 0,
          message:
            "Bridge credentials are incomplete. Set BRIDGE_API_USERNAME, BRIDGE_API_PASSWORD, and BRIDGE_SERVICE_ID.",
        });
      }

      if (!networkCode) {
        return responses.status(400).json({
          success: 0,
          message: "The selected mobile money operator is not supported by Bridge.",
        });
      }

      const reference = `legacy-repayment-${String(user.userId || user._id || Date.now())}-${Date.now()}`.slice(
        0,
        80
      );
      const callbackUrl = resolveBridgeCallbackUrl(
        request,
        config.bridgeCallbackUrl || systemConfig.callbackUrl,
        "/loans/bridge/legacy-repayment-webhook"
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
          reference: `Legacy loan repayment ${String(user.userId || "").trim()}`.trim(),
          customer_number: paymentMethod,
          transaction_id: reference,
          trans_type: "CTM",
          amount: toMoney(payAmount),
          nw: networkCode,
          nickname: String(accountName || user.userId || "Customer").trim(),
          payment_option: "MOM",
          currency_code: activeCountry?.currencyCode || config.bridgeCurrencyCode,
          currency_val: config.bridgeCurrencyValue,
          callback_url: callbackUrl,
          request_time: formatBridgeRequestTime(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      const accepted = isBridgeAcceptedInitialization(response, payload);

      if (!response.ok && !accepted) {
        return responses.status(400).json({
          success: 0,
          message:
            payload?.message ||
            payload?.description ||
            "Bridge could not initialize the repayment request.",
          data: payload,
        });
      }

      await GatewayTransactions.findOneAndUpdate(
        { reference },
        {
          $set: {
            reference,
            amount: toMoney(payAmount),
            provider: "bridge",
            transactionType: "repayment",
            status: accepted ? "pending" : "initialized",
            userId: user.userId,
            phone: user.phone,
            loanId: getLegacyActiveLoan(user)?.ID || "",
            metadata: {
              route: "legacy-repayLoan",
              userMongoId: String(user._id),
              operator: ntwrkOperator || "",
              paymentMethod: paymentMethod || "",
            },
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      return responses.status(200).json({
        success: 2,
        message:
          payload?.message ||
          payload?.description ||
          "Approve the Bridge mobile money prompt on the customer's phone.",
        data: {
          provider: "bridge",
          reference,
          status: accepted ? "pending" : "initialized",
        },
      });
    }

    const initialization = await requestLegacyGatewayPayment({ paymentMethod, payAmount });
    const senderId = initialization?.response?.sender_id;

    if (!senderId) {
      return responses.status(400).json({
        success: 0,
        message: "Transaction failed, please try again.",
      });
    }

    const result = await pollLegacyGatewayStatus(senderId);

    if (!result.success) {
      return responses.status(400).json({
        success: 0,
        message: "Transaction failed, please try again.",
      });
    }

    const settled = await settleLegacyRepayment({ user, payAmount });

    return responses.status(settled.success ? 200 : 400).json({
      success: settled.success ? 1 : 0,
      message: settled.message,
    });
  } catch (error) {
    console.log(error);
    return responses.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/bridge/legacy-repayment-webhook", async (request, responses) => {
  try {
    const referenceCandidates = getBridgeCallbackReferenceCandidates(request.body);
    const callbackStatus = getBridgeCallbackStatus(request.body);
    const callbackMessage = getBridgeCallbackMessage(request.body) || "Bridge callback received.";

    if (referenceCandidates.length === 0) {
      return responses.sendStatus(200);
    }

    const transaction = await GatewayTransactions.findOne({
      reference: { $in: referenceCandidates },
      provider: "bridge",
    });

    if (!transaction || transaction.transactionType !== "repayment") {
      await logSystemEvent({
        level: "warn",
        category: "payment",
        source: "loan.legacyRepaymentWebhook",
        action: "webhook-unmatched",
        status: "ignored",
        message: "Bridge legacy repayment webhook did not match any saved repayment transaction.",
        metadata: {
          bridgeStatus: callbackStatus,
          callbackReference: getBridgeCallbackReference(request.body),
          referenceCandidates,
        },
        details: request.body,
      });
      return responses.sendStatus(200);
    }

    if (transaction.status === "success") {
      return responses.sendStatus(200);
    }

    if (callbackStatus === "000") {
      const user =
        (transaction.userId && (await Users.findOne({ userId: transaction.userId }))) ||
        (transaction.metadata?.userMongoId &&
          (await Users.findOne({ _id: transaction.metadata.userMongoId })));

      if (!user) {
        await GatewayTransactions.findOneAndUpdate(
          { _id: transaction._id },
          {
            $set: {
              status: "failed",
              gatewayResponse: request.body,
              gatewayMessage: "Bridge callback succeeded, but the customer record was not found.",
            },
          }
        );
        return responses.sendStatus(200);
      }

      const settled = await settleLegacyRepayment({
        user,
        payAmount: Number(transaction.amount || 0),
      });

      await GatewayTransactions.findOneAndUpdate(
        { _id: transaction._id },
        {
          $set: {
            status: settled.success ? "success" : "failed",
            gatewayResponse: request.body,
            gatewayMessage: settled.message || callbackMessage,
          },
        }
      );

      return responses.sendStatus(200);
    }

    if (callbackStatus === "001" || callbackStatus === "003") {
      await GatewayTransactions.findOneAndUpdate(
        { _id: transaction._id },
        {
          $set: {
            status: "failed",
            gatewayResponse: request.body,
            gatewayMessage: callbackMessage,
          },
        }
      );
    }

    return responses.sendStatus(200);
  } catch (error) {
    console.log(error);
    return responses.sendStatus(200);
  }
});

module.exports = router;
