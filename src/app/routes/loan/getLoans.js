const express = require("express");
const Loans = require("../../models/loans");

const router = express.Router();

router.get("/getLoans", async (req, res) => {
  try {
    const loans = await Loans.find();

    if (!loans)
      return res.status(404).json({
        success: 0,
        message: "no data found",
      });

    if (loans.lenth === 0)
      return res.status(404).json({
        success: 0,
        message: "no data found",
      });

    if (loans)
      return res.status(200).json({
        success: 1,
        data: loans,
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
