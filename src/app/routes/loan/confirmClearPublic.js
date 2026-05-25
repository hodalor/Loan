const express = require("express");
const Loans = require("../../models/loans");
const { upload } = require("../../../libs/uploadImage");
const { resolveUploadedFileUrl } = require("../../../libs/mediaStorage");

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
    const recieptImg = req.file
      ? await resolveUploadedFileUrl(req, req.file, "loan-clearance/confirm")
      : payload.recieptImg || "";

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

    loan.isNewLoan = isPartialClear;
    loan.paymentStatus = isPartialClear ? "Not paid" : "Paid";
    loan.loanStatus = "Granted";
    loan.dp = new Date();
    loan.caseStatus = isPartialClear ? "Colection" : "Completed";
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
        clear: loan.clearanceRecord.clearRemainingAmount,
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
