const express = require("express");
const User = require("../../models/users");
const Loans = require("../../models/loans");
const {
  getAuditActorFromRequest,
  summarizeCustomer,
  logAuditEvent,
} = require("../../../libs/audit");

const router = express.Router();

router.patch("/addPayment/:id", async (req, res) => {
  try {
    let id = req.params.id;
    let user = await User.findById({ _id: id });
    const actor = getAuditActorFromRequest(req);

    let { paymentMethod, paymentEmail, networkOperator } = req.body;
    const operatorLabel = String(networkOperator || "").trim() || "Mobile Money";

    let newMethod = {
      method: paymentMethod,
      email: paymentEmail,
      operator: operatorLabel,
      isVerified: true,
    };

    if (!user) {
      await logAuditEvent({
        req,
        actor,
        source: "user.paymentMethod",
        action: "add-payment-method",
        status: "failed",
        message: "Customer payment method could not be added because the customer was not found.",
        metadata: {
          targetId: String(id || "").trim(),
        },
      });
      return res.status(404).json({
        success: 0,
        message: "User does not exist",
      });
    }

    let checkMethod = user.paymentMethods.filter(
      (item) => item.method === paymentMethod
    );

    if (checkMethod.length > 0) {
      await logAuditEvent({
        req,
        actor,
        source: "user.paymentMethod",
        action: "add-payment-method",
        status: "failed",
        message: "Customer payment method was not added because it already exists.",
        metadata: {
          target: summarizeCustomer(user),
          method: String(paymentMethod || "").trim(),
        },
      });
      return res.status(400).json({
        success: 0,
        message: "payment method already exist, please add a different one",
      });
    }

    let newPaymentMethod = [...user.paymentMethods, newMethod];

    let updated = await User.updateOne(
      { _id: id },
      {
        $set: {
          paymentMethods: newPaymentMethod,
        },
      }
    );

    if (updated.modifiedCount >= 1) {
      await logAuditEvent({
        req,
        actor,
        source: "user.paymentMethod",
        action: "add-payment-method",
        status: "success",
        message: "Customer payment method added successfully.",
        metadata: {
          target: summarizeCustomer(user),
          paymentMethod: {
            method: String(paymentMethod || "").trim(),
            operator: operatorLabel,
          },
        },
      });
      return res.status(200).json({
        success: 1,
        message: "method added successfully",
      });
    }

    if (updated.modifiedCount < 1)
      return res.status(400).json({
        success: 0,
        message: "could not add method, please try again",
      });
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "user.paymentMethod",
      action: "add-payment-method",
      status: "failed",
      message: error.message || "Customer payment method update failed.",
      details: {
        stack: error.stack || "",
      },
      metadata: {
        targetId: String(req.params?.id || "").trim(),
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.patch("/payment-operator/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();
    const method = String(req.body?.method || "").trim();
    const operator = String(req.body?.operator || "").trim();
    const actor = getAuditActorFromRequest(req);

    if (!userId || !method || !operator) {
      return res.status(400).json({
        success: 0,
        message: "Customer, account number, and mobile money operator are required.",
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      await logAuditEvent({
        req,
        actor,
        source: "user.paymentOperator",
        action: "update-payment-operator",
        status: "failed",
        message: "Customer payment operator update failed because the customer was not found.",
        metadata: {
          targetUserId: userId,
          method,
        },
      });
      return res.status(404).json({
        success: 0,
        message: "Customer does not exist",
      });
    }

    const paymentMethods = Array.isArray(user.paymentMethods) ? [...user.paymentMethods] : [];
    const methodIndex = paymentMethods.findIndex((item) => String(item?.method || "").trim() === method);

    if (methodIndex < 0) {
      await logAuditEvent({
        req,
        actor,
        source: "user.paymentOperator",
        action: "update-payment-operator",
        status: "failed",
        message: "Customer payment operator update failed because the payment method was not found.",
        metadata: {
          target: summarizeCustomer(user),
          method,
        },
      });
      return res.status(404).json({
        success: 0,
        message: "Payment method was not found on this customer profile.",
      });
    }

    paymentMethods[methodIndex] = {
      ...paymentMethods[methodIndex],
      operator,
    };

    const embeddedLoans = Array.isArray(user.loan?.loans) ? user.loan.loans : [];
    const syncedLoans = embeddedLoans.map((loan) =>
      String(loan?.paymentMethod || "").trim() === method &&
      String(loan?.paymentStatus || "").trim().toLowerCase() !== "paid"
        ? {
            ...loan,
            paymentOperator: operator,
          }
        : loan
    );

    user.paymentMethods = paymentMethods;
    user.loan = {
      ...user.loan,
      loans: syncedLoans,
    };

    await user.save();

    await Loans.updateMany(
      {
        userId,
        paymentMethod: method,
        paymentStatus: { $ne: "Paid" },
      },
      {
        $set: {
          paymentOperator: operator,
        },
      }
    );

    await logAuditEvent({
      req,
      actor,
      source: "user.paymentOperator",
      action: "update-payment-operator",
      status: "success",
      message: "Customer payment operator updated successfully.",
      details: {
        changedFields: ["paymentMethods.operator", "loan.paymentOperator"],
      },
      metadata: {
        target: summarizeCustomer(user),
        method,
        operator,
      },
    });

    return res.status(200).json({
      success: 1,
      message: "Mobile money operator updated successfully.",
      data: {
        userId,
        method,
        operator,
      },
    });
  } catch (error) {
    console.log(error);
    await logAuditEvent({
      req,
      actor: getAuditActorFromRequest(req),
      level: "error",
      source: "user.paymentOperator",
      action: "update-payment-operator",
      status: "failed",
      message: error.message || "Customer payment operator update failed.",
      details: {
        stack: error.stack || "",
      },
      metadata: {
        targetUserId: String(req.params?.userId || "").trim(),
      },
    });
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
