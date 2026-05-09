const express = require("express");
const _checkDuration = require("../../../libs/checkDur");
const User = require("../../models/users");

const router = express.Router();

router.get("/findUser/:id", async (req, res) => {
  try {
    let id = req.params.id;

    const user = await User.findById({ _id: id });

    if (!user)
      return res.status(404).json({
        success: 0,
        message: "User not found, please register",
      });

    var response = await _checkDuration(user.loan.loans);

    var newUser;

    if (response !== null && Math.sign(response.days) === -1) {
      const loanData = {
        isApplied: user.loan.isApplied,
        loanStatus: user.loan.loanStatus,
        paymentStatus: "Overdue",
        acumulatedOverDue: user.loan.acumulatedOverDue,
        loans: user.loan.loans,
      };

      let updatedUser = await User.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            loan: loanData,
          },
        },
        {
          new: true,
        }
      );

      newUser = updatedUser;
    }

    return res.status(200).json({
      success: 1,
      data: newUser === undefined ? user : newUser,
      res: response,
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
