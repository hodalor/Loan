const express = require("express");
const Loans = require("../../models/loans");
const { upload } = require("../../../libs/uploadImage");
const { applyRepaymentToLoanLedger } = require("../../services/loanRepayment");

const router = express.Router();
const _clearLoan = require("../../handlers/userHandlers/clearUserLoan");

const parseJsonField = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const buildFileUrl = (req, file) =>
  `${req.protocol}://${req.get("host")}/upload/${file.filename}`;

router.patch("/confirmClearCaseP/:ID", upload.single("proof2"), async (req, res) => {
  try {
    const ID = req.params.ID;

    const loan = await Loans.findOne({ ID });
    if (!loan) {
      return res.status(404).json({
        success: 0,
        message: "Loan record not found.",
      });
    }

    const payload = parseJsonField(req.body?.data);
    const { rejectRemarks, auditResults, confirmedBy } = payload;
    const recieptImg = req.file ? buildFileUrl(req, req.file) : payload.recieptImg || "";

    loan.clearanceRecord.recordProofConfirm = recieptImg;
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

        return
    }
    

    const isPartialClear = loan.clearanceRecord.clearRemainingAmount === false;
    const amountJustCleared = Number.parseFloat(loan.clearanceRecord.amountPaid || 0);

    const paidAt = new Date();
    const ledgerResult = await applyRepaymentToLoanLedger({
      loanId: ID,
      amountJustCleared,
      paidAt,
      clearOverride: !isPartialClear,
    });

    if (ledgerResult) {
      const embeddedPaymentRecord = {
        ...(loan.clearanceRecord?.toObject ? loan.clearanceRecord.toObject() : loan.clearanceRecord),
        recordType: loan.clearanceRecord?.recordType || "public transfer",
        loanId: ID,
        userId: loan.userId,
        clearanceDate: loan.clearanceRecord?.clearanceDate || paidAt,
        datePaid: paidAt,
        amountPaid: `${amountJustCleared}`,
        actualAmount: `${loan.clearanceRecord?.actualAmount || amountJustCleared}`,
        clearRemainingAmount: `${!isPartialClear}`,
        auditResults: auditResults || "pass",
        confirmedBy: confirmedBy || loan.clearanceRecord?.confirmedBy || "",
        source: "manual-clearance",
      };
      const resp = await _clearLoan({
        ID,
        dp: paidAt,
        userId: loan.userId,
        clear: loan.clearanceRecord.clearRemainingAmount,
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
