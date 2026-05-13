const express = require("express");
const { _getDatefromDays } = require("../../../libs/calcDate");
const _grantLoan = require("../../handlers/userHandlers/grantUserLoan");
const Loan = require("../../models/loans");
const Admins = require("../../models/admin");
const Users = require("../../models/users");
const { getSystemConfig } = require("../../services/systemConfig");
const { processLoanDisbursement } = require("../../services/payout");

const router = express.Router();

router.patch("/grantLoan/:ID", async (request, responses) => {
  try {
    const ID = request.params.ID;
    const { reviewOficer, comment } = request.body;

    const loan = await Loan.findOne({ ID });
    if (!loan)
      return responses.status(404).json({
        success: 0,
        message: "Loan was not found",
      });

    const officer = await Admins.findOne({ userName: reviewOficer });

    if (loan.rvOfName !== reviewOficer)
      return responses.status(400).json({
        success: 0,
        message: "Cannot process a loan not assigned to you!",
      });

    const nb = parseInt(loan.duration.split(" ")[0], 10);

    const loanStatus = "Granted";
    const caseStatus = "Colection";
    const systemConfig = await getSystemConfig();

    let payoutResult = {
      success: false,
      pending: false,
      provider: systemConfig.disbursementGateway || systemConfig.activeChannel,
      channel: "",
      reference: ID,
      message: "Loan approved and queued for manual disbursement.",
      raw: null,
    };

    if (systemConfig.disbursementMode === "automatic") {
      const user = await Users.findOne({ userId: loan.userId });
      payoutResult = await processLoanDisbursement({
        loan,
        user,
        systemConfig,
      });
    }

    const isAutoSuccess =
      systemConfig.disbursementMode === "automatic" && payoutResult.success;
    const dateOfDisbursement = isAutoSuccess ? new Date() : null;
    const dateOfPayment = isAutoSuccess ? await _getDatefromDays(nb) : null;

    const loanUpdate = {
      dod: dateOfDisbursement,
      dop: dateOfPayment,
      loanStatus,
      rvOfName: reviewOficer,
      rvOfCom: comment,
      caseStatus,
      isDisbursed:
        systemConfig.disbursementMode === "automatic" ? payoutResult.success : false,
      disbursementMode: systemConfig.disbursementMode,
      disbursementProvider:
        systemConfig.disbursementMode === "automatic"
          ? payoutResult.provider
          : systemConfig.disbursementGateway || systemConfig.activeChannel,
      disbursementChannel:
        systemConfig.disbursementMode === "automatic"
          ? payoutResult.channel
          : "manual-queue",
      payoutStatus:
        systemConfig.disbursementMode === "automatic"
          ? payoutResult.success
            ? "success"
            : payoutResult.pending
            ? "pending"
            : "failed"
          : "pending-manual",
      payoutReference: payoutResult.reference || ID,
      payoutMessage: payoutResult.message,
    };

    if (!officer)
      return responses.status(400).json({
        success: 0,
        message: "The case was not Assigned to you!!",
      });

    const updated = await Loan.updateOne({ _id: loan._id }, { $set: loanUpdate });

    if (updated.modifiedCount < 1)
      return responses.status(400).json({
        success: 0,
        message: "could not process request, please try again",
      });

    const resp = await _grantLoan({
      ID,
      userId: loan.userId,
      ...loanUpdate,
    });

    if (!resp)
      return responses.status(400).json({
        success: 0,
        message: "could not grant loan",
      });

    const loanCase = officer.casesAssigned.find((item) => item.loanId === ID);
    if (loanCase) {
      loanCase.isProcessed = true;

      const newCases = officer.casesAssigned.filter((item) => item.loanId !== ID);
      newCases.push(loanCase);
      officer.casesAssigned = newCases;
      await officer.save();
    }

    const responseMessage =
      systemConfig.disbursementMode === "automatic"
        ? payoutResult.success
          ? "Loan granted and disbursed successfully"
          : payoutResult.pending
          ? `Loan granted and disbursement request accepted: ${payoutResult.message}`
          : `Loan granted, but automatic disbursement failed: ${payoutResult.message}`
        : "Loan granted and moved to manual disbursement";

    return responses.status(200).json({
      success: 1,
      message: responseMessage,
      data: {
        disbursementMode: systemConfig.disbursementMode,
        payoutStatus: loanUpdate.payoutStatus,
        payoutMessage: payoutResult.message,
        activeChannel: systemConfig.activeChannel,
        disbursementGateway: systemConfig.disbursementGateway || systemConfig.activeChannel,
      },
    });
  } catch (error) {
    console.log(error);
    return responses.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
