const express = require("express");
const User = require("../../models/users");

const router = express.Router();

router.patch("/deleteUser/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const deletedUser = await User.findByIdAndDelete({ _id: id });

    if (deletedUser)
      return res.status(200).json({
        success: 1,
        message: "User removed succeefully",
      });

    if (deletedUser)
      return res.status(400).json({
        success: 0,
        message: "could not remove user, please try again",
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
