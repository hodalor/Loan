const express = require("express");
const Loans = require("../../models/loans");
const Admins = require("../../models/admin");
const Users = require("../../models/users");

const router = express.Router();
const ADMIN_PROJECTION = "-password -logData -casesAssigned -__v";
const USER_SUMMARY_PROJECTION = [
  "userId",
  "phone",
  "isActive",
  "isVerified",
  "level",
  "createdAt",
  "countryCode",
  "countryName",
  "countryDialCode",
  "locale",
  "currencyCode",
  "currencySymbol",
  "IDinfo.firstName",
  "IDinfo.middleName",
  "IDinfo.lastName",
  "IDinfo.gender",
  "IDinfo.gCardNumber",
  "loan.isApplied",
  "loan.loanStatus",
  "loan.paymentStatus",
  "loan.acumulatedOverDue",
  "loan.loans.ID",
].join(" ");
const PAYMENT_STATUSES = ["Payed", "Paid"];

const getTodayRange = () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfThreeDays = new Date(startOfToday);
  startOfThreeDays.setDate(startOfThreeDays.getDate() + 3);

  return { startOfToday, startOfThreeDays };
};

const buildPreCollectionFilter = (userName = "") => {
  const { startOfToday, startOfThreeDays } = getTodayRange();
  const officerFilter = userName ? { preCollOfficer: userName } : {};

  return {
    $or: [
      {
        ...officerFilter,
        dop: { $gte: startOfToday, $lt: startOfThreeDays },
        caseStatus: { $ne: "Completed" },
      },
      {
        ...officerFilter,
        "preCollCallRecords.0": { $exists: true },
        "collCallRecords.0": { $exists: false },
        paymentStatus: { $in: PAYMENT_STATUSES },
        "clearanceRecord.recordType": { $ne: "balance" },
      },
    ],
  };
};

const buildCollectionFilter = (userName = "") => {
  const { startOfToday } = getTodayRange();
  const officerFilter = userName ? { collofficer: userName } : {};

  return {
    $or: [
      {
        ...officerFilter,
        dop: { $lt: startOfToday },
        caseStatus: { $ne: "Completed" },
        loanStatus: { $ne: "Review" },
      },
      {
        ...officerFilter,
        "collCallRecords.0": { $exists: true },
        paymentStatus: { $in: PAYMENT_STATUSES },
        "clearanceRecord.recordType": { $ne: "balance" },
      },
    ],
  };
};

const findAdmins = () => Admins.find().select(ADMIN_PROJECTION).sort({ createdAt: -1 }).lean();
const findUsers = () =>
  Users.find().select(USER_SUMMARY_PROJECTION).sort({ createdAt: -1 }).lean();
const findLoans = (filter = {}) => Loans.find(filter).sort({ doa: -1 }).lean();

router.get("/getData/:id", async (req, res) => {
  try {
    const adminId = req.params.id;
    const user = await Admins.findOne({ userId: adminId })
      .select("userId userName role department permissions")
      .lean();

    const role = !user ? "" : user.role;

    if (role === "")
      return res.status(400).json({
        success: 0,
        message: "You are not authorized!",
      });

    if (role === "super-admin" || role === "admin" || role === "rv-team-lead") {
      const [admins, users, loans] = await Promise.all([
        findAdmins(),
        findUsers(),
        findLoans(),
      ]);

      return res.status(200).json({
        success: 1,
        data: { loans, users, admins },
      });
    }

    if (role === "pre-team-lead") {
      const [admins, users, loans] = await Promise.all([
        findAdmins(),
        findUsers(),
        findLoans(buildPreCollectionFilter()),
      ]);

      return res.status(200).json({
        success: 1,
        data: { loans, users, admins },
      });
    }

    if (role === "col-team-lead") {
      const [admins, users, loans] = await Promise.all([
        findAdmins(),
        findUsers(),
        findLoans(buildCollectionFilter()),
      ]);

      return res.status(200).json({
        success: 1,
        data: { loans, users, admins },
      });
    }

    if (role === "rev-personel") {
      const [users, loans] = await Promise.all([
        findUsers(),
        findLoans({ rvOfName: user.userName }),
      ]);

      return res.status(200).json({
        success: 1,
        data: { loans, users },
      });
    }

    if (role === "pre-personel") {
      const [users, loans] = await Promise.all([
        findUsers(),
        findLoans(buildPreCollectionFilter(user.userName)),
      ]);

      return res.status(200).json({
        success: 1,
        data: { loans, users },
      });
    }

    if (role === "col-personel") {
      const [users, loans] = await Promise.all([
        findUsers(),
        findLoans(buildCollectionFilter(user.userName)),
      ]);

      return res.status(200).json({
        success: 1,
        data: { loans, users },
      });
    }

    return res.status(200).json({
      success: 1,
      data: { loans: [], users: [], admins: [] },
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
