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
const parseDisplayValue = (value = "") => toNumber(String(value).replace("%", ""));

const formatDayLabel = (offset) => `DAY${offset >= 0 ? offset : offset}`;

const isPercentMode = (mode = "") =>
  mode === "percentage" || mode === "remainingPercentage";

const isRemainingMode = (mode = "") =>
  mode === "remainingAmount" || mode === "remainingPercentage";

const getHeatmapStyle = (value = "", mode = "percentage") => {
  if (value === "" || value === "-") {
    return "bg-transparent text-slate-400";
  }

  const numericValue = parseDisplayValue(value);
  const ratio =
    isPercentMode(mode)
      ? Math.max(0, Math.min(1, numericValue / 100))
      : Math.max(0, Math.min(1, numericValue / 1000));

  if (ratio <= 0) return "bg-slate-100 text-slate-500";
  if (ratio < 0.2) return "bg-emerald-50 text-emerald-700";
  if (ratio < 0.4) return "bg-emerald-100 text-emerald-700";
  if (ratio < 0.6) return "bg-emerald-200 text-emerald-800";
  if (ratio < 0.8) return "bg-emerald-400 text-white";
  return "bg-emerald-500 text-white";
};

const getLoanOfficerPool = (loan = {}) =>
  [
    loan?.preCollOfficer,
    loan?.collofficer,
    loan?.officer,
    loan?.loanOfficer,
    loan?.userName,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

const getPaymentEvents = (loan = {}) => {
  const repaymentTarget = toNumber(loan?.repaymentAmount);
  const rawEvents = (Array.isArray(loan.paymentRecords) ? loan.paymentRecords : [])
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

  const seen = new Set();
  const events = [];
  let runningApplied = 0;

  rawEvents.forEach((event) => {
    const dedupeKey = `${event.paidDate.toISOString()}|${event.amountPaid.toFixed(2)}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    let nextAmount = event.amountPaid;
    const remaining = repaymentTarget > 0 ? Math.max(repaymentTarget - runningApplied, 0) : nextAmount;

    if (repaymentTarget > 0) {
      if (nextAmount > remaining && nextAmount > runningApplied) {
        const snapshotIncrement = nextAmount - runningApplied;
        if (snapshotIncrement > 0 && snapshotIncrement <= remaining + 0.009) {
          nextAmount = snapshotIncrement;
        } else {
          nextAmount = remaining;
        }
      } else {
        nextAmount = Math.min(nextAmount, remaining);
      }
    }

    if (nextAmount <= 0) return;

    runningApplied += nextAmount;
    events.push({
      ...event,
      amountPaid: nextAmount,
    });
  });

  if (events.length > 0) return events;

  const fallbackPaidDate = toStartOfDay(loan.dp);
  const fallbackAmountPaid = toNumber(loan.amountPaid);

  if (!fallbackPaidDate || fallbackAmountPaid <= 0) return [];

  return [
    {
      id: `${loan.ID || loan.loanId || "loan"}-fallback`,
      paidDate: fallbackPaidDate,
      amountPaid:
        repaymentTarget > 0 ? Math.min(fallbackAmountPaid, repaymentTarget) : fallbackAmountPaid,
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
    const recoveredForLoan = Math.min(
      repaymentAmount,
      getPaymentEvents(loan).reduce((sum, event) => sum + toNumber(event.amountPaid), 0)
    );

    existing.totalRecovered += recoveredForLoan;
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
      key: isRemainingMode(mode)
        ? isPercentMode(mode)
          ? "totalRemaining"
          : "totalRemainingAmount"
        : isPercentMode(mode)
          ? "totalRecovery"
          : "totalRecovered",
      label: isRemainingMode(mode)
        ? isPercentMode(mode)
          ? "Total Remaining"
          : "Total Amount Remaining"
        : isPercentMode(mode)
          ? "Total Recovery"
          : "Total Collected",
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
        totalRemaining:
          cohort.totalRepayment > 0
            ? formatPercent(
                (Math.max(cohort.totalRepayment - cohort.totalRecovered, 0) / cohort.totalRepayment) * 100
              )
            : formatPercent(0),
        totalRemainingAmount: formatAmount(
          Math.max(cohort.totalRepayment - cohort.totalRecovered, 0)
        ),
      };

      offsets.forEach((offset) => {
        const thresholdDate = new Date(cohort.dueDate);
        thresholdDate.setDate(thresholdDate.getDate() + offset);
        const thresholdDayStart = toStartOfDay(thresholdDate);
        const thresholdDayEnd = toEndOfDay(thresholdDate);

        if (!thresholdDayStart || !thresholdDayEnd) {
          row[`day_${offset}`] = "";
          return;
        }

        if (today && thresholdDayEnd > toEndOfDay(today)) {
          row[`day_${offset}`] = "";
          return;
        }

        let cohortRecoveredAtOffset = 0;
        let hasVisibleLoan = false;

        cohort.loans.forEach((loan) => {
          if (thresholdDayStart < loan.grantDate) {
            return;
          }

          hasVisibleLoan = true;
          loan.paymentEvents.forEach((event) => {
            if (event.paidDate >= thresholdDayStart && event.paidDate <= thresholdDayEnd) {
              cohortRecoveredAtOffset += event.amountPaid;
            }
          });
        });

        if (!hasVisibleLoan) {
          row[`day_${offset}`] = "";
          return;
        }

        if (isRemainingMode(mode)) {
          let cumulativeRecoveredToOffset = 0;

          cohort.loans.forEach((loan) => {
            if (thresholdDayStart < loan.grantDate) return;

            loan.paymentEvents.forEach((event) => {
              if (event.paidDate <= thresholdDayEnd) {
                cumulativeRecoveredToOffset += event.amountPaid;
              }
            });
          });

          const remainingAmount = Math.max(cohort.totalRepayment - cumulativeRecoveredToOffset, 0);
          row[`day_${offset}`] = isPercentMode(mode)
            ? formatPercent(
                cohort.totalRepayment > 0 ? (remainingAmount / cohort.totalRepayment) * 100 : 0
              )
            : formatAmount(remainingAmount);
          return;
        }

        row[`day_${offset}`] = isPercentMode(mode)
          ? formatPercent(
              cohort.totalRepayment > 0 ? (cohortRecoveredAtOffset / cohort.totalRepayment) * 100 : 0
            )
          : formatAmount(cohortRecoveredAtOffset);
      });

      return row;
    });

  return { columns, rows };
};

export default function RecoveryDataCenter() {
  const { loans, globalLoader, user, admins, staffGroups, _hasAccess } = React.useContext(GlobalContext);
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
  const [selectedGroupId, setSelectedGroupId] = React.useState("all");
  const [selectedStaff, setSelectedStaff] = React.useState("all");

  const [startDate, endDate] = range;
  const canViewEarlyWindow = _hasAccess ? _hasAccess("action:data:early-window") : false;
  const visibleStartOffset = canViewEarlyWindow
    ? Number(offsetRange.start)
    : Math.max(Number(offsetRange.start), -1);

  const groupOptions = React.useMemo(
    () =>
      [{ id: "all", groupName: "All Groups" }].concat(
        (Array.isArray(staffGroups) ? staffGroups : []).map((group) => ({
          id: String(group._id || group.id || ""),
          groupName: group.groupName || "Unnamed Group",
          members: Array.isArray(group.memberUsers) ? group.memberUsers : [],
        }))
      ),
    [staffGroups]
  );

  const selectedGroup = React.useMemo(
    () =>
      groupOptions.find((group) => group.id === selectedGroupId) || groupOptions[0] || { id: "all" },
    [groupOptions, selectedGroupId]
  );

  const staffOptions = React.useMemo(() => {
    const allAdmins = Array.isArray(admins) ? admins : [];
    const selectedGroupMembers =
      selectedGroupId === "all"
        ? allAdmins
        : allAdmins.filter((admin) =>
            (selectedGroup?.members || []).some(
              (member) =>
                String(member?._id || member?.id || member) === String(admin?._id || admin?.id || "")
            )
          );

    return [{ id: "all", userName: "All Staff" }].concat(
      selectedGroupMembers.map((admin) => ({
        id: String(admin?._id || admin?.id || ""),
        userName: admin?.userName || admin?.firstName || "Staff",
      }))
    );
  }, [admins, selectedGroup?.members, selectedGroupId]);

  const selectedStaffOption = React.useMemo(
    () =>
      staffOptions.find((member) => member.id === selectedStaff) || staffOptions[0] || { id: "all" },
    [selectedStaff, staffOptions]
  );

  const filteredLoans = React.useMemo(() => {
    let nextLoans = Array.isArray(loans) ? loans : [];

    if (selectedGroupId !== "all") {
      const groupMemberNames = new Set(
        (selectedGroup?.members || [])
          .map((member) => String(member?.userName || member?.name || "").trim())
          .filter(Boolean)
      );

      nextLoans = nextLoans.filter((loan) =>
        getLoanOfficerPool(loan).some((name) => groupMemberNames.has(name))
      );
    }

    if (selectedStaff !== "all") {
      const staffName = String(selectedStaffOption?.userName || "").trim();
      nextLoans = nextLoans.filter((loan) => getLoanOfficerPool(loan).includes(staffName));
    }

    if (!canViewEarlyWindow && user?.role) {
      return nextLoans;
    }

    return nextLoans;
  }, [canViewEarlyWindow, loans, selectedGroup?.members, selectedGroupId, selectedStaff, selectedStaffOption?.userName, user?.role]);

  const matrix = React.useMemo(
    () =>
      buildRecoveryRows({
        loans: filteredLoans,
        startDate,
        endDate,
        startOffset: visibleStartOffset,
        endOffset: Number(offsetRange.end),
        mode: activeTab,
      }),
    [activeTab, endDate, filteredLoans, offsetRange.end, startDate, visibleStartOffset]
  );

  const cohortLoans = React.useMemo(
    () =>
      filteredLoans.filter((loan) => {
        const dueDate = toStartOfDay(loan?.dop);
        const repaymentAmount = toNumber(loan?.repaymentAmount);
        return (
          dueDate &&
          dueDate >= toStartOfDay(startDate) &&
          dueDate <= toEndOfDay(endDate) &&
          repaymentAmount > 0
        );
      }),
    [endDate, filteredLoans, startDate]
  );

  const summaryTotals = React.useMemo(
    () =>
      cohortLoans.reduce(
        (totals, loan) => ({
          principal: totals.principal + toNumber(loan?.amount),
          repayment: totals.repayment + toNumber(loan?.repaymentAmount),
        }),
        { principal: 0, repayment: 0 }
      ),
    [cohortLoans]
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
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                View
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {activeTab === "percentage"
                  ? "Recovery Percentage"
                  : activeTab === "amount"
                    ? "Recovery Amount"
                    : activeTab === "remainingPercentage"
                      ? "Remaining Percentage"
                      : "Remaining Amount"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Loan Amount Base
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                GHC{formatAmount(summaryTotals.principal)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Repayment Target
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                GHC{formatAmount(summaryTotals.repayment)}
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

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="app-label">Group Filter</label>
              <select
                className="app-input"
                value={selectedGroupId}
                onChange={(event) => {
                  setSelectedGroupId(event.target.value);
                  setSelectedStaff("all");
                }}
              >
                {groupOptions.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.groupName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="app-label">Staff Filter</label>
              <select
                className="app-input"
                value={selectedStaff}
                onChange={(event) => setSelectedStaff(event.target.value)}
              >
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.userName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-slate-200">
            {[
              { id: "percentage", label: "Recovered %" },
              { id: "amount", label: "Recovered Amount" },
              { id: "remainingPercentage", label: "Remaining %" },
              { id: "remainingAmount", label: "Remaining Amount" },
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
          {!canViewEarlyWindow && Number(offsetRange.start) < -1 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Early recovery columns before DAY-1 are hidden for your access level. Super admins can assign this
              visibility with the <span className="font-semibold">View Early Recovery Window</span> permission.
            </div>
          ) : null}

          {globalLoader ? <div className="text-sm text-slate-500">Loading data center view...</div> : null}

          <SimpleDataTable
            columns={matrix.columns.map((column) => {
              if (!String(column.key).startsWith("day_")) return column;

              return {
                ...column,
                render: (row) => {
                  const value = row?.[column.key] ?? "";
                  const cellStyle = getHeatmapStyle(value, activeTab);

                  return (
                    <div
                      className={`min-w-[76px] rounded-xl px-2 py-2 text-center text-xs font-semibold ${cellStyle}`}
                    >
                      {value || "-"}
                    </div>
                  );
                },
              };
            })}
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
