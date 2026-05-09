const express = require("express");
const Loans = require("../../models/loans");
const syncUserLoanState = require("../../handlers/userHandlers/syncUserLoanState");
const { getSystemConfig } = require("../../services/systemConfig");

const router = express.Router();

const parseLoanDurationDays = (duration = "") => {
  const parsed = Number.parseInt(String(duration || "").split(" ")[0], 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 30;
  return parsed;
};

router.patch("/manual-disbursement/confirm", async (req, res) => {
  try {
    const submittedLoanIds = Array.isArray(req.body?.loanIds)
      ? req.body.loanIds.map((item) => String(item || "")).filter(Boolean)
      : [];
    const normalizedLoanIds = submittedLoanIds
      .map((item) => item.trim())
      .filter(Boolean);

    if (normalizedLoanIds.length === 0) {
      return res.status(400).json({
        success: 0,
        message: "Select at least one approved loan to mark as disbursed.",
      });
    }

    const [loans, systemConfig] = await Promise.all([
      Loans.find({
        ID: {
          $in: Array.from(new Set([...submittedLoanIds, ...normalizedLoanIds])),
        },
      }),
      getSystemConfig(),
    ]);

    if (loans.length === 0) {
      return res.status(404).json({
        success: 0,
        message: "No approved manual-disbursement loans were found.",
      });
    }

    const results = [];

    for (const loan of loans) {
      if (loan.loanStatus !== "Granted") {
        results.push({
          loanId: loan.ID,
          success: false,
          message: "Only granted loans can be marked as disbursed.",
        });
        continue;
      }

      if (loan.isDisbursed === true) {
        results.push({
          loanId: loan.ID,
          success: false,
          message: "Loan is already marked as disbursed.",
        });
        continue;
      }

      const disbursedAt = new Date();
      const dueDate = new Date(disbursedAt);
      dueDate.setDate(dueDate.getDate() + parseLoanDurationDays(loan.duration));

      loan.isDisbursed = true;
      loan.disbursementMode = "manual";
      loan.disbursementProvider = loan.disbursementProvider || systemConfig.activeChannel || "manual";
      loan.disbursementChannel = "manual-confirmed";
      loan.payoutStatus = "success";
      loan.payoutMessage = "Loan disbursed manually and confirmed by admin.";
      loan.dod = disbursedAt;
      loan.dop = dueDate;

      await loan.save();

      await syncUserLoanState({
        userId: loan.userId,
        loanId: loan.ID,
        rootLoanStatus: "Granted",
        updates: {
          isDisbursed: true,
          disbursementMode: loan.disbursementMode,
          disbursementProvider: loan.disbursementProvider,
          disbursementChannel: loan.disbursementChannel,
          payoutStatus: loan.payoutStatus,
          payoutMessage: loan.payoutMessage,
          dod: loan.dod,
          dop: loan.dop,
          loanStatus: "Granted",
        },
      });

      results.push({
        loanId: loan.ID,
        success: true,
        message: "Loan marked as disbursed successfully.",
      });
    }

    const successCount = results.filter((item) => item.success).length;

    return res.status(200).json({
      success: successCount > 0 ? 1 : 0,
      message:
        successCount > 0
          ? `${successCount} loan${successCount === 1 ? "" : "s"} marked as disbursed.`
          : "No selected loan could be marked as disbursed.",
      data: results,
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
