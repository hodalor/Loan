const express = require("express");
const Loans = require("../../models/loans");
const { upload } = require("../../../libs/uploadImage");
const { getSystemConfig } = require("../../services/systemConfig");
const _createExt = require("../../handlers/userHandlers/createExt");

const router = express.Router();

const parseJsonField = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const buildFileUrl = (req, file) =>
  `${req.protocol}://${req.get("host")}/upload/${file.filename}`;

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const startOfDay = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getDayDifference = (futureDateValue) => {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(futureDateValue);

  if (!today || !targetDate) return null;

  return Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

router.post("/admin-extension/request", upload.single("proof"), async (req, res) => {
  try {
    const payload = parseJsonField(req.body?.data);
    const { loanId, userId, extensionKey, requestedBy } = payload;

    if (!loanId || !userId || !extensionKey) {
      return res.status(400).json({
        success: 0,
        message: "User ID, loan ID and extension option are required.",
      });
    }

    const [loan, systemConfig] = await Promise.all([
      Loans.findOne({ ID: loanId, userId }),
      getSystemConfig(),
    ]);

    if (!loan) {
      return res.status(404).json({
        success: 0,
        message: "Active loan was not found for the supplied user and loan ID.",
      });
    }

    const daysRemaining = loan.dop ? getDayDifference(loan.dop) : null;
    if (
      loan.loanStatus !== "Granted" ||
      loan.paymentStatus === "Paid" ||
      loan.isDisbursed !== true ||
      daysRemaining === null ||
      daysRemaining < 0
    ) {
      return res.status(400).json({
        success: 0,
        message: "Loan extension is only available before or on the due date.",
      });
    }

    const extensionOptions = (Array.isArray(systemConfig.extensionPeriods)
      ? systemConfig.extensionPeriods
      : []
    ).filter((item) => item?.isEnabled);
    const selectedOption = extensionOptions.find((item) => item.key === extensionKey);

    if (!selectedOption) {
      return res.status(400).json({
        success: 0,
        message: "The selected extension option is not available.",
      });
    }

    const nextDueDate = new Date(loan.dop);
    nextDueDate.setDate(nextDueDate.getDate() + Number(selectedOption.days || 0));

    loan.extRecords = Array.isArray(loan.extRecords) ? loan.extRecords : [];
    loan.extRecords.push({
      loanId,
      extPeriod: selectedOption.label,
      extHandlingFee: `${toNumber((toNumber(loan.amount) * toNumber(selectedOption.feeRate)) / 100, 0)}`,
      extExpDate: nextDueDate,
      extStatus: "Pending",
      source: "manual",
      requestStatus: "Pending",
      requestedBy: requestedBy || "Admin",
      proofUrl: req.file ? buildFileUrl(req, req.file) : "",
    });

    await loan.save();

    return res.status(200).json({
      success: 1,
      message: "Extension request submitted for approval.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

router.patch("/admin-extension/approve/:loanId/:recordId", async (req, res) => {
  try {
    const { loanId, recordId } = req.params;
    const approvedBy = String(req.body?.approvedBy || "").trim() || "Admin";
    const loan = await Loans.findOne({ ID: loanId });

    if (!loan) {
      return res.status(404).json({
        success: 0,
        message: "Loan record not found.",
      });
    }

    const extensionRecord = Array.isArray(loan.extRecords)
      ? loan.extRecords.find((item) => `${item._id}` === `${recordId}`)
      : null;

    if (!extensionRecord) {
      return res.status(404).json({
        success: 0,
        message: "Extension request not found.",
      });
    }

    if ((extensionRecord.requestStatus || extensionRecord.extStatus) === "Approved") {
      return res.status(400).json({
        success: 0,
        message: "This extension request has already been approved.",
      });
    }

    const currentDueDate = loan.dop ? new Date(loan.dop) : null;
    const requestedDueDate = extensionRecord.extExpDate
      ? new Date(extensionRecord.extExpDate)
      : null;

    if (!currentDueDate || !requestedDueDate || Number.isNaN(requestedDueDate.getTime())) {
      return res.status(400).json({
        success: 0,
        message: "The extension request does not have a valid due date.",
      });
    }

    if (getDayDifference(currentDueDate) < 0) {
      return res.status(400).json({
        success: 0,
        message: "Overdue loans cannot be extended from the admin extension workflow.",
      });
    }

    extensionRecord.requestStatus = "Approved";
    extensionRecord.extStatus = "Approved";
    extensionRecord.approvedBy = approvedBy;
    loan.dop = requestedDueDate;

    await loan.save();
    await _createExt({
      ID: loan.ID,
      dop: requestedDueDate,
      userId: loan.userId,
      extRecord: {
        loanId: extensionRecord.loanId,
        extPeriod: extensionRecord.extPeriod,
        extHandlingFee: extensionRecord.extHandlingFee,
        extExpDate: extensionRecord.extExpDate,
        extStatus: "Approved",
        source: extensionRecord.source || "manual",
        requestStatus: "Approved",
        requestedBy: extensionRecord.requestedBy || "Admin",
        approvedBy,
        proofUrl: extensionRecord.proofUrl || "",
      },
    });

    return res.status(200).json({
      success: 1,
      message: "Extension approved successfully.",
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
