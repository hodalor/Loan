const express = require("express");
const Loans = require("../../models/loans");
const Admins = require("../../models/admin");

const router = express.Router();

router.patch("/preColCallRecord/:ID", async (req, res) => {
  try {
    const ID = req.params.ID;

    const preCollOfficer = req.body.preCollOfficer;

    const loan = await Loans.findOne({ ID });

    const admin = await Admins.findOne({ userName: preCollOfficer });

    let loanCase = admin.casesAssigned.find((cas) => cas.loanId === loan.ID);

    if (loanCase === undefined)
      return res.status(400).json({
        success: 0,
        message: "You cannot record a case, which is not assigned to you!",
      });

    loanCase.isProcessed = true;

    const { calledNumber, relation, callResult, callDate, remarks } = req.body;

    const recordData = {
      calledNumber,
      relation,
      callResult,
      callDate,
      plannedRepayDate: "",
      preCollOfficer,
      remarks,
    };

    let recs = [...loan.preCollCallRecords, recordData];

    loan.preCollCallRecords = recs;

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
