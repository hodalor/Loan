const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toTimestamp = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const normalizeLoanId = (loan = {}) =>
  String(loan?.ID || loan?.loanId || loan?._id || "")
    .trim();

const mergeUniqueBy = (left = [], right = [], buildKey = () => "") => {
  const seen = new Set();

  return [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])].filter(
    (item, index) => {
      const key = buildKey(item, index);
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
  );
};

const pickPreferredLoan = (left = {}, right = {}) => {
  const leftPaid = toNumber(left?.amountPaid);
  const rightPaid = toNumber(right?.amountPaid);
  const leftPayments = Array.isArray(left?.paymentRecords) ? left.paymentRecords.length : 0;
  const rightPayments = Array.isArray(right?.paymentRecords) ? right.paymentRecords.length : 0;
  const leftRecency = Math.max(
    toTimestamp(left?.updatedAt),
    toTimestamp(left?.dp),
    toTimestamp(left?.dod),
    toTimestamp(left?.dop),
    toTimestamp(left?.doa),
    toTimestamp(left?.createdAt)
  );
  const rightRecency = Math.max(
    toTimestamp(right?.updatedAt),
    toTimestamp(right?.dp),
    toTimestamp(right?.dod),
    toTimestamp(right?.dop),
    toTimestamp(right?.doa),
    toTimestamp(right?.createdAt)
  );

  if (rightPaid !== leftPaid) return rightPaid > leftPaid ? right : left;
  if (rightPayments !== leftPayments) return rightPayments > leftPayments ? right : left;
  return rightRecency >= leftRecency ? right : left;
};

const mergeLoan = (left = {}, right = {}) => {
  const preferred = pickPreferredLoan(left, right);
  const fallback = preferred === left ? right : left;
  const mergedPaymentRecords = mergeUniqueBy(
    left?.paymentRecords,
    right?.paymentRecords,
    (item, index) => `${toTimestamp(item?.datePaid)}|${toNumber(item?.amountPaid)}|${index}`
  );
  const mergedAmountPaid = Math.max(
    toNumber(left?.amountPaid),
    toNumber(right?.amountPaid),
    mergedPaymentRecords.reduce((sum, item) => sum + toNumber(item?.amountPaid), 0)
  );

  return {
    ...fallback,
    ...preferred,
    ID: normalizeLoanId(preferred) || normalizeLoanId(fallback),
    amountPaid: `${mergedAmountPaid || 0}`,
    paymentRecords: mergedPaymentRecords,
    preCollCallRecords: mergeUniqueBy(
      left?.preCollCallRecords,
      right?.preCollCallRecords,
      (item) => `${toTimestamp(item?.callDate)}|${item?.calledNumber || ""}|${item?.preCollOfficer || ""}`
    ),
    collCallRecords: mergeUniqueBy(
      left?.collCallRecords,
      right?.collCallRecords,
      (item) => `${toTimestamp(item?.callDate)}|${item?.calledNumber || ""}|${item?.collOfficer || ""}`
    ),
  };
};

const _sortLoans = async (loans) => {
  const grouped = new Map();
  const lon =
    loans === undefined || loans === null || loans.length === 0
      ? []
      : loans.map((item) => {
          const normalized = {
            ...item,
            ID: normalizeLoanId(item),
            doa: new Date(item.doa),
          };
          const key = normalized.ID || String(item?._id || "");
          const existing = grouped.get(key);
          grouped.set(key, existing ? mergeLoan(existing, normalized) : normalized);
          return normalized;
        });

  const sortedAsc =
    lon.length === 0
      ? []
      : [...grouped.values()].sort(
          (a, b) => new Date(b.doa || b.updatedAt || 0) - new Date(a.doa || a.updatedAt || 0)
        );

  return sortedAsc;
};

export default _sortLoans;
