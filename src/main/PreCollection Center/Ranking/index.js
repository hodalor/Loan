import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";
import {
  buildPercentageRankingTable,
  buildRankingTable,
  getDefaultDateRange,
} from "../../../libs/ranking/dateRangeRanking";
import {
  getLastMonthRange,
  getLastNDaysRange,
  getThisMonthRange,
  getTodayRange,
} from "../../../libs/ranking/datePresets";

const TAB_ITEMS = [
  { id: "amount", label: "Amount Collected" },
  { id: "cases", label: "Cases Collected" },
  { id: "amountPercentage", label: "Amount %" },
  { id: "casePercentage", label: "Cases %" },
];

const PAYMENT_FILTER_OPTIONS = [
  { value: "all", label: "All Payments" },
  { value: "partial", label: "Partial Payments" },
  { value: "full", label: "Full Payments" },
];

export default function PreCollectionRanking() {
  const { loans, prePayment, globalLoader } = React.useContext(GlobalContext);
  const [activeTab, setActiveTab] = React.useState("amount");
  const [range, setRange] = React.useState(() => getDefaultDateRange(7));
  const [paymentFilter, setPaymentFilter] = React.useState("all");

  const [startDate, endDate] = range || [];

  const amountTable = React.useMemo(
    () =>
      buildRankingTable({
        data: prePayment,
        startDate,
        endDate,
        officerField: "preCollOfficer",
        mode: "amount",
        paymentFilter,
      }),
    [endDate, paymentFilter, prePayment, startDate]
  );

  const caseTable = React.useMemo(
    () =>
      buildRankingTable({
        data: prePayment,
        startDate,
        endDate,
        officerField: "preCollOfficer",
        mode: "cases",
        paymentFilter,
      }),
    [endDate, paymentFilter, prePayment, startDate]
  );

  const amountPercentageTable = React.useMemo(
    () =>
      buildPercentageRankingTable({
        assignedData: loans.filter((loan) => String(loan?.preCollOfficer || "").trim()),
        collectedData: prePayment,
        startDate,
        endDate,
        officerField: "preCollOfficer",
        mode: "amount",
        paymentFilter,
      }),
    [endDate, loans, paymentFilter, prePayment, startDate]
  );

  const casePercentageTable = React.useMemo(
    () =>
      buildPercentageRankingTable({
        assignedData: loans.filter((loan) => String(loan?.preCollOfficer || "").trim()),
        collectedData: prePayment,
        startDate,
        endDate,
        officerField: "preCollOfficer",
        mode: "cases",
        paymentFilter,
      }),
    [endDate, loans, paymentFilter, prePayment, startDate]
  );

  const activeTable =
    activeTab === "amount"
      ? amountTable
      : activeTab === "cases"
      ? caseTable
      : activeTab === "amountPercentage"
      ? amountPercentageTable
      : casePercentageTable;
  const activeRows = activeTable.rows;
  const activeColumns = activeTable.columns;
  const topPerformer = activeRows[0];
  const bestTotalLabel =
    activeTab === "amountPercentage" || activeTab === "casePercentage"
      ? "Best Rate"
      : "Best Total";
  const bestTotalValue =
    activeTab === "amountPercentage" || activeTab === "casePercentage"
      ? topPerformer?.percentage || "0.00%"
      : topPerformer?.total ?? 0;

  const handleExport = () => {
    if (!activeRows.length) return;

    const header = activeColumns.map((column) => column.label).join(",");
    const csvRows = activeRows.map((row) =>
      activeColumns
        .map((column) => `"${String(row[column.key] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([[header, ...csvRows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `precollection-ranking-${activeTab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dateInputValue = (value) =>
    value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString().slice(0, 10) : "";

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Precollection Ranking</h3>
            <p className="text-sm text-slate-500">
              Filter amount and case ranking by any date period.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="app-chip">{activeRows.length} staff</div>
            <button type="button" className="app-btn-secondary gap-2" onClick={handleExport}>
              <i className="fa fa-download text-xs" />
              Export
            </button>
          </div>
        </div>

        <div className="app-panel-body space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top Performer</div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {topPerformer?.userName || "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{bestTotalLabel}</div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {bestTotalValue}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current View</div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {TAB_ITEMS.find((tab) => tab.id === activeTab)?.label || "Amount"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="app-label">Start Date</label>
              <input
                type="date"
                className="app-input"
                value={dateInputValue(startDate)}
                onChange={(event) =>
                  setRange(([_, currentEnd]) => [new Date(event.target.value), currentEnd])
                }
              />
            </div>
            <div>
              <label className="app-label">End Date</label>
              <input
                type="date"
                className="app-input"
                value={dateInputValue(endDate)}
                onChange={(event) =>
                  setRange(([currentStart]) => [currentStart, new Date(event.target.value)])
                }
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="app-btn-secondary"
                onClick={() => setRange(getDefaultDateRange(7))}
              >
                Last 7 Days
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="app-btn-secondary"
              onClick={() => setRange(getTodayRange())}
            >
              Today
            </button>
            <button
              type="button"
              className="app-btn-secondary"
              onClick={() => setRange(getLastNDaysRange(7))}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              className="app-btn-secondary"
              onClick={() => setRange(getThisMonthRange())}
            >
              This Month
            </button>
            <button
              type="button"
              className="app-btn-secondary"
              onClick={() => setRange(getLastMonthRange())}
            >
              Last Month
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[260px_1fr]">
            <div>
              <label className="app-label">Payment Filter</label>
              <select
                className="app-select"
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
              >
                {PAYMENT_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <p className="text-sm text-slate-500">
                Use `Full Payments` on case views to count only fully settled cases.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-b border-slate-200">
            {TAB_ITEMS.map((tab) => (
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

          {globalLoader ? <div className="text-sm text-slate-500">Loading ranking...</div> : null}

          <SimpleDataTable
            columns={activeColumns}
            rows={activeRows}
            rowKey="id"
            dense
            pageSize={10}
            emptyMessage="No ranking data found."
          />
        </div>
      </section>
    </div>
  );
}
