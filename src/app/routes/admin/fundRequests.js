const express = require("express");
const Admins = require("../../models/admin");
const FundRequest = require("../../models/fundRequest");
const { getSystemConfig } = require("../../services/systemConfig");
const { processInternalTransfer } = require("../../services/payout");
const _generateString = require("../../../libs/generateID");
const { logSystemEvent } = require("../../../libs/logger");

const router = express.Router();

const buildActor = (payload = {}) => ({
  userId: String(payload.userId || "").trim(),
  userName: String(payload.userName || "").trim(),
  fullName: String(payload.fullName || "").trim(),
});

const getActorFromRequest = async (req = {}) => {
  const requestedUserId =
    String(req.body?.actorUserId || req.query?.actorUserId || req.headers?.["x-actor-user-id"] || "")
      .trim();

  if (!requestedUserId) {
    return buildActor({
      userName: String(req.body?.actorUserName || "").trim(),
    });
  }

  const admin = await Admins.findOne({ userId: requestedUserId }).lean();
  if (!admin) {
    return buildActor({
      userId: requestedUserId,
      userName: String(req.body?.actorUserName || "").trim(),
    });
  }

  return buildActor({
    userId: admin.userId,
    userName: admin.userName,
    fullName: `${admin.firstName || ""} ${admin.lastName || ""}`.trim(),
  });
};

const buildHistoryEntry = ({ status, message, actor }) => ({
  status,
  message,
  actedAt: new Date(),
  actor: buildActor(actor),
});

const findEmployeeRecord = async ({
  employeeUserId = "",
  employeeUserName = "",
} = {}) => {
  const normalizedUserId = String(employeeUserId || "").trim();
  const normalizedUserName = String(employeeUserName || "").trim();

  if (normalizedUserId) {
    const byUserId = await Admins.findOne({ userId: normalizedUserId }).lean();
    if (byUserId) return byUserId;
  }

  if (normalizedUserName) {
    const byUserName = await Admins.findOne({ userName: normalizedUserName }).lean();
    if (byUserName) return byUserName;
  }

  return null;
};

const syncRequestDestinationFromEmployee = async (record = {}) => {
  const employeeUserId = String(record.employeeUserId || "").trim();
  if (!employeeUserId) {
    return null;
  }

  const employee = await Admins.findOne({ userId: employeeUserId }).lean();
  if (!employee) {
    return null;
  }

  record.employeeUserName = String(employee.userName || record.employeeUserName || "").trim();
  record.employeeName =
    `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || record.employeeName || "";
  record.department = String(employee.department || record.department || "").trim();
  record.staffGroupId = String(employee.staffGroupId || record.staffGroupId || "").trim();
  record.staffGroupName = String(employee.staffGroupName || record.staffGroupName || "").trim();
  record.phoneNumber = String(employee.phone || record.phoneNumber || "").trim();
  record.salaryNumber = String(employee.salaryNumber || record.salaryNumber || "").trim();
  record.salaryOperator = String(employee.salaryOperator || record.salaryOperator || "").trim();

  if (record.requestType === "payment") {
    record.destinationNumber = String(
      record.destinationNumber || employee.salaryNumber || ""
    ).trim();
    record.destinationOperator = String(
      record.destinationOperator || employee.salaryOperator || ""
    ).trim();
  } else {
    record.destinationNumber = String(record.destinationNumber || employee.phone || "").trim();
  }

  return employee;
};

const normalizeBridgeReference = (value = "") =>
  String(value || "")
    .replace(/\s*-\s*/g, "-")
    .trim();

const getFundBridgeCallbackReferenceCandidates = (payload = {}) => {
  const rawCandidates = [
    payload?.trans_ref,
    payload?.transaction_id,
    payload?.reference,
    payload?.trans_id,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return rawCandidates.reduce((result, candidate) => {
    const normalizedCandidate = normalizeBridgeReference(candidate);
    [candidate, normalizedCandidate].forEach((value) => {
      if (value && !result.includes(value)) {
        result.push(value);
      }
    });
    return result;
  }, []);
};

const getFundBridgeCallbackStatus = (payload = {}) =>
  String(payload?.trans_status || payload?.status || payload?.status_code || "").trim();

const getFundBridgeCallbackMessage = (payload = {}) =>
  String(payload?.message || payload?.status_desc || payload?.response_message || "").trim();

const applyGatewayOutcomeToFundRequest = ({
  record,
  payoutResult = {},
  actor = {},
  actionLabel = "send",
}) => {
  record.gatewayProvider = payoutResult.provider || record.gatewayProvider || "";
  record.gatewayReference = payoutResult.reference || record.gatewayReference || record.requestCode;
  record.gatewayStatus = payoutResult.pending ? "pending" : payoutResult.success ? "success" : "failed";
  record.gatewayMessage = String(payoutResult.message || "").trim();

  if (payoutResult.success) {
    record.status = "completed";
    record.history.push(
      buildHistoryEntry({
        status: "completed",
        message:
          actionLabel === "resend"
            ? "Payment resent successfully."
            : "Payment sent successfully after second approval.",
        actor,
      })
    );
    return;
  }

  if (payoutResult.pending) {
    record.status = "pending_gateway_confirmation";
    record.history.push(
      buildHistoryEntry({
        status: "pending_gateway_confirmation",
        message:
          record.gatewayMessage ||
          (actionLabel === "resend"
            ? "Payment resend is waiting for gateway confirmation."
            : "Payment is waiting for gateway confirmation."),
        actor,
      })
    );
    return;
  }

  record.status = "failed";
  record.history.push(
    buildHistoryEntry({
      status: "failed",
      message:
        record.gatewayMessage ||
        (actionLabel === "resend"
          ? "Payment resend failed."
          : "Payment failed after second approval."),
      actor,
    })
  );
};

const nextStatusAfterFirstApproval = (request = {}) =>
  request.requestType === "payment" ? "pending_second_approval" : "completed";

const buildSingleRequestPayload = ({ body = {}, employee = {}, actor = {} }) => {
  const requestType = String(body.requestType || "payment").trim().toLowerCase();
  const requestMode = String(body.requestMode || "single").trim().toLowerCase();
  const amount = Number(body.amount || 0);

  return {
    requestType,
    requestMode,
    employeeUserId: String(employee.userId || "").trim(),
    employeeUserName: String(employee.userName || "").trim(),
    employeeName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
    department: String(employee.department || "").trim(),
    staffGroupId: String(employee.staffGroupId || "").trim(),
    staffGroupName: String(employee.staffGroupName || "").trim(),
    phoneNumber: String(employee.phone || "").trim(),
    salaryNumber: String(employee.salaryNumber || "").trim(),
    salaryOperator: String(employee.salaryOperator || "").trim(),
    destinationNumber:
      requestType === "payment"
        ? String(body.destinationNumber || employee.salaryNumber || "").trim()
        : String(body.destinationNumber || employee.phone || "").trim(),
    destinationOperator:
      requestType === "payment"
        ? String(body.destinationOperator || employee.salaryOperator || "").trim()
        : "",
    amount,
    reason: String(body.reason || "").trim(),
    remark: String(body.remark || "").trim(),
    initiatedBy: buildActor(actor),
    firstApproval: {
      status: "pending",
      remark: "",
      actedAt: null,
      actor: {},
    },
    secondApproval: {
      status: requestType === "payment" ? "pending" : "not-required",
      remark: "",
      actedAt: null,
      actor: {},
    },
  };
};

const serializeRequest = (record = {}) => ({
  ...record,
  id: String(record._id || ""),
});

router.get("/fund-requests", async (req, res) => {
  try {
    const {
      requestType = "",
      requestMode = "",
      status = "",
      batchReference = "",
    } = req.query;
    const query = {};

    if (requestType) query.requestType = String(requestType).trim().toLowerCase();
    if (requestMode) query.requestMode = String(requestMode).trim().toLowerCase();
    if (status) query.status = String(status).trim().toLowerCase();
    if (batchReference) query.batchReference = String(batchReference).trim();

    const records = await FundRequest.find(query).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: 1,
      data: records.map(serializeRequest),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/fund-requests", async (req, res) => {
  try {
    const { employeeUserId = "", employeeUserName = "" } = req.body;
    const actor = await getActorFromRequest(req);
    const employee = await findEmployeeRecord({
      employeeUserId,
      employeeUserName,
    });

    if (!employee) {
      return res.status(404).json({
        success: 0,
        message: "Selected employee could not be found.",
      });
    }

    const payload = buildSingleRequestPayload({ body: req.body, employee, actor });

    if (!payload.amount || payload.amount <= 0 || !payload.reason || !payload.destinationNumber) {
      return res.status(400).json({
        success: 0,
        message: "Employee, amount, reason, and destination number are required.",
      });
    }

    if (payload.requestType === "payment" && !payload.destinationOperator) {
      return res.status(400).json({
        success: 0,
        message: "Salary operator is required before a payment request can be created.",
      });
    }

    const requestCode = `${payload.requestType === "payment" ? "PAY" : "AIR"}-${await _generateString(
      8
    )}`;
    const record = await FundRequest.create({
      ...payload,
      requestCode,
      status: "pending_first_approval",
      history: [
        buildHistoryEntry({
          status: "pending_first_approval",
          message: "Request submitted for first approval.",
          actor,
        }),
      ],
    });

    await logSystemEvent({
      level: "info",
      category: "fund-management",
      source: "admin.fundRequests.create",
      action: "create",
      status: "success",
      req,
      actor,
      message: `${payload.requestType} request ${requestCode} created successfully.`,
      metadata: {
        requestCode,
        requestType: payload.requestType,
        requestMode: payload.requestMode,
        employeeUserName: payload.employeeUserName,
        amount: payload.amount,
      },
    });

    return res.status(201).json({
      success: 1,
      message: "Request created successfully.",
      data: serializeRequest(record.toObject()),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/fund-requests/batch", async (req, res) => {
  try {
    const actor = await getActorFromRequest(req);
    const requestType = String(req.body.requestType || "payment").trim().toLowerCase();
    const requestMode = String(req.body.requestMode || "batch").trim().toLowerCase();
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const batchReference = `BATCH-${await _generateString(8)}`;

    if (items.length === 0) {
      return res.status(400).json({
        success: 0,
        message: "At least one batch row is required.",
      });
    }

    const normalizedUserNames = items
      .map((item) => String(item.userName || "").trim())
      .filter(Boolean);
    const employees = await Admins.find({
      userName: { $in: normalizedUserNames },
    }).lean();
    const employeeLookup = new Map(
      employees.map((employee) => [String(employee.userName || "").trim(), employee])
    );

    const createPayloads = [];
    for (const item of items) {
      const employee = employeeLookup.get(String(item.userName || "").trim());
      if (!employee) {
        return res.status(400).json({
          success: 0,
          message: `Employee ${item.userName || ""} could not be found.`,
        });
      }

      const payload = buildSingleRequestPayload({
        body: {
          requestType,
          requestMode,
          amount: item.amount,
          reason: item.reason,
          remark: req.body.remark,
          destinationNumber:
            requestType === "payment" ? item.destinationNumber || employee.salaryNumber : item.destinationNumber || employee.phone,
          destinationOperator:
            requestType === "payment" ? item.destinationOperator || employee.salaryOperator : "",
        },
        employee,
        actor,
      });

      if (!payload.amount || payload.amount <= 0 || !payload.reason || !payload.destinationNumber) {
        return res.status(400).json({
          success: 0,
          message: `Batch row for ${item.userName || ""} is missing required values.`,
        });
      }

      if (requestType === "payment" && !payload.destinationOperator) {
        return res.status(400).json({
          success: 0,
          message: `Salary operator is required for ${item.userName || ""}.`,
        });
      }

      createPayloads.push({
        ...payload,
        requestCode: `${requestType === "payment" ? "PAY" : "AIR"}-${await _generateString(8)}`,
        batchReference,
        status: "pending_first_approval",
        history: [
          buildHistoryEntry({
            status: "pending_first_approval",
            message: "Batch request submitted for first approval.",
            actor,
          }),
        ],
      });
    }

    const saved = await FundRequest.insertMany(createPayloads);

    return res.status(201).json({
      success: 1,
      message: "Batch requests imported successfully.",
      data: saved.map((item) => serializeRequest(item.toObject())),
      batchReference,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.patch("/fund-requests/decision", async (req, res) => {
  try {
    const actor = await getActorFromRequest(req);
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const decision = String(req.body.decision || "").trim().toLowerCase();
    const remark = String(req.body.remark || "").trim();

    if (ids.length === 0 || !["approve", "reject"].includes(decision)) {
      return res.status(400).json({
        success: 0,
        message: "Provide request ids and a valid decision.",
      });
    }

    const requests = await FundRequest.find({ _id: { $in: ids } });
    const systemConfig = await getSystemConfig();
    const updated = [];

    for (const record of requests) {
      if (record.status === "pending_first_approval") {
        if (decision === "reject") {
          record.status = "rejected";
          record.firstApproval = {
            status: "rejected",
            remark,
            actedAt: new Date(),
            actor: buildActor(actor),
          };
          record.history.push(
            buildHistoryEntry({
              status: "rejected",
              message: "Request rejected during first approval.",
              actor,
            })
          );
        } else {
          record.firstApproval = {
            status: "approved",
            remark,
            actedAt: new Date(),
            actor: buildActor(actor),
          };

          if (record.requestType === "payment") {
            record.status = "pending_second_approval";
            record.history.push(
              buildHistoryEntry({
                status: "pending_second_approval",
                message: "Request moved to second approval.",
                actor,
              })
            );
          } else {
            record.status = "completed";
            record.gatewayStatus = "manual-complete";
            record.gatewayMessage = "Airtime workflow completed manually after approval.";
            record.history.push(
              buildHistoryEntry({
                status: "completed",
                message: "Airtime request completed after approval.",
                actor,
              })
            );
          }
        }
      } else if (record.status === "pending_second_approval") {
        if (decision === "reject") {
          record.status = "rejected";
          record.secondApproval = {
            status: "rejected",
            remark,
            actedAt: new Date(),
            actor: buildActor(actor),
          };
          record.history.push(
            buildHistoryEntry({
              status: "rejected",
              message: "Request rejected during second approval.",
              actor,
            })
          );
        } else {
          await syncRequestDestinationFromEmployee(record);
          record.secondApproval = {
            status: "approved",
            remark,
            actedAt: new Date(),
            actor: buildActor(actor),
          };

          if (!String(record.destinationNumber || "").trim()) {
            record.gatewayStatus = "validation-error";
            record.gatewayMessage = "Destination number is required before payment can be sent.";
            record.status = "failed";
            record.history.push(
              buildHistoryEntry({
                status: "failed",
                message: "Payment failed because the destination number is missing.",
                actor,
              })
            );
            await record.save();
            updated.push(serializeRequest(record.toObject()));
            continue;
          }

          if (!String(record.destinationOperator || "").trim()) {
            record.gatewayStatus = "validation-error";
            record.gatewayMessage = "Destination operator is required before payment can be sent.";
            record.status = "failed";
            record.history.push(
              buildHistoryEntry({
                status: "failed",
                message: "Payment failed because the destination operator is missing.",
                actor,
              })
            );
            await record.save();
            updated.push(serializeRequest(record.toObject()));
            continue;
          }

          const payoutResult = await processInternalTransfer({
            amount: record.amount,
            recipientNumber: record.destinationNumber,
            recipientName: record.employeeName || record.employeeUserName,
            operator: record.destinationOperator,
            reference: record.requestCode,
            reason: record.reason,
            systemConfig,
          });

          applyGatewayOutcomeToFundRequest({
            record,
            payoutResult,
            actor,
            actionLabel: "approval",
          });
        }
      }

      await record.save();
      updated.push(serializeRequest(record.toObject()));
    }

    return res.status(200).json({
      success: 1,
      message: "Requests updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/fund-requests/:id/resend", async (req, res) => {
  try {
    const actor = await getActorFromRequest(req);
    const record = await FundRequest.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: 0,
        message: "Request not found.",
      });
    }

    if (record.requestType === "payment") {
      if (record.status !== "failed") {
        return res.status(400).json({
          success: 0,
          message: "Only failed payments can be resent from this queue.",
          data: serializeRequest(record.toObject()),
        });
      }

      await syncRequestDestinationFromEmployee(record);
      const systemConfig = await getSystemConfig();

      if (!String(record.destinationNumber || "").trim()) {
        record.gatewayStatus = "validation-error";
        record.gatewayMessage =
          "Salary number is still missing on this employee profile. Update it before resend.";
        await record.save();
        return res.status(400).json({
          success: 0,
          message: record.gatewayMessage,
          data: serializeRequest(record.toObject()),
        });
      }

      if (!String(record.destinationOperator || "").trim()) {
        record.gatewayStatus = "validation-error";
        record.gatewayMessage =
          "Salary operator is still missing on this employee profile. Update it before resend.";
        await record.save();
        return res.status(400).json({
          success: 0,
          message: record.gatewayMessage,
          data: serializeRequest(record.toObject()),
        });
      }

      const payoutResult = await processInternalTransfer({
        amount: record.amount,
        recipientNumber: record.destinationNumber,
        recipientName: record.employeeName || record.employeeUserName,
        operator: record.destinationOperator,
        reference: record.requestCode,
        reason: record.reason,
        systemConfig,
      });

      applyGatewayOutcomeToFundRequest({
        record,
        payoutResult,
        actor,
        actionLabel: "resend",
      });
    } else {
      record.status = "pending_first_approval";
      record.history.push(
        buildHistoryEntry({
          status: "pending_first_approval",
          message: "Failed airtime request returned for review.",
          actor,
        })
      );
    }

    if (record.requestType !== "payment") {
      record.gatewayStatus = "";
      record.gatewayMessage = "";
    }
    await record.save();

    return res.status(200).json({
      success: 1,
      message:
        record.requestType === "payment"
          ? record.status === "completed"
            ? "Payment resent successfully."
            : record.status === "pending_gateway_confirmation"
            ? "Payment resend submitted and is awaiting gateway confirmation."
            : "Payment resend attempted."
          : "Request returned for resend successfully.",
      data: serializeRequest(record.toObject()),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/fund-requests/:id/cancel", async (req, res) => {
  try {
    const actor = await getActorFromRequest(req);
    const record = await FundRequest.findById(req.params.id);
    const remark = String(req.body?.remark || "").trim();

    if (!record) {
      return res.status(404).json({
        success: 0,
        message: "Request not found.",
      });
    }

    if (record.requestType !== "payment" || record.status !== "failed") {
      return res.status(400).json({
        success: 0,
        message: "Only failed payment requests can be cancelled here.",
        data: serializeRequest(record.toObject()),
      });
    }

    record.status = "rejected";
    record.gatewayMessage = remark || record.gatewayMessage || "Failed payment was cancelled.";
    record.history.push(
      buildHistoryEntry({
        status: "rejected",
        message: remark || "Failed payment was cancelled and closed as rejected.",
        actor,
      })
    );
    await record.save();

    return res.status(200).json({
      success: 1,
      message: "Failed payment cancelled successfully.",
      data: serializeRequest(record.toObject()),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.post("/fund-requests/bridge-webhook", async (req, res) => {
  try {
    const referenceCandidates = getFundBridgeCallbackReferenceCandidates(req.body);
    const reference = referenceCandidates[0] || "";
    const bridgeStatus = getFundBridgeCallbackStatus(req.body);
    const callbackMessage = getFundBridgeCallbackMessage(req.body) || "Bridge callback received.";

    if (referenceCandidates.length === 0) {
      await logSystemEvent({
        level: "warn",
        category: "fund-management",
        source: "admin.fundRequests.bridgeWebhook",
        action: "webhook-unmatched",
        status: "ignored",
        message: "Fund Bridge webhook arrived without a usable reference.",
        metadata: {
          bridgeStatus,
        },
        details: req.body,
      });
      return res.sendStatus(200);
    }

    const record = await FundRequest.findOne({
      $or: [
        { gatewayReference: { $in: referenceCandidates } },
        { requestCode: { $in: referenceCandidates } },
      ],
    });

    if (!record) {
      await logSystemEvent({
        level: "warn",
        category: "fund-management",
        source: "admin.fundRequests.bridgeWebhook",
        action: "webhook-unmatched",
        status: "ignored",
        message: "Fund Bridge webhook did not match any saved request.",
        metadata: {
          bridgeStatus,
          callbackReference: reference,
          referenceCandidates,
        },
        details: req.body,
      });
      return res.sendStatus(200);
    }

    record.gatewayReference = reference || record.gatewayReference;
    record.gatewayStatus =
      bridgeStatus === "000" ? "success" : bridgeStatus === "001" || bridgeStatus === "003" ? "failed" : "pending";
    record.gatewayMessage = callbackMessage;

    if (bridgeStatus === "000") {
      record.status = "completed";
      record.history.push(
        buildHistoryEntry({
          status: "completed",
          message: callbackMessage || "Bridge webhook confirmed successful payment.",
          actor: {},
        })
      );
    } else if (bridgeStatus === "001" || bridgeStatus === "003") {
      record.status = "failed";
      record.history.push(
        buildHistoryEntry({
          status: "failed",
          message: record.gatewayMessage || "Bridge webhook reported a failed payment.",
          actor: {},
        })
      );
    } else {
      record.status = "pending_gateway_confirmation";
      record.history.push(
        buildHistoryEntry({
          status: "pending_gateway_confirmation",
          message: callbackMessage || "Bridge webhook says payment is still pending.",
          actor: {},
        })
      );
    }

    await record.save();
    await logSystemEvent({
      level: bridgeStatus === "000" ? "info" : bridgeStatus === "001" || bridgeStatus === "003" ? "error" : "warn",
      category: "fund-management",
      source: "admin.fundRequests.bridgeWebhook",
      action: "webhook",
      status: record.status,
      message: callbackMessage,
      metadata: {
        requestCode: record.requestCode,
        gatewayReference: record.gatewayReference,
        bridgeStatus,
      },
      details: req.body,
    });
    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    await logSystemEvent({
      level: "error",
      category: "fund-management",
      source: "admin.fundRequests.bridgeWebhook",
      action: "webhook",
      status: "failed",
      req,
      message: error.message || "Fund Bridge webhook processing failed.",
      details: {
        stack: error.stack || "",
        body: req.body,
      },
    });
    return res.sendStatus(200);
  }
});

module.exports = router;
