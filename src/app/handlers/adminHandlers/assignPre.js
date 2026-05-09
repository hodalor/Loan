const Admins = require("../../models/admin");
const Loans = require("../../models/loans");

const mergeAssignedCases = (currentCases = [], nextLoanIds = []) => {
  const existingLoanIds = new Set(
    (Array.isArray(currentCases) ? currentCases : []).map((item) => item.loanId)
  );
  const mergedCases = Array.isArray(currentCases) ? [...currentCases] : [];

  nextLoanIds.forEach((loanId) => {
    if (!existingLoanIds.has(loanId)) {
      mergedCases.push({
        loanId,
        isProcessed: false,
      });
    }
  });

  return mergedCases;
};

const buildRoundRobinAssignments = (records = [], personnelList = []) =>
  records.map((loan, index) => ({
    loan,
    userName: personnelList[index % personnelList.length].userName,
  }));

const _assignPreTask = async (data) => {
  const adminCases = data.casesSelected.flat(1);
  const personnelList = Array.isArray(data.personnelList)
    ? data.personnelList
    : data.personnel
    ? [data.personnel]
    : [];

  if (adminCases.length === 0 || personnelList.length === 0) return false;

  const ids = adminCases.map((cas) => cas.ID);
  const records = await Loans.find({ ID: { $in: ids } });
  const admins = await Admins.find({
    userName: { $in: personnelList.map((item) => item.userName) },
  });

  if (admins.length === 0) return false;

  const recordsMap = new Map(records.map((item) => [item.ID, item]));
  const orderedRecords = ids
    .map((id) => recordsMap.get(id))
    .filter((loan) => loan !== undefined);
  const assignments = buildRoundRobinAssignments(orderedRecords, personnelList);
  const assignmentGroups = assignments.reduce((accumulator, assignment) => {
    const loanIds = accumulator.get(assignment.userName) || [];
    loanIds.push(assignment.loan.ID);
    accumulator.set(assignment.userName, loanIds);
    return accumulator;
  }, new Map());

  await Loans.bulkWrite(
    assignments.map((assignment) => ({
      updateOne: {
        filter: { ID: assignment.loan.ID },
        update: {
          $set: {
            preCollOfficer: assignment.userName,
          },
        },
      },
    }))
  );

  await Promise.all(
    admins.map(async (admin) => {
      const nextLoanIds = assignmentGroups.get(admin.userName) || [];
      admin.casesAssigned = mergeAssignedCases(admin.casesAssigned, nextLoanIds);
      return admin.save();
    })
  );

  return true;
};

const _reAssignPreTask = async (data) => {
  let adminCases = data.casesSelected.flat(1);

  let oldAdmin = await Admins.findOne({ userName: data.oldAdmin.userName });

  let newAdmin = await Admins.findOne({ userName: data.newAdmin.userName });

  let ids = adminCases.map((cas) => cas.ID);

  await Loans.updateMany(
    { ID: { $in: ids } },
    {
      $set: {
        preCollOfficer: data.newAdmin.userName,
      },
    }
  );

  oldAdmin.casesAssigned = (oldAdmin.casesAssigned || []).filter(
    (cas) => !ids.includes(cas.loanId)
  );
  newAdmin.casesAssigned = mergeAssignedCases(newAdmin.casesAssigned, ids);

  let savedUser = await newAdmin.save();

  if (newAdmin.userId !== oldAdmin.userId) {
    let savedOld = await oldAdmin.save();
  }

  if (savedUser) return true;

  if (!savedUser) return false;
};

module.exports = { _assignPreTask, _reAssignPreTask };
