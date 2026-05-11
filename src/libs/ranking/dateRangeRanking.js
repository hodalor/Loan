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

const buildRankingTable = ({
  data = [],
  startDate,
  endDate,
  officerField = "userName",
  mode = "amount",
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

export { buildRankingTable, getDefaultDateRange };
