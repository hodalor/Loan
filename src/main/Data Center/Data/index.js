import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

const toStartOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const toEndOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
};

const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDateInput = (value) => {
  const date = toStartOfDay(value);
  return date ? date.toISOString().slice(0, 10) : "";
};

const formatDueDateLabel = (value) => {
  const date = toStartOfDay(value);
  if (!date) return "-";
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate()
  ).padStart(2, "0")}`;
};

const formatAmount = (value = 0) => toNumber(value).toFixed(2);
const formatPercent = (value = 0) => `${toNumber(value).toFixed(2)}%`;

const formatDayLabel = (offset) => `DAY${offset >= 0 ? offset : offset}`;

const getPaymentEvents = (loan = {}) => {
  const events = (Array.isArray(loan.paymentRecords) ? loan.paymentRecords : [])
    .map((record, index) => {
      const paidDate = toStartOfDay(record?.datePaid);
      const amountPaid = toNumber(record?.amountPaid);

      if (!paidDate || amountPaid <= 0) return null;

      return {
        id: `${loan.ID || loan.loanId || "loan"}-event-${index}`,
        paidDate,
        amountPaid,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.paidDate - right.paidDate);

  if (events.length > 0) return events;

  const fallbackPaidDate = toStartOfDay(loan.dp);
  const fallbackAmountPaid = toNumber(loan.amountPaid);

  if (!fallbackPaidDate || fallbackAmountPaid <= 0) return [];

  return [
    {
      id: `${loan.ID || loan.loanId || "loan"}-fallback`,
      paidDate: fallbackPaidDate,
      amountPaid: fallbackAmountPaid,
    },
  ];
};

const buildRecoveryRows = ({
  loans = [],
  startDate,
  endDate,
  startOffset,
  endOffset,
  mode = "percentage",
}) => {
  const normalizedStart = toStartOfDay(startDate);
  const normalizedEnd = toEndOfDay(endDate);

  if (!normalizedStart || !normalizedEnd || startOffset > endOffset) {
    return { columns: [], rows: [] };
  }

  const offsets = [];
  for (let offset = startOffset; offset <= endOffset; offset += 1) {
    offsets.push(offset);
  }

  const dueDateMap = new Map();
  const today = toStartOfDay(new Date());

  (Array.isArray(loans) ? loans : []).forEach((loan) => {
    const grantDate = toStartOfDay(loan?.dod || loan?.doa);
    const dueDate = toStartOfDay(loan?.dop);
    const repaymentAmount = toNumber(loan?.repaymentAmount);

    if (!grantDate || !dueDate || repaymentAmount <= 0) return;
    if (dueDate < normalizedStart || dueDate > normalizedEnd) return;

    const dueKey = dueDate.toISOString().slice(0, 10);
    const existing =
      dueDateMap.get(dueKey) || {
        id: dueKey,
        dueDate,
        grantDate,
        totalRepayment: 0,
        totalRecovered: 0,
        loans: [],
      };

    existing.grantDate = existing.grantDate < grantDate ? existing.grantDate : grantDate;
    existing.totalRepayment += repaymentAmount;
    existing.totalRecovered += toNumber(loan?.amountPaid);
    existing.loans.push({
      ...loan,
      grantDate,
      dueDate,
      repaymentAmount,
      paymentEvents: getPaymentEvents(loan),
    });
    dueDateMap.set(dueKey, existing);
  });

  const columns = [
    { key: "dueDateLabel", label: "Due Date", cellClassName: "font-semibold text-slate-900" },
    {
      key: mode === "percentage" ? "totalRecovery" : "totalRecovered",
      label: mode === "percentage" ? "Total Recovery" : "Total Collected",
      cellClassName: "font-semibold text-slate-900",
    },
    ...offsets.map((offset) => ({
      key: `day_${offset}`,
      label: formatDayLabel(offset),
    })),
  ];

  const rows = [...dueDateMap.values()]
    .sort((left, right) => right.dueDate - left.dueDate)
    .map((cohort) => {
      const row = {
        id: cohort.id,
        dueDateLabel: formatDueDateLabel(cohort.dueDate),
        totalRecovery:
          cohort.totalRepayment > 0
            ? formatPercent((cohort.totalRecovered / cohort.totalRepayment) * 100)
            : formatPercent(0),
        totalRecovered: formatAmount(cohort.totalRecovered),
      };

      offsets.forEach((offset) => {
        const thresholdDate = new Date(cohort.dueDate);
        thresholdDate.setDate(thresholdDate.getDate() + offset);
        thresholdDate.setHours(23, 59, 59, 999);

        if (today && thresholdDate > toEndOfDay(today)) {
          row[`day_${offset}`] = "";
          return;
        }

        let cohortRecoveredAtOffset = 0;
        let hasVisibleLoan = false;

        cohort.loans.forEach((loan) => {
          if (thresholdDate < loan.grantDate) {
            return;
          }

          hasVisibleLoan = true;
          loan.paymentEvents.forEach((event) => {
            if (event.paidDate <= thresholdDate) {
              cohortRecoveredAtOffset += event.amountPaid;
            }
          });
        });

        if (!hasVisibleLoan) {
          row[`day_${offset}`] = "";
          return;
        }

        row[`day_${offset}`] =
          mode === "percentage"
            ? formatPercent(
                cohort.totalRepayment > 0
                  ? (cohortRecoveredAtOffset / cohort.totalRepayment) * 100
                  : 0
              )
            : formatAmount(cohortRecoveredAtOffset);
      });

      return row;
    });

  return { columns, rows };
};

export default function RecoveryDataCenter() {
  const { loans, globalLoader } = React.useContext(GlobalContext);
  const [activeTab, setActiveTab] = React.useState("percentage");
  const [range, setRange] = React.useState(() => {
    const endDate = toStartOfDay(new Date());
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 30);
    return [startDate, endDate];
  });
  const [offsetRange, setOffsetRange] = React.useState({
    start: -1,
    end: 30,
  });

  const [startDate, endDate] = range;

  const matrix = React.useMemo(
    () =>
      buildRecoveryRows({
        loans,
        startDate,
        endDate,
        startOffset: Number(offsetRange.start),
        endOffset: Number(offsetRange.end),
        mode: activeTab,
      }),
    [activeTab, endDate, loans, offsetRange.end, offsetRange.start, startDate]
  );

  const totalBaseAmount = React.useMemo(
    () =>
      (Array.isArray(loans) ? loans : []).reduce(
        (sum, loan) => sum + toNumber(loan?.repaymentAmount),
        0
      ),
    [loans]
  );

  const handleExport = () => {
    if (!matrix.rows.length) return;

    const header = matrix.columns.map((column) => column.label).join(",");
    const csvRows = matrix.rows.map((row) =>
      matrix.columns
        .map((column) => `"${String(row[column.key] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([[header, ...csvRows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recovery-data-${activeTab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recovery Data</h3>
            <p className="text-sm text-slate-500">
              Cohort view from granted date to due and overdue days, with export by filtered date range.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="app-chip">{matrix.rows.length} due-date rows</div>
            <button
              type="button"
              className="app-btn-secondary gap-2"
              disabled={!matrix.rows.length}
              onClick={handleExport}
            >
              <i className="fa fa-download text-xs" />
              Export
            </button>
          </div>
        </div>

        <div className="app-panel-body space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                View
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {activeTab === "percentage" ? "Recovery Percentage" : "Recovery Amount"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Base Repayment
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                GHC{formatAmount(totalBaseAmount)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Day Window
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {formatDayLabel(Number(offsetRange.start))} to {formatDayLabel(Number(offsetRange.end))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_140px_140px_auto]">
            <div>
              <label className="app-label">Due Date Start</label>
              <input
                type="date"
                className="app-input"
                value={formatDateInput(startDate)}
                onChange={(event) =>
                  setRange(([_, currentEnd]) => [new Date(event.target.value), currentEnd])
                }
              />
            </div>
            <div>
              <label className="app-label">Due Date End</label>
              <input
                type="date"
                className="app-input"
                value={formatDateInput(endDate)}
                onChange={(event) =>
                  setRange(([currentStart]) => [currentStart, new Date(event.target.value)])
                }
              />
            </div>
            <div>
              <label className="app-label">From Day</label>
              <input
                type="number"
                className="app-input"
                value={offsetRange.start}
                onChange={(event) =>
                  setOffsetRange((current) => ({
                    ...current,
                    start: Number(event.target.value || 0),
                  }))
                }
              />
            </div>
            <div>
              <label className="app-label">To Day</label>
              <input
                type="number"
                className="app-input"
                value={offsetRange.end}
                onChange={(event) =>
                  setOffsetRange((current) => ({
                    ...current,
                    end: Number(event.target.value || 0),
                  }))
                }
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="app-btn-secondary"
                onClick={() => {
                  const today = toStartOfDay(new Date());
                  const start = new Date(today);
                  start.setDate(today.getDate() - 30);
                  setRange([start, today]);
                  setOffsetRange({ start: -1, end: 30 });
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-slate-200">
            {[
              { id: "percentage", label: "Percentage" },
              { id: "amount", label: "Amount" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-1 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-blue-600 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-500">
            The matrix groups loans by due date, starts counting from the granted date, keeps future days blank,
            and shows recovery progression into overdue days.
          </p>

          {globalLoader ? <div className="text-sm text-slate-500">Loading data center view...</div> : null}

          <SimpleDataTable
            columns={matrix.columns}
            rows={matrix.rows}
            rowKey="id"
            dense
            pageSize={20}
            emptyMessage="No recovery data found for the selected due-date range."
            tableClassName="whitespace-nowrap"
          />
        </div>
      </section>
    </div>
  );
}
