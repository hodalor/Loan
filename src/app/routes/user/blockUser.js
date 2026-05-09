const express = require("express");
const User = require("../../models/users");

const router = express.Router();

router.patch("/blockUser/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const blockedUser = await User.updateOne(
      { _id: id },
      {
        $set: {
          isActive: false,
        },
      }
    );

    if (blockedUser.modifiedCount >= 1)
      return res.status(200).json({
        success: 1,
        message: "user blocked succeefully",
      });

    if (blockedUser.modifiedCount < 1)
      return res.status(400).json({
        success: 0,
        message: "could not block user, please try again",
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
