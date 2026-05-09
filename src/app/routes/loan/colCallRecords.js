const express = require("express");
const Loans = require("../../models/loans");
const Admins = require("../../models/admin");

const router = express.Router();

router.patch("/colCallRecord/:ID", async (req, res) => {
  try {
    const ID = req.params.ID;

    const loan = await Loans.findOne({ ID });

    const admin = await Admins.findOne({ userName: req.body.collOfficer });

    let loanCase = admin.casesAssigned.find((cas) => cas.loanId === loan.ID);

    if (loanCase === undefined)
      return res.status(400).json({
        success: 0,
        message: "You cannot record a case, which is not assigned to you!",
      });

    loanCase.isProcessed = true;

    const {
      calledNumber,
      relation,
      callResult,
      callDate,
      collOfficer,
      remarks,
    } = req.body;

    const recordData = {
      calledNumber,
      relation,
      callResult,
      callDate,
      collOfficer,
      remarks,
    };

    let recs = [...loan.collCallRecords, recordData];

    loan.collCallRecords = recs;

    let savedAdmin = await admin.save();

    let savedData = await loan.save();

    if (savedData)
      return res.status(200).json({
        success: 1,
        message: "record added successfully",
      });

    if (!savedData)
      return res.status(400).json({
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
