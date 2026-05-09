const express = require("express");
const User = require("../../models/users");

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

module.exports = router;
