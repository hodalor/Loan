import React from "react";

const DEFAULT_DAYS = [
  "Mon 12",
  "Tue 13",
  "Wed 14",
  "Thu 15",
  "Fri 16",
  "Sat 17",
  "Sun 18",
];

const DEFAULT_ASSIGNMENTS = [
  ["Prince", "Abigail", "Amanda"],
  ["Gloria", "Daniel"],
  ["Florence", "Abdulla"],
  ["Amanda", "Prince"],
  ["Gloria", "Abigail", "Daniel"],
  ["Florence"],
  ["Abdulla", "Prince"],
];

export default function SchedulePlannerPage({
  title,
  description,
  tabs = [],
  staffOptions = [],
  autoAssignLabel = "",
}) {
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.id || "primary");
  const [selectedStaff, setSelectedStaff] = React.useState("");
  const [autoAssign, setAutoAssign] = React.useState(false);

  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || "Schedule";
  const summaryCards = [
    { label: "Visible Days", value: `${DEFAULT_DAYS.length}` },
    { label: "Assigned Staff", value: `${staffOptions.length}` },
    { label: "Active View", value: activeTabLabel },
  ];

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>

        <div className="border-b border-slate-200 px-6">
          <div className="flex flex-wrap gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-0 py-4 text-lg font-semibold transition ${
                  activeTab === tab.id
                    ? "border-blue-600 text-slate-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="app-panel-body space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,280px)_auto_auto] xl:items-end">
            <div>
              <select
                className="block min-h-[44px] w-full rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={selectedStaff}
                onChange={(event) => setSelectedStaff(event.target.value)}
              >
                <option value="">
                  {activeTab.includes("collection") ? "Collection Staff" : "Review Staff"}
                </option>
                {staffOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="app-btn-primary gap-2">
                <i className="fa fa-search text-sm" />
                Search
              </button>
              <button
                type="button"
                className="app-btn-secondary gap-2"
                onClick={() => setSelectedStaff("")}
              >
                <i className="fa fa-undo text-sm" />
                Reset
              </button>
            </div>
            {autoAssignLabel ? (
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoAssign}
                  onClick={() => setAutoAssign((current) => !current)}
                  className={`relative inline-flex h-7 w-12 rounded-full transition ${
                    autoAssign ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                      autoAssign ? "left-6" : "left-1"
                    }`}
                  />
                </button>
                {autoAssignLabel}
              </label>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="overflow-auto">
              <div className="grid min-w-[840px] grid-cols-7 border-b border-slate-200 bg-slate-100">
                {DEFAULT_DAYS.map((day) => (
                  <div
                    key={day}
                    className="border-r border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid min-w-[840px] grid-cols-7">
                {DEFAULT_ASSIGNMENTS.map((entries, index) => (
                  <div
                    key={`${activeTab}-${index}`}
                    className="min-h-[170px] border-r border-slate-200 px-4 py-4 last:border-r-0"
                  >
                    <div className="flex flex-col gap-2">
                      {entries.map((entry) => (
                        <span
                          key={`${activeTab}-${index}-${entry}`}
                          className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                        >
                          {entry}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
