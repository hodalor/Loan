const express = require("express");
const { _getDatefromDays } = require("../../../libs/calcDate");
const { upload } = require("../../../libs/uploadImage");
const _generateString = require("../../../libs/generateID");
const User = require("../../models/users");
const _saveLoan = require("../../handlers/loanHandlers/saveLoan");

const router = express.Router();

router.patch("/requestLoan", async (req, res) => {
  try {
    const {
      terms,
      loanAmount,
      interetsRate,
      paymentMethod,
      repaymentAmount,
      wHeard,
      useLoan,
      loanRepaymentPeriod,
      gpsLocation,
      contacts,
      userId,
      selfie,
    } = req.body;

    const user = await User.findById({ _id: userId });

    if (!user)
      return res.status(404).json({
        success: 0,
        message: "could not process request",
      });

    if (!user.isActive)
      return res.status(400).json({
        success: 0,
        message: "You are not eligible for loans, please contact support!",
      });

    if (user.loan.isApplied)
      return res.status(404).json({
        success: 0,
        message: "You have an outstanding loan, please complete that first!",
      });

    const generatedID = await _generateString(6);

    const loans = {
      userId: user.userId,
      ID: generatedID,
      terms,
      amount: loanAmount,
      duration: loanRepaymentPeriod,
      interest: interetsRate,
      repaymentAmount,
      usage: useLoan,
      paymentMethod,
      whereHeard: wHeard,
      facialRecog: selfie,
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
      contacts,
      gpsLocation,
    };

    const newLoan = [...user.loan.loans, loans];

    const loanData = {
      isApplied: true,
      loanStatus: "Review",
      paymentStatus: "Not paid",
      acumulatedOverDue: 0,
      loans: newLoan,
    };

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          loan: loanData,
        },
      },
      {
        new: true,
      }
    );

    if (updatedUser) {
      let ln = updatedUser.loan.loans.filter((item) => item.isNewLoan === true);
      loans.paymentStatus = loanData.paymentStatus;
      loans.loanStatus = loanData.loanStatus;
      loans.loanId = ln[0]._id;

      let resp = await _saveLoan(loans);

      if (resp)
        return res.status(200).json({
          success: 1,
          data: loans,
        });

      if (!resp)
        return res.status(400).json({
          success: 0,
          message: "request not sent",
        });
    }

    if (!updatedUser)
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
