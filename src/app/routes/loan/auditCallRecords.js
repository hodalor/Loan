const express = require("express");
const Loans = require("../../models/loans");

const router = express.Router();

router.patch("/auditCallRecord/:ID", async (req, res) => {
  try {
    const ID = req.params.ID;

    const loan = await Loans.findOne({ ID });

    const {
      calledNumber,
      relation,
      callResult,
      callDate,
      auditOfficer,
      remarks,
    } = req.body;

    const recordData = {
      calledNumber,
      relation,
      callResult,
      callDate,
      auditOfficer,
      remarks,
    };

    loan.auditCallRecords.push(recordData);

    let savedData = await loan.save();

    if (savedData)
      return res.status(200).json({
        success: 1,
        message: "record added successfully",
      });

    if (!savedData)
      return res.status(200).json({
        success: 1,
        message: "could not add record",
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
