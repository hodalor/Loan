const express = require("express");
const Loans = require("../../models/loans");

const router = express.Router();

router.patch("/clearCaseBalance/:ID", async (req, res) => {
  try {
    const ID = req.params.ID;

    const loan = await Loans.findOne({ ID });

    const {
      recordType,
      userId,
      clearanceDate,
      remainingAmount,
      amountPaid,
      actualAmount,
      clearRemainingAmount,
      reviewedBy,
    } = req.body;

    const recordData = {
      recordType,
      loanId: ID,
      userId,
      clearanceDate,
      amountPaid,
      clearRemainingAmount,
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
