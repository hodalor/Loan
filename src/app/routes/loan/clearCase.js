const express = require("express");
const Loans = require("../../models/loans");
const { upload } = require("../../../libs/uploadImage");

const router = express.Router();

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

router.patch("/clearCasePublic/:ID", upload.single("proof1"), async (req, res) => {
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
    const {
      recordType,
      userId,
      clearanceDate,
      remainingAmount,
      amountPaid,
      actualAmount,
      clearRemainingAmount,
      remarks,
      reviewedBy,
    } = payload;
    const recieptImg = req.file ? buildFileUrl(req, req.file) : payload.recieptImg || "";

    const recordData = {
      recordType,
      loanId: ID,
      userId,
      recordProofAudit: recieptImg,
      clearanceDate,
      amountPaid,
      clearRemainingAmount,
      remarks,
      remainingAmount,
      actualAmount,
      reviewedBy,
    };

    loan.clearanceRecord = recordData;

    loan.clearanceFlag = true;

    let saved = await loan.save();

    if (saved) {
      return res.status(200).json({
        success: 1,
        message: "loan flagged for clearance successfully",
      });
    }

    if (!saved)
      return res.status(200).json({
        success: 0,
        message: "could not flag loan for clearance",
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
