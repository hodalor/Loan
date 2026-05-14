import { getCalendarDayDifferenceByCountry } from "../countryTime";

const isSettledPayment = (status = "") => ["Payed", "Paid"].includes(String(status || "").trim());
const hasRecordedRepayment = (loan = {}) =>
  Number.parseFloat(loan?.amountPaid || 0) > 0 ||
  (Array.isArray(loan?.paymentRecords) && loan.paymentRecords.length > 0);
const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildCustomerLookup = (customers = []) =>
  new Map(
    (Array.isArray(customers) ? customers : []).map((customer) => [
      String(customer?.userId || ""),
      customer,
    ])
  );

const getLoanCountryProfile = (loan = {}, customerLookup = new Map()) =>
  customerLookup.get(String(loan?.userId || "")) || {};

const toValidDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getLatestCallRecordBeforePayment = (records = [], field = "", paidDate = null) => {
  if (!paidDate) return null;

  return (Array.isArray(records) ? records : [])
    .map((record) => ({
      ...record,
      _callDate: toValidDate(record?.callDate),
    }))
    .filter((record) => record._callDate && record._callDate <= paidDate && String(record?.[field] || "").trim())
    .sort((left, right) => right._callDate - left._callDate)[0] || null;
};

const normalizePaymentEvents = (loan = {}) => {
  const events = (Array.isArray(loan?.paymentRecords) ? loan.paymentRecords : [])
    .map((record, index) => {
      const paidDate = toValidDate(record?.datePaid);
      const amountPaid = toNumber(record?.amountPaid);

      if (!paidDate || amountPaid <= 0) return null;

      return {
        id: `${loan.ID || loan.loanId || "loan"}-payment-${index}`,
        paidDate,
        amountPaid,
      };
    })
    .filter(Boolean);

  if (events.length > 0) {
    return events.sort((left, right) => left.paidDate - right.paidDate);
  }

  const fallbackPaidDate = toValidDate(loan?.dp);
  const fallbackAmountPaid = toNumber(loan?.amountPaid);

  if (!fallbackPaidDate || fallbackAmountPaid <= 0) return [];

  return [
    {
      id: `${loan.ID || loan.loanId || "loan"}-payment-fallback`,
      paidDate: fallbackPaidDate,
      amountPaid: fallbackAmountPaid,
    },
  ];
};

const classifyPaymentEvent = (loan = {}, event = {}) => {
  const paidDate = event.paidDate;
  const latestPreRecord = getLatestCallRecordBeforePayment(
    loan?.preCollCallRecords,
    "preCollOfficer",
    paidDate
  );
  const latestCollectionRecord = getLatestCallRecordBeforePayment(
    loan?.collCallRecords,
    "collOfficer",
    paidDate
  );

  if (
    latestCollectionRecord &&
    (!latestPreRecord || latestCollectionRecord._callDate >= latestPreRecord._callDate)
  ) {
    return {
      department: "collection",
      officerField: "collofficer",
      officerName:
        latestCollectionRecord.collOfficer || loan?.collofficer || "",
    };
  }

  if (latestPreRecord) {
    return {
      department: "pre-collection",
      officerField: "preCollOfficer",
      officerName:
        latestPreRecord.preCollOfficer || loan?.preCollOfficer || "",
    };
  }

  return {
    department: "direct",
    officerField: "",
    officerName: "",
  };
};

const buildDepartmentPaymentSummaries = (loan = {}) => {
  if (!hasRecordedRepayment(loan)) return [];
  if (loan?.clearanceRecord?.recordType === "balance") return [];

  const paymentEvents = normalizePaymentEvents(loan).map((event) => ({
    ...event,
    ...classifyPaymentEvent(loan, event),
  }));

  const repaymentAmount = toNumber(loan?.repaymentAmount);
  const aggregated = paymentEvents.reduce((accumulator, event) => {
    if (event.department === "direct") return accumulator;

    const current = accumulator[event.department] || {
      ...loan,
      id: `${loan.ID}-${event.department}`,
      paymentDepartment: event.department,
      amountPaid: 0,
      dp: event.paidDate,
      preCollOfficer: "",
      collofficer: "",
      departmentPaymentStatus: "partial",
      paymentEvents: [],
    };

    current.amountPaid += event.amountPaid;
    current.dp = current.dp > event.paidDate ? current.dp : event.paidDate;
    current.paymentEvents = [...current.paymentEvents, event];

    if (event.department === "pre-collection") {
      current.preCollOfficer = event.officerName || current.preCollOfficer || loan?.preCollOfficer || "";
    }

    if (event.department === "collection") {
      current.collofficer = event.officerName || current.collofficer || loan?.collofficer || "";
    }

    accumulator[event.department] = current;
    return accumulator;
  }, {});

  const lastMeaningfulEvent = [...paymentEvents]
    .filter((event) => event.department !== "direct")
    .sort((left, right) => right.paidDate - left.paidDate)[0];

  return Object.values(aggregated).map((summary) => ({
    ...summary,
    overallAmountPaid: toNumber(loan?.amountPaid).toFixed(2),
    amountPaid: summary.amountPaid.toFixed(2),
    departmentPaymentStatus:
      isSettledPayment(loan?.paymentStatus) &&
      lastMeaningfulEvent?.department === summary.paymentDepartment &&
      toNumber(loan?.amountPaid) + 0.009 >= repaymentAmount
        ? "full"
        : "partial",
  }));
};

const _getPreColLoans = async (loanData, customers = []) => {
  var loans = [];
  const customerLookup = buildCustomerLookup(customers);

  if (loanData === undefined || loanData.length === 0) return (loans = []);

  loanData.forEach((loan) => {
    if (loan.caseStatus !== "Completed") {
      const actDur = getCalendarDayDifferenceByCountry(
        loan.dop,
        new Date(),
        getLoanCountryProfile(loan, customerLookup)
      );

      if (actDur >= 0 && actDur <= 2) {
        loan.dur = actDur;
        loans.push(loan);
      }
    }
  });

  return loans;
};

const _getColLoans = async (loanData, customers = []) => {
  var loans = [];
  const customerLookup = buildCustomerLookup(customers);

  if (loanData === undefined || loanData.length === 0) return (loans = []);

  loanData.forEach((loan) => {
    if (loan.caseStatus !== "Completed" && loan.loanStatus !== "Review") {
      const actDur = getCalendarDayDifferenceByCountry(
        loan.dop,
        new Date(),
        getLoanCountryProfile(loan, customerLookup)
      );

      if (actDur < 0) {
        loan.dur = actDur;
        loans.push(loan);
      }
    }
  });

  return loans;
};

const _getPreColPayRecs = async (loanData) => {
  if (loanData === undefined || loanData.length === 0) return [];

  return loanData
    .flatMap((loan) => buildDepartmentPaymentSummaries(loan))
    .filter((loan) => loan.paymentDepartment === "pre-collection");
};

const _getColPayRecs = async (loanData) => {
  if (loanData === undefined || loanData.length === 0) return [];

  return loanData
    .flatMap((loan) => buildDepartmentPaymentSummaries(loan))
    .filter((loan) => loan.paymentDepartment === "collection");
};

export { _getPreColLoans, _getColLoans, _getPreColPayRecs, _getColPayRecs };
