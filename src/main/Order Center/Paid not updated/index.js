import React from "react";
import * as XLSX from "xlsx";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";
import { GlobalContext } from "../../../libs/context/globalContext";
import {
  getPortalPayments,
  restorePortalPayment,
} from "../../../handlers/portalPayments";

const tabs = [
  { id: "pending", label: "Pending Updates" },
  { id: "completed", label: "Completed" },
];

const statusTone = {
  success: "bg-emerald-50 text-emerald-700",
  verified: "bg-sky-50 text-sky-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-rose-50 text-rose-700",
  processing: "bg-indigo-50 text-indigo-700",
};

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
};

const formatJson = (value) => {
  if (!value) return "";

  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

const normalizeReference = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "");

export default function PaidNotUpdated() {
  const { _hasAccess, setAlerts, alerts } = React.useContext(GlobalContext);
  const canRestore = _hasAccess("action:payment:restore");

  const [activeTab, setActiveTab] = React.useState("pending");
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectedRefs, setSelectedRefs] = React.useState([]);
  const [selectedRecord, setSelectedRecord] = React.useState(null);
  const [restoringReference, setRestoringReference] = React.useState("");

  const loadRecords = React.useCallback(async () => {
    setLoading(true);
    const response = await getPortalPayments({
      stage: activeTab,
      search,
      limit: 500,
    });
    setLoading(false);

    if (response.success === 0) {
      setRecords([]);
      setAlerts({
        ...alerts,
        open: true,
        severity: "error",
        message: response.message || "Could not load portal payment records.",
      });
      return;
    }

    setRecords(Array.isArray(response.data) ? response.data : []);
  }, [activeTab, alerts, search, setAlerts]);

  React.useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  React.useEffect(() => {
    setSelectedRefs([]);
  }, [activeTab]);

  const toggleSelection = React.useCallback((reference) => {
    setSelectedRefs((current) =>
      current.includes(reference)
        ? current.filter((item) => item !== reference)
        : [...current, reference]
    );
  }, []);

  const exportSelected = React.useCallback(() => {
    const selectedRows = records.filter((item) =>
      selectedRefs.includes(normalizeReference(item.reference))
    );

    if (!selectedRows.length) {
      setAlerts({
        ...alerts,
        open: true,
        severity: "warning",
        message: "Select at least one payment record to export.",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      selectedRows.map((item) => ({
        reference: item.reference,
        provider: item.provider,
        transactionType: item.transactionType,
        phone: item.phone,
        userId: item.userId,
        loanId: item.loanId,
        amount: Number(item.amount || 0),
        currency: item.currency,
        transactionStatus: item.status,
        processed: item.processed ? "Yes" : "No",
        gatewayTransactionId: item.gatewayTransactionId || "",
        gatewayStatusCode: item.gatewayStatusCode || "",
        gatewayMessage: item.gatewayMessage || "",
        createdAt: item.createdAt || "",
        updatedAt: item.updatedAt || "",
        verifiedAt: item.verifiedAt || "",
        processedAt: item.processedAt || "",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Portal Payments");
    XLSX.writeFile(workbook, `paid-not-updated-${activeTab}.xlsx`);
  }, [activeTab, alerts, records, selectedRefs, setAlerts]);

  const handleRestore = React.useCallback(
    async (reference) => {
      const normalizedReference = normalizeReference(reference);
      if (!normalizedReference) return;

      setRestoringReference(normalizedReference);
      const response = await restorePortalPayment(normalizedReference);
      setRestoringReference("");

      setAlerts({
        ...alerts,
        open: true,
        severity: response.success === 1 ? "success" : response.success === 2 ? "warning" : "error",
        message:
          response.message ||
          (response.success === 1
            ? "Payment restored successfully."
            : "Payment restore failed."),
      });

      await loadRecords();

      if (response.success === 1) {
        setSelectedRecord(null);
      }
    },
    [alerts, loadRecords, setAlerts]
  );

  const allSelected = records.length > 0 && selectedRefs.length === records.length;

  const columns = React.useMemo(
    () => [
      {
        key: "select",
        label: "Select",
        render: (row) => {
          const reference = normalizeReference(row.reference);
          return (
            <input
              type="checkbox"
              checked={selectedRefs.includes(reference)}
              onClick={(event) => event.stopPropagation()}
              onChange={() => toggleSelection(reference)}
            />
          );
        },
      },
      {
        key: "reference",
        label: "Reference",
        cellClassName: "font-semibold text-slate-900",
      },
      { key: "phone", label: "Phone" },
      { key: "loanId", label: "Loan ID" },
      { key: "userId", label: "User ID" },
      { key: "gatewayTransactionId", label: "Gateway ID" },
      {
        key: "amount",
        label: "Amount",
        render: (row) => `${row.currency || "GHS"} ${formatMoney(row.amount)}`,
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
      {
        key: "createdAt",
        label: "Time",
        render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"),
      },
      {
        key: "actions",
        label: "Action",
        render: (row) =>
          activeTab === "pending" && canRestore ? (
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={restoringReference === normalizeReference(row.reference)}
              onClick={(event) => {
                event.stopPropagation();
                handleRestore(row.reference);
              }}
            >
              {restoringReference === normalizeReference(row.reference) ? "Restoring..." : "Restore"}
            </button>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {row.processed ? "Complete" : "View"}
            </span>
          ),
      },
    ],
    [activeTab, canRestore, handleRestore, restoringReference, selectedRefs, toggleSelection]
  );

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Paid Not Updated</h3>
            <p className="text-sm text-slate-500">
              Track portal repayments confirmed by the gateway, inspect the raw gateway payloads,
              export selected records, and restore loan posting when needed.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
            <i className="fa fa-money text-sm" />
            {records.length} record(s)
          </div>
        </div>
        <div className="app-panel-body space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="app-input"
              placeholder="Search by reference, phone, loan ID, user ID, gateway ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={loadRecords}
            >
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() =>
                  setSelectedRefs(
                    allSelected ? [] : records.map((item) => normalizeReference(item.reference))
                  )
                }
              >
                {allSelected ? "Clear Selection" : "Select All"}
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setSelectedRefs([])}
              >
                Reset Selected
              </button>
            </div>
            <button
              type="button"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100"
              onClick={exportSelected}
            >
              Export Selected
            </button>
          </div>

          <SimpleDataTable
            columns={columns}
            rows={records}
            rowKey="reference"
            dense
            loading={loading}
            loadingMessage="Loading paid-not-updated records..."
            emptyMessage={`No ${activeTab === "pending" ? "pending" : "completed"} portal payments found.`}
            onRowClick={(row) => setSelectedRecord(row)}
          />
        </div>
      </section>

      {selectedRecord ? (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-900/55 p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-[28px] border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">
                  Paid Not Updated
                </p>
                <h4 className="mt-2 text-xl font-semibold text-slate-900">
                  {selectedRecord.reference || "Portal payment"}
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedRecord.createdAt
                    ? new Date(selectedRecord.createdAt).toLocaleString()
                    : "No timestamp"}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Phone</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedRecord.phone || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Loan ID</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedRecord.loanId || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">User ID</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedRecord.userId || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Amount</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedRecord.currency || "GHS"} {formatMoney(selectedRecord.amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Provider</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedRecord.provider || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Gateway ID</p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    {selectedRecord.gatewayTransactionId || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Status</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedRecord.status || "-"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Processed</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedRecord.processed ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Gateway Init Response
                  </p>
                  <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                    <code>{formatJson(selectedRecord.rawInitializeResponse) || "No data"}</code>
                  </pre>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Gateway Webhook
                  </p>
                  <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                    <code>{formatJson(selectedRecord.rawWebhookEvent) || "No data"}</code>
                  </pre>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Verification Response
                  </p>
                  <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                    <code>{formatJson(selectedRecord.rawVerifyResponse) || "No data"}</code>
                  </pre>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                {activeTab === "pending" && canRestore ? (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => handleRestore(selectedRecord.reference)}
                    disabled={restoringReference === normalizeReference(selectedRecord.reference)}
                  >
                    {restoringReference === normalizeReference(selectedRecord.reference)
                      ? "Restoring..."
                      : "Restore Payment"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setSelectedRecord(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
