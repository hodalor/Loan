const express = require("express");
const Loans = require("../../models/loans");
const _clearLoan = require("../../handlers/userHandlers/clearUserLoan");
const { applyRepaymentToLoanLedger } = require("../../services/loanRepayment");

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

    const paidAt = new Date();
    const ledgerResult = await applyRepaymentToLoanLedger({
      loanId: ID,
      amountJustCleared,
      paidAt,
      clearOverride: true,
    });

    if (ledgerResult) {
      const embeddedPaymentRecord = {
        ...(loan.clearanceRecord?.toObject ? loan.clearanceRecord.toObject() : loan.clearanceRecord),
        recordType: loan.clearanceRecord?.recordType || "balance",
        loanId: ID,
        userId: loan.userId,
        clearanceDate: loan.clearanceRecord?.clearanceDate || paidAt,
        datePaid: paidAt,
        amountPaid: `${amountJustCleared}`,
        actualAmount: `${loan.clearanceRecord?.actualAmount || amountJustCleared}`,
        clearRemainingAmount: "true",
        auditResults: auditResults || "pass",
        confirmedBy: confirmedBy || loan.clearanceRecord?.confirmedBy || "",
        source: "manual-clearance",
      };
      const resp = await _clearLoan({
        ID,
        dp: paidAt,
        userId: loan.userId,
        clear: true,
        amt: amountJustCleared,
        paymentRecord: embeddedPaymentRecord,
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

    if (!ledgerResult)
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
