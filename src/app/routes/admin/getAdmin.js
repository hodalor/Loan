const express = require("express");
const Admins = require("../../models/admin");

const router = express.Router();

router.get("/getAdmin/:userId", async (req, res) => {
  try {
    const admin = await Admins.findOne({ userId: req.params.userId });

    if (!admin)
      return res.status(404).json({
        success: 0,
        messsage: "could not find user",
      });

    return res.status(200).json({
      success: 1,
      data: admin,
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
