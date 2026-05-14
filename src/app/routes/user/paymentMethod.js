const express = require("express");
const User = require("../../models/users");
const Loans = require("../../models/loans");

const router = express.Router();

router.patch("/addPayment/:id", async (req, res) => {
  try {
    let id = req.params.id;
    let user = await User.findById({ _id: id });

    let { paymentMethod, paymentEmail, networkOperator } = req.body;
    const operatorLabel = String(networkOperator || "").trim() || "Mobile Money";

    let newMethod = {
      method: paymentMethod,
      email: paymentEmail,
      operator: operatorLabel,
      isVerified: true,
    };

    if (!user)
      return res.status(404).json({
        success: 0,
        message: "User does not exist",
      });

    let checkMethod = user.paymentMethods.filter(
      (item) => item.method === paymentMethod
    );

    if (checkMethod.length > 0)
      return res.status(400).json({
        success: 0,
        message: "payment method already exist, please add a different one",
      });

    let newPaymentMethod = [...user.paymentMethods, newMethod];

    let updated = await User.updateOne(
      { _id: id },
      {
        $set: {
          paymentMethods: newPaymentMethod,
        },
      }
    );

    if (updated.modifiedCount >= 1)
      return res.status(200).json({
        success: 1,
        message: "method added successfully",
      });

    if (updated.modifiedCount < 1)
      return res.status(400).json({
        success: 0,
        message: "could not add method, please try again",
      });
  } catch (error) {
    console.log(error);
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

    if (!userId || !method || !operator) {
      return res.status(400).json({
        success: 0,
        message: "Customer, account number, and mobile money operator are required.",
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: 0,
        message: "Customer does not exist",
      });
    }

    const paymentMethods = Array.isArray(user.paymentMethods) ? [...user.paymentMethods] : [];
    const methodIndex = paymentMethods.findIndex((item) => String(item?.method || "").trim() === method);

    if (methodIndex < 0) {
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
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
