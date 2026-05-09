const express = require("express");
const { upload } = require("../../../libs/uploadImage");
const User = require("../../models/users");

const router = express.Router();

router.patch("/changeStatus/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById({ _id: id });

    if (!user)
      return res.status(404).json({
        success: 0,
        message: "user not found, please log out and register again",
      });

    const loanData = {
      isApplied: false,
      loanStatus: "Not applied",
      paymentStatus: "Not paid",
      acumulatedOverDue: user.loan.acumulatedOverDue,
      loans: user.loan.loans,
    };

    const updated = await User.updateOne(
      { _id: id },
      {
        $set: {
          loan: loanData,
        },
      }
    );

    if (updated.modifiedCount >= 1)
      return res.status(200).json({
        success: 1,
        message: "you can now apply for new loan",
      });

    if (updatedUser.modifiedCount < 1)
      return res.status(400).json({
        success: 0,
        message: "could not process request, please try again",
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
