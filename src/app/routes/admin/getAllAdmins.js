const express = require("express");
const Admins = require("../../models/admin");

const router = express.Router();

router.get("/getAdmins/", async (req, res) => {
  try {
    const admins = await Admins.findOne();

    if (!admins)
      return res.status(400).json({
        success: 0,
        messsage: "no data found!",
      });

    if (admins.length === 0)
      return res.status(400).json({
        success: 0,
        messsage: "no data found!",
      });

    return res.status(200).json({
      success: 1,
      data: admins,
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
