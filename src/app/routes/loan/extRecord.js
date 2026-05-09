const express = require("express");
const Loans = require("../../models/loans");
const fetch = require("node-fetch");
const config = require("../../../config");
const _getToken = require("../../../libs/getToken");
const _createExt = require("../../../app/handlers/userHandlers/createExt");

const router = express.Router();

router.patch("/extRecord/:id", async (req, res) => {
  try {
    const ID = req.params.id;

    const { extFee, tRepay, repDay, name, network, pMethod, type } = req.body;

    // console.log({"res2 in": res});
    const loan = await Loans.findOne({ ID });

    const recordData = {
      loanId: ID,
      extExpDate: new Date(repDay),
      extPeriod: "7 days",
      extHandlingFee: JSON.stringify(extFee),
      extStatus: "Approved",
      source: type === "admin" ? "manual" : "self",
      requestStatus: "Approved",
      requestedBy: name || "Admin",
      approvedBy: name || "Admin",
    };

    loan.extRecords.push(recordData);

    loan.dop = new Date(repDay);

    let savedLoan = await loan.save();

    if (savedLoan === loan) {
      const resp = await _createExt({
        ID,
        dop: new Date(repDay),
        userId: loan.userId,
        extRecord: recordData,
      });
      if (resp)
        return res.status(200).json({
          success: 1,
          message: "record added successfully",
        });

      if (!resp)
        return res.status(200).json({
          success: 0,
          message: "record could not be added",
        });
    }

    if (savedLoan !== loan)
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
