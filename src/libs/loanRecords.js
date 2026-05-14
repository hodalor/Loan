const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toTimestamp = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const normalizeLoanBusinessId = (valueOrLoan = "") => {
  if (typeof valueOrLoan === "string") {
    return String(valueOrLoan || "").trim();
  }

  return String(
    valueOrLoan?.ID || valueOrLoan?.loanId || valueOrLoan?._id || ""
  ).trim();
};

const mergeUniqueBy = (left = [], right = [], buildKey = () => "") => {
  const items = [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])];
  const seen = new Set();

  return items.filter((item, index) => {
    const key = buildKey(item, index);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getLoanRecencyScore = (loan = {}) =>
  Math.max(
    toTimestamp(loan?.updatedAt),
    toTimestamp(loan?.dp),
    toTimestamp(loan?.dod),
    toTimestamp(loan?.dop),
    toTimestamp(loan?.doa),
    toTimestamp(loan?.createdAt)
  );

const pickPreferredLoan = (left = {}, right = {}) => {
  const leftPaid = toNumber(left?.amountPaid);
  const rightPaid = toNumber(right?.amountPaid);
  const leftPayments = Array.isArray(left?.paymentRecords) ? left.paymentRecords.length : 0;
  const rightPayments = Array.isArray(right?.paymentRecords) ? right.paymentRecords.length : 0;
  const leftRecency = getLoanRecencyScore(left);
  const rightRecency = getLoanRecencyScore(right);

  if (rightPaid !== leftPaid) return rightPaid > leftPaid ? right : left;
  if (rightPayments !== leftPayments) return rightPayments > leftPayments ? right : left;
  return rightRecency >= leftRecency ? right : left;
};

const mergeLoanRecords = (left = {}, right = {}) => {
  const preferred = pickPreferredLoan(left, right);
  const fallback = preferred === left ? right : left;
  const businessId = normalizeLoanBusinessId(preferred) || normalizeLoanBusinessId(fallback);
  const mergedPaymentRecords = mergeUniqueBy(
    left?.paymentRecords,
    right?.paymentRecords,
    (item, index) =>
      `${toTimestamp(item?.datePaid)}|${toNumber(item?.amountPaid)}|${index}`
  );
  const mergedAmountPaid = Math.max(
    toNumber(left?.amountPaid),
    toNumber(right?.amountPaid),
    mergedPaymentRecords.reduce((sum, item) => sum + toNumber(item?.amountPaid), 0)
  );
  const mergedRepaymentAmount = Math.max(
    toNumber(left?.repaymentAmount),
    toNumber(right?.repaymentAmount)
  );

  const merged = {
    ...fallback,
    ...preferred,
    ID: businessId,
    loanId:
      normalizeLoanBusinessId(preferred?.loanId) ||
      normalizeLoanBusinessId(fallback?.loanId) ||
      businessId,
    amount: `${Math.max(toNumber(left?.amount), toNumber(right?.amount)) || 0}`,
    repaymentAmount: `${mergedRepaymentAmount || 0}`,
    amountPaid: `${mergedAmountPaid || 0}`,
    dp:
      toTimestamp(left?.dp) > toTimestamp(right?.dp)
        ? left?.dp || right?.dp
        : right?.dp || left?.dp,
    dod:
      toTimestamp(left?.dod) > toTimestamp(right?.dod)
        ? left?.dod || right?.dod
        : right?.dod || left?.dod,
    dop:
      toTimestamp(left?.dop) > toTimestamp(right?.dop)
        ? left?.dop || right?.dop
        : right?.dop || left?.dop,
    doa:
      toTimestamp(left?.doa) && toTimestamp(right?.doa)
        ? toTimestamp(left?.doa) <= toTimestamp(right?.doa)
          ? left?.doa
          : right?.doa
        : left?.doa || right?.doa,
    paymentRecords: mergedPaymentRecords,
    preCollCallRecords: mergeUniqueBy(
      left?.preCollCallRecords,
      right?.preCollCallRecords,
      (item) =>
        `${toTimestamp(item?.callDate)}|${item?.calledNumber || ""}|${item?.preCollOfficer || ""}|${item?.remarks || ""}`
    ),
    collCallRecords: mergeUniqueBy(
      left?.collCallRecords,
      right?.collCallRecords,
      (item) =>
        `${toTimestamp(item?.callDate)}|${item?.calledNumber || ""}|${item?.collOfficer || ""}|${item?.remarks || ""}`
    ),
    auditCallRecords: mergeUniqueBy(
      left?.auditCallRecords,
      right?.auditCallRecords,
      (item) =>
        `${toTimestamp(item?.callDate)}|${item?.calledNumber || ""}|${item?.auditOfficer || ""}|${item?.remarks || ""}`
    ),
    extRecords: mergeUniqueBy(
      left?.extRecords,
      right?.extRecords,
      (item) =>
        `${item?.loanId || ""}|${item?.extPeriod || ""}|${toTimestamp(item?.extExpDate)}|${toTimestamp(item?.createdAt)}`
    ),
    contacts: mergeUniqueBy(
      left?.contacts,
      right?.contacts,
      (item) => `${item?.name || ""}|${item?.number || ""}`
    ),
  };

  if (mergedRepaymentAmount > 0 && mergedAmountPaid + 0.009 >= mergedRepaymentAmount) {
    merged.paymentStatus = "Paid";
    merged.caseStatus = "Completed";
    merged.isNewLoan = false;
  }

  return merged;
};

const dedupeLoanRecords = (loans = []) => {
  const grouped = new Map();

  (Array.isArray(loans) ? loans : []).forEach((loan) => {
    const key = normalizeLoanBusinessId(loan) || String(loan?._id || "");
    if (!key) return;

    const existing = grouped.get(key);
    grouped.set(key, existing ? mergeLoanRecords(existing, loan) : { ...loan, ID: key });
  });

  return [...grouped.values()].sort(
    (left, right) => getLoanRecencyScore(right) - getLoanRecencyScore(left)
  );
};

module.exports = {
  dedupeLoanRecords,
  mergeLoanRecords,
  normalizeLoanBusinessId,
};
