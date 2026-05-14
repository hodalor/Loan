import React from "react";
import SimpleDataTable from "../../components/tables/SimpleDataTable";
import _getSystemLogs from "../../handlers/gets/getSystemLogs";

const levelTone = {
  info: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
  fatal: "bg-rose-100 text-rose-800 border-rose-300",
  debug: "bg-slate-100 text-slate-700 border-slate-200",
  trace: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusTone = {
  success: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-rose-50 text-rose-700",
  blocked: "bg-amber-50 text-amber-700",
  received: "bg-sky-50 text-sky-700",
};

const formatJson = (value) => {
  if (!value) return "";

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

const truncateText = (value = "", limit = 96) => {
  const normalized = String(value || "").trim();
  if (normalized.length <= limit) return normalized || "-";
  return `${normalized.slice(0, limit)}...`;
};

export default function SystemLogsPage({
  title,
  description,
  endpoint,
  defaultLevel = "",
  showLevelFilter = true,
}) {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [level, setLevel] = React.useState(defaultLevel);
  const [status, setStatus] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [copyMessage, setCopyMessage] = React.useState("");

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const response = await _getSystemLogs(endpoint, {
      search,
      level,
      status,
      limit: 250,
    });

    setLoading(false);

    if (response.success === 0) {
      setLogs([]);
      setErrorMessage(response.message || "Could not load the requested logs.");
      return;
    }

    setLogs(Array.isArray(response.data) ? response.data : []);
  }, [endpoint, level, search, status]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const tableRows = React.useMemo(() => {
    const normalizedStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const normalizedEnd = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    return logs
      .filter((log) => {
        if (!normalizedStart && !normalizedEnd) return true;

        const createdAt = log.createdAt ? new Date(log.createdAt) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
        if (normalizedStart && createdAt < normalizedStart) return false;
        if (normalizedEnd && createdAt > normalizedEnd) return false;
        return true;
      })
      .map((log) => ({
        ...log,
        createdLabel: log.createdAt ? new Date(log.createdAt).toLocaleString() : "-",
        actorLabel: log.actor?.userName || log.actor?.userId || "-",
        shortMessage: truncateText(log.message, 88),
      }));
  }, [endDate, logs, startDate]);

  const selectedIndex = React.useMemo(
    () => tableRows.findIndex((row) => row._id === selectedLog?._id),
    [selectedLog?._id, tableRows]
  );

  const handleCopyLog = React.useCallback(async () => {
    if (!selectedLog) return;

    const payload = {
      id: selectedLog._id,
      level: selectedLog.level,
      status: selectedLog.status,
      category: selectedLog.category,
      source: selectedLog.source,
      action: selectedLog.action,
      message: selectedLog.message,
      actor: selectedLog.actor,
      requestMethod: selectedLog.requestMethod,
      requestPath: selectedLog.requestPath,
      origin: selectedLog.origin,
      ipAddress: selectedLog.ipAddress,
      metadata: selectedLog.metadata,
      details: selectedLog.details,
      createdAt: selectedLog.createdAt,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyMessage("JSON copied.");
    } catch (error) {
      setCopyMessage("Copy failed.");
    }
  }, [selectedLog]);

  React.useEffect(() => {
    if (!copyMessage) return undefined;

    const timeoutId = window.setTimeout(() => setCopyMessage(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copyMessage]);

  const columns = React.useMemo(
    () => [
      {
        key: "level",
        label: "Level",
        render: (row) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
              levelTone[row.level] || levelTone.info
            }`}
          >
            {row.level || "info"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
              statusTone[row.status] || "bg-slate-100 text-slate-700"
            }`}
          >
            {row.status || "unknown"}
          </span>
        ),
      },
      { key: "category", label: "Category" },
      {
        key: "shortMessage",
        label: "Message",
        cellClassName: "min-w-[280px] max-w-[420px]",
        render: (row) => (
          <div>
            <p className="font-semibold text-slate-900">{row.shortMessage}</p>
            <p className="mt-1 text-xs text-slate-500">{row.source || "-"}</p>
          </div>
        ),
      },
      { key: "actorLabel", label: "Actor" },
      { key: "requestPath", label: "Path" },
      { key: "createdLabel", label: "Time" },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">
              System Management
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={loadLogs}
            type="button"
          >
            Refresh Logs
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Search
            </span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              placeholder="Message, source, actor, path"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          {showLevelFilter ? (
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Level
              </span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              >
                <option value="">All levels</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="fatal">Fatal</option>
              </select>
            </label>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Showing warning, error, and fatal records only.
            </div>
          )}

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Status
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
              <option value="received">Received</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Start Date
            </span>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              End Date
            </span>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{tableRows.length}</span> filtered log
            record(s)
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => {
              setSearch("");
              setLevel(defaultLevel);
              setStatus("");
              setStartDate("");
              setEndDate("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
          {errorMessage}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-slate-900">Log Table</h4>
              <p className="text-sm text-slate-500">
                Click any row to open full log details in a modal.
              </p>
            </div>
          </div>

          <SimpleDataTable
            columns={columns}
            rows={tableRows}
            rowKey="_id"
            dense
            pageSize={12}
            loading={loading}
            loadingMessage="Loading logs..."
            emptyMessage="No log records matched the current filters."
            onRowClick={(row) => setSelectedLog(row)}
          />
        </div>
      </section>

      {selectedLog ? (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-900/55 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-[28px] border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">
                  Log Details
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  {selectedLog.message || "System log"}
                </h4>
                <p className="mt-2 text-sm text-slate-500">{selectedLog.createdLabel}</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    levelTone[selectedLog.level] || levelTone.info
                  }`}
                >
                  {selectedLog.level || "info"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    statusTone[selectedLog.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {selectedLog.status || "unknown"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                  {selectedLog.category || "audit"}
                </span>
                {copyMessage ? (
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    {copyMessage}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Source</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedLog.source || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Action</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedLog.action || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Actor</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedLog.actorLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Role</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedLog.actor?.role || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Method</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedLog.requestMethod || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Path</p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    {selectedLog.requestPath || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Origin</p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    {selectedLog.origin || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">IP</p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    {selectedLog.ipAddress || "-"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Metadata
                  </p>
                  <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                    <code>{formatJson(selectedLog.metadata) || "No metadata"}</code>
                  </pre>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Details
                  </p>
                  <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                    <code>{formatJson(selectedLog.details) || "No details"}</code>
                  </pre>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedIndex <= 0}
                    onClick={() => setSelectedLog(tableRows[selectedIndex - 1])}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={selectedIndex < 0 || selectedIndex >= tableRows.length - 1}
                    onClick={() => setSelectedLog(tableRows[selectedIndex + 1])}
                  >
                    Next
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    onClick={handleCopyLog}
                  >
                    Copy JSON
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setSelectedLog(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
