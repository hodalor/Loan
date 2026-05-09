import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

const TAB_ITEMS = [
  { id: "amount", label: "Amount Collected" },
  { id: "cases", label: "Cases Collected" },
];

const columns = [
  { key: "rank", label: "Rank", cellClassName: "font-semibold text-slate-900" },
  { key: "userName", label: "User Name", cellClassName: "font-semibold text-slate-900" },
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
  { key: "total", label: "Total" },
];

export default function PreCollectionRanking() {
  const { preRank, globalLoader, preRankCase } = React.useContext(GlobalContext);
  const [activeTab, setActiveTab] = React.useState("amount");

  const amountRows = React.useMemo(
    () =>
      (Array.isArray(preRank) ? preRank : []).map((rank, index) => ({
        ...rank,
        id: `${rank.userName || "pre"}-${index}`,
        monday: rank.days?.mon || 0,
        tuesday: rank.days?.tue || 0,
        wednesday: rank.days?.wed || 0,
        thursday: rank.days?.thu || 0,
        friday: rank.days?.fri || 0,
        saturday: rank.days?.sat || 0,
        sunday: rank.days?.sun || 0,
        total: rank.totalAmount || 0,
        rank: index + 1,
      })),
    [preRank]
  );

  const caseRows = React.useMemo(
    () =>
      (Array.isArray(preRankCase) ? preRankCase : []).map((rank, index) => ({
        ...rank,
        id: `${rank.userName || "pre-case"}-${index}`,
        monday: rank.days?.mon || 0,
        tuesday: rank.days?.tue || 0,
        wednesday: rank.days?.wed || 0,
        thursday: rank.days?.thu || 0,
        friday: rank.days?.fri || 0,
        saturday: rank.days?.sat || 0,
        sunday: rank.days?.sun || 0,
        total: rank.totalCases || 0,
        rank: index + 1,
      })),
    [preRankCase]
  );

  const activeRows = activeTab === "amount" ? amountRows : caseRows;
  const topPerformer = activeRows[0];

  const handleExport = () => {
    if (!activeRows.length) return;

    const header = columns.map((column) => column.label).join(",");
    const csvRows = activeRows.map((row) =>
      columns
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

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Precollection Ranking</h3>
            <p className="text-sm text-slate-500">
              Compact weekly performance ranking with export support.
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
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Best Total</div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {topPerformer?.total ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current View</div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {activeTab === "amount" ? "Amount" : "Cases"}
              </div>
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
            columns={columns}
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
