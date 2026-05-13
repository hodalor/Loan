import React from "react";
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
  const [expandedId, setExpandedId] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");

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
        <div className="grid gap-4 xl:grid-cols-4">
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

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{logs.length}</span> log record(s)
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
            Loading logs...
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && logs.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
            No log records matched the current filters.
          </div>
        ) : null}

        {!loading && !errorMessage
          ? logs.map((log) => {
              const isExpanded = expandedId === log._id;

              return (
                <article
                  key={log._id}
                  className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                            levelTone[log.level] || levelTone.info
                          }`}
                        >
                          {log.level || "info"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                            statusTone[log.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {log.status || "unknown"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                          {log.category || "audit"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{log.message}</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-600 xl:grid-cols-3">
                        <div>
                          <span className="font-semibold text-slate-900">Source:</span>{" "}
                          {log.source || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Action:</span>{" "}
                          {log.action || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Actor:</span>{" "}
                          {log.actor?.userName || log.actor?.userId || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Role:</span>{" "}
                          {log.actor?.role || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Method:</span>{" "}
                          {log.requestMethod || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Path:</span>{" "}
                          {log.requestPath || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Origin:</span>{" "}
                          {log.origin || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">IP:</span>{" "}
                          {log.ipAddress || "-"}
                        </div>
                      </div>
                    </div>

                    <button
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                      onClick={() => setExpandedId(isExpanded ? "" : log._id)}
                      type="button"
                    >
                      {isExpanded ? "Hide Details" : "Show Details"}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Metadata
                        </p>
                        <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                          <code>{formatJson(log.metadata) || "No metadata"}</code>
                        </pre>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Details
                        </p>
                        <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                          <code>{formatJson(log.details) || "No details"}</code>
                        </pre>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          : null}
      </section>
    </div>
  );
}
