const express = require("express");
const Loans = require("../../models/loans");
const Admins = require("../../models/admin");
const StaffGroups = require("../../models/staffGroup");
const Users = require("../../models/users");
const { getCalendarDayDifferenceByCountry } = require("../../../libs/countryTime");

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
  "timeZone",
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
const isSettledPaymentStatus = (status = "") =>
  PAYMENT_STATUSES.includes(String(status || "").trim());
const hasRecordedRepayment = (loan = {}) =>
  Number.parseFloat(loan?.amountPaid || 0) > 0 ||
  (Array.isArray(loan?.paymentRecords) && loan.paymentRecords.length > 0);
const buildUserLookup = (users = []) =>
  new Map((Array.isArray(users) ? users : []).map((user) => [String(user?.userId || ""), user]));
const getLoanDueDifference = (loan = {}, userLookup = new Map()) =>
  getCalendarDayDifferenceByCountry(
    loan?.dop,
    new Date(),
    userLookup.get(String(loan?.userId || "")) || {}
  );

const filterPreCollectionLoans = (loans = [], users = [], userName = "") => {
  const userLookup = buildUserLookup(users);

  return (Array.isArray(loans) ? loans : []).filter((loan) => {
    const dueDifference = getLoanDueDifference(loan, userLookup);
    const officerMatches = userName ? loan?.preCollOfficer === userName : true;
    const colCallRec = Array.isArray(loan?.collCallRecords) ? loan.collCallRecords.length : 0;
    const preCallRec = Array.isArray(loan?.preCollCallRecords) ? loan.preCollCallRecords.length : 0;
    const clearanceType = loan?.clearanceRecord?.recordType;

    if (
      officerMatches &&
      loan?.caseStatus !== "Completed" &&
      dueDifference >= 0 &&
      dueDifference <= 2
    ) {
      return true;
    }

    return (
      officerMatches &&
      colCallRec === 0 &&
      preCallRec !== 0 &&
      (isSettledPaymentStatus(loan?.paymentStatus) || hasRecordedRepayment(loan)) &&
      clearanceType !== "balance"
    );
  });
};

const filterCollectionLoans = (loans = [], users = [], userName = "") => {
  const userLookup = buildUserLookup(users);

  return (Array.isArray(loans) ? loans : []).filter((loan) => {
    const dueDifference = getLoanDueDifference(loan, userLookup);
    const officerMatches = userName ? loan?.collofficer === userName : true;
    const colCallRec = Array.isArray(loan?.collCallRecords) ? loan.collCallRecords.length : 0;
    const clearanceType = loan?.clearanceRecord?.recordType;

    if (
      officerMatches &&
      loan?.caseStatus !== "Completed" &&
      loan?.loanStatus !== "Review" &&
      dueDifference < 0
    ) {
      return true;
    }

    return (
      officerMatches &&
      colCallRec !== 0 &&
      (isSettledPaymentStatus(loan?.paymentStatus) || hasRecordedRepayment(loan)) &&
      clearanceType !== "balance"
    );
  });
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
      const [admins, users, loans, staffGroups] = await Promise.all([
        findAdmins(),
        findUsers(),
        findLoans(),
        StaffGroups.find().sort({ department: 1, name: 1 }).lean(),
      ]);

      return res.status(200).json({
        success: 1,
        data: { loans, users, admins, staffGroups },
      });
    }

    if (role === "pre-team-lead") {
      const [admins, users, allLoans, staffGroups] = await Promise.all([
        findAdmins(),
        findUsers(),
        findLoans(),
        StaffGroups.find().sort({ department: 1, name: 1 }).lean(),
      ]);
      const loans = filterPreCollectionLoans(allLoans, users);

      return res.status(200).json({
        success: 1,
        data: { loans, users, admins, staffGroups },
      });
    }

    if (role === "col-team-lead") {
      const [admins, users, allLoans, staffGroups] = await Promise.all([
        findAdmins(),
        findUsers(),
        findLoans(),
        StaffGroups.find().sort({ department: 1, name: 1 }).lean(),
      ]);
      const loans = filterCollectionLoans(allLoans, users);

      return res.status(200).json({
        success: 1,
        data: { loans, users, admins, staffGroups },
      });
    }

    if (role === "rev-personel") {
      const [users, loans, staffGroups] = await Promise.all([
        findUsers(),
        findLoans({ rvOfName: user.userName }),
        StaffGroups.find().sort({ department: 1, name: 1 }).lean(),
      ]);

      return res.status(200).json({
        success: 1,
        data: { loans, users, staffGroups },
      });
    }

    if (role === "pre-personel") {
      const [users, allLoans, staffGroups] = await Promise.all([
        findUsers(),
        findLoans(),
        StaffGroups.find().sort({ department: 1, name: 1 }).lean(),
      ]);
      const loans = filterPreCollectionLoans(allLoans, users, user.userName);

      return res.status(200).json({
        success: 1,
        data: { loans, users, staffGroups },
      });
    }

    if (role === "col-personel") {
      const [users, allLoans, staffGroups] = await Promise.all([
        findUsers(),
        findLoans(),
        StaffGroups.find().sort({ department: 1, name: 1 }).lean(),
      ]);
      const loans = filterCollectionLoans(allLoans, users, user.userName);

      return res.status(200).json({
        success: 1,
        data: { loans, users, staffGroups },
      });
    }

    return res.status(200).json({
      success: 1,
      data: { loans: [], users: [], admins: [], staffGroups: [] },
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
