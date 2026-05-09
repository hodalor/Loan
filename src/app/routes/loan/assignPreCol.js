const express = require("express");
const Loans = require("../../models/loans");

const router = express.Router();

router.patch("/assignPreColCase", async (req, res) => {
  try {
    const { IDs, preColOfficer } = req.body;

    const loans = await Loans.find({ ID: { $in: IDs } });

    loans.forEach(async (loan) => {
      loan.preCollOfficer = preColOfficer;
      loan.preCollCaseStatus = "Assigned";

      await loan.save();
    });

    res.json({
      messsage: "done",
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
