const express = require("express");
const Loans = require("../../models/loans");
const _clearLoan = require("../../handlers/userHandlers/clearUserLoan");

const router = express.Router();

router.patch("/confirmClearB/:ID", async (req, res) => {
  try {
    const ID = req.params.ID;

    const loan = await Loans.findOne({ ID });
    if (!loan) {
      return res.status(404).json({
        success: 0,
        message: "Loan record not found.",
      });
    }

    const { rejectRemarks, auditResults, confirmedBy } = req.body;
    const amountJustCleared = Number.parseFloat(loan.clearanceRecord?.amountPaid || 0);

    loan.clearanceRecord.rejectRemarks = rejectRemarks;
    loan.clearanceRecord.auditResults = auditResults;
    loan.clearanceRecord.confirmedBy = confirmedBy;

    loan.clearanceFlag = false;

    if (auditResults === "reject") {
      loan.clearanceRecord = {};

      let savedLoan = await loan.save();

      if (savedLoan)
        return res.status(200).json({
          success: 1,
          message: "request rejected successfully",
        });

      if (!savedLoan)
        return res.status(200).json({
          success: 0,
          message: "could not reject request",
        });
    }

    loan.isNewLoan = false;
    loan.paymentStatus = "Paid";
    loan.loanStatus = "Granted";
    loan.caseStatus = "Completed";
    loan.dp = new Date();
    loan.amountPaid = Number.parseFloat(loan.amountPaid || 0) + amountJustCleared;
    loan.paymentRecords =
      loan.paymentRecords === undefined
        ? [
            {
              datePaid: new Date(),
              amountPaid: amountJustCleared,
            },
          ]
        : [
            ...loan.paymentRecords,
            {
              datePaid: new Date(),
              amountPaid: amountJustCleared,
            },
          ];

    let savedLoan = await loan.save();

    if (savedLoan) {
      const resp = await _clearLoan({
        ID,
        dp: loan.dp,
        userId: loan.userId,
        clear: true,
        amt: amountJustCleared,
      });

      if (resp)
        return res.status(200).json({
          success: 1,
          message: "loan cleared successfully",
        });

      if (!resp)
        return res.status(400).json({
          success: 0,
          message: "loan could not be cleared",
        });
    }

    if (!savedLoan)
      return res.status(400).json({
        success: 0,
        message: "could not clear loan",
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
