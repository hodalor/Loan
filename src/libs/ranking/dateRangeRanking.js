const DAY_IN_MS = 1000 * 60 * 60 * 24;

const toStartOfDay = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const toEndOfDay = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
};

const formatDateKey = (value = new Date()) => {
  const date = toStartOfDay(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
};

const formatColumnLabel = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getRangeDates = (startDate, endDate) => {
  const normalizedStart = toStartOfDay(startDate);
  const normalizedEnd = toStartOfDay(endDate);

  if (!normalizedStart || !normalizedEnd || normalizedStart > normalizedEnd) {
    return [];
  }

  const dates = [];
  for (
    let time = normalizedStart.getTime();
    time <= normalizedEnd.getTime();
    time += DAY_IN_MS
  ) {
    dates.push(new Date(time));
  }

  return dates;
};

const getDefaultDateRange = (days = 7) => {
  const endDate = toStartOfDay(new Date());
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - Math.max(0, days - 1));
  return [startDate, endDate];
};

const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const isSettledPaymentStatus = (status = "") =>
  ["Paid", "Payed"].includes(String(status || "").trim());

const getPaymentProgressType = (item = {}) => {
  const repaymentAmount = toNumber(item?.repaymentAmount);
  const amountPaid = toNumber(item?.amountPaid);

  if (amountPaid <= 0) return "none";
  if (
    isSettledPaymentStatus(item?.paymentStatus) ||
    item?.caseStatus === "Completed" ||
    (repaymentAmount > 0 && amountPaid + 0.009 >= repaymentAmount)
  ) {
    return "full";
  }

  return "partial";
};

const matchesPaymentFilter = (item = {}, paymentFilter = "all") => {
  const type = getPaymentProgressType(item);

  if (paymentFilter === "partial") return type === "partial";
  if (paymentFilter === "full") return type === "full";
  return type !== "none";
};

const formatPercent = (value = 0) => `${toNumber(value).toFixed(2)}%`;

const buildRankingTable = ({
  data = [],
  startDate,
  endDate,
  officerField = "userName",
  mode = "amount",
  paymentFilter = "all",
}) => {
  const normalizedStart = toStartOfDay(startDate);
  const normalizedEnd = toEndOfDay(endDate);
  const rangeDates = getRangeDates(startDate, endDate);
  const columnDates = rangeDates.map((date) => ({
    key: formatDateKey(date),
    label: formatColumnLabel(date),
  }));

  const columns = [
    { key: "rank", label: "Rank", cellClassName: "font-semibold text-slate-900" },
    { key: "userName", label: "User Name", cellClassName: "font-semibold text-slate-900" },
    ...columnDates.map((column) => ({ key: column.key, label: column.label })),
    { key: "total", label: "Total" },
  ];

  if (!normalizedStart || !normalizedEnd || rangeDates.length === 0) {
    return { columns, rows: [] };
  }

  const rankMap = new Map();

  (Array.isArray(data) ? data : []).forEach((item) => {
    const officerName = String(item?.[officerField] || "").trim();
    const paidDate = item?.dp ? new Date(item.dp) : null;

    if (!officerName || !paidDate || Number.isNaN(paidDate.getTime())) return;
    if (paidDate < normalizedStart || paidDate > normalizedEnd) return;
    if (!matchesPaymentFilter(item, paymentFilter)) return;

    const dayKey = formatDateKey(paidDate);
    const existing =
      rankMap.get(officerName) ||
      {
        userName: officerName,
        totalValue: 0,
        values: Object.fromEntries(columnDates.map((column) => [column.key, 0])),
      };

    const nextValue = mode === "cases" ? 1 : toNumber(item?.amountPaid);
    existing.values[dayKey] = toNumber(existing.values[dayKey]) + nextValue;
    existing.totalValue += nextValue;
    rankMap.set(officerName, existing);
  });

  const rows = [...rankMap.values()]
    .sort((left, right) => right.totalValue - left.totalValue || left.userName.localeCompare(right.userName))
    .map((item, index) => {
      const dayValues = Object.fromEntries(
        columnDates.map((column) => [
          column.key,
          mode === "cases"
            ? Math.round(toNumber(item.values[column.key]))
            : toNumber(item.values[column.key]).toFixed(2),
        ])
      );

      return {
        id: `${item.userName}-${index}`,
        rank: index + 1,
        userName: item.userName,
        ...dayValues,
        total: mode === "cases" ? Math.round(item.totalValue) : item.totalValue.toFixed(2),
      };
    });

  return { columns, rows };
};

const buildPercentageRankingTable = ({
  assignedData = [],
  collectedData = [],
  startDate,
  endDate,
  officerField = "userName",
  mode = "amount",
  paymentFilter = "all",
}) => {
  const normalizedStart = toStartOfDay(startDate);
  const normalizedEnd = toEndOfDay(endDate);

  const columns =
    mode === "amount"
      ? [
          { key: "rank", label: "Rank", cellClassName: "font-semibold text-slate-900" },
          { key: "userName", label: "User Name", cellClassName: "font-semibold text-slate-900" },
          { key: "assignedAmount", label: "Assigned Amount" },
          { key: "collectedAmount", label: "Collected Amount" },
          { key: "percentage", label: "% Collected" },
        ]
      : [
          { key: "rank", label: "Rank", cellClassName: "font-semibold text-slate-900" },
          { key: "userName", label: "User Name", cellClassName: "font-semibold text-slate-900" },
          { key: "assignedCases", label: "Assigned Cases" },
          { key: "collectedCases", label: "Collected Cases" },
          { key: "percentage", label: "% Collected" },
        ];

  if (!normalizedStart || !normalizedEnd) {
    return { columns, rows: [] };
  }

  const rankMap = new Map();

  (Array.isArray(assignedData) ? assignedData : []).forEach((item) => {
    const officerName = String(item?.[officerField] || "").trim();
    const dueDate = item?.dop ? new Date(item.dop) : null;

    if (!officerName || !dueDate || Number.isNaN(dueDate.getTime())) return;
    if (dueDate < normalizedStart || dueDate > normalizedEnd) return;

    const existing =
      rankMap.get(officerName) ||
      {
        userName: officerName,
        assignedAmount: 0,
        collectedAmount: 0,
        assignedCases: 0,
        collectedCases: 0,
      };

    existing.assignedAmount += toNumber(item?.repaymentAmount);
    existing.assignedCases += 1;
    rankMap.set(officerName, existing);
  });

  (Array.isArray(collectedData) ? collectedData : []).forEach((item) => {
    const officerName = String(item?.[officerField] || "").trim();
    const paidDate = item?.dp ? new Date(item.dp) : null;

    if (!officerName || !paidDate || Number.isNaN(paidDate.getTime())) return;
    if (paidDate < normalizedStart || paidDate > normalizedEnd) return;
    if (!matchesPaymentFilter(item, paymentFilter)) return;

    const existing =
      rankMap.get(officerName) ||
      {
        userName: officerName,
        assignedAmount: 0,
        collectedAmount: 0,
        assignedCases: 0,
        collectedCases: 0,
      };

    existing.collectedAmount += toNumber(item?.amountPaid);
    existing.collectedCases += 1;
    rankMap.set(officerName, existing);
  });

  const rows = [...rankMap.values()]
    .filter((item) => item.assignedCases > 0 || item.collectedCases > 0)
    .sort((left, right) => {
      const leftValue =
        mode === "amount"
          ? left.assignedAmount > 0
            ? (left.collectedAmount / left.assignedAmount) * 100
            : 0
          : left.assignedCases > 0
          ? (left.collectedCases / left.assignedCases) * 100
          : 0;
      const rightValue =
        mode === "amount"
          ? right.assignedAmount > 0
            ? (right.collectedAmount / right.assignedAmount) * 100
            : 0
          : right.assignedCases > 0
          ? (right.collectedCases / right.assignedCases) * 100
          : 0;

      return rightValue - leftValue || left.userName.localeCompare(right.userName);
    })
    .map((item, index) => {
      const percentage =
        mode === "amount"
          ? item.assignedAmount > 0
            ? (item.collectedAmount / item.assignedAmount) * 100
            : 0
          : item.assignedCases > 0
          ? (item.collectedCases / item.assignedCases) * 100
          : 0;

      return {
        id: `${item.userName}-${mode}-${index}`,
        rank: index + 1,
        userName: item.userName,
        assignedAmount: item.assignedAmount.toFixed(2),
        collectedAmount: item.collectedAmount.toFixed(2),
        assignedCases: item.assignedCases,
        collectedCases: item.collectedCases,
        percentage: formatPercent(percentage),
        total: formatPercent(percentage),
      };
    });

  return { columns, rows };
};

export {
  buildPercentageRankingTable,
  buildRankingTable,
  formatPercent,
  getDefaultDateRange,
  getPaymentProgressType,
  matchesPaymentFilter,
};
