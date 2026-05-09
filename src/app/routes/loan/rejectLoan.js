const express = require("express");
const Loans = require("../../models/loans");
const Admins = require("../../models/admin");
const _rejectLoan = require("../../handlers/userHandlers/rejectUserLoan");

const router = express.Router();

router.patch("/rejectLoan/:ID", async (req, res) => {
  try {
    let ID = req.params.ID;
    let { reviewOficer, comment } = req.body;

    const loan = await Loans.findOne({ ID });

    let officer = await Admins.findOne({ userName: reviewOficer });

    if (loan.rvOfName !== reviewOficer)
      return res.status(400).json({
        success: 0,
        message: "Cannot process a loan not assigned to you!",
      });

    const updated = await Loans.updateOne(
      { _id: loan._id },
      {
        $set: {
          isNewLoan: false,
          loanStatus: "Rejected",
          caseStatus: "Completed",
          paymentStatus: "Not paid",
          rvOfName: reviewOficer,
          rvOfCom: comment,
        },
      }
    );

    if (updated.modifiedCount >= 1) {
      let resp = await _rejectLoan({
        ID: ID,
        userId: loan.userId,
        rvOfName: reviewOficer,
        rvOfCom: comment,
      });

      if (resp) {
        let loanCase = officer.casesAssigned.find((loan) => loan.loanId === ID);

        loanCase.isProcessed = true;

        let newCases = officer.casesAssigned.filter(
          (loan) => loan.loanId !== ID
        );

        newCases.push(loanCase);

        officer.casesAssigned = newCases;

        await officer.save();

        return res.status(200).json({
          success: 1,
          message: "Loan rejected successfully",
        });
      }

      if (!resp)
        return res.status(400).json({
          success: 0,
          message: "could not reject loan",
        });
    }

    if (updated.modifiedCount < 1)
      return res.status(400).json({
        success: 0,
        message: "could not process request",
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
