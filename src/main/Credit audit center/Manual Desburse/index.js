import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

const escapeCsvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function ManualDisburse() {
  const {
    customers,
    globalLoader,
    handleMarkManualDisbursed,
    selectedCases,
    setSelectedCases,
    dateRange,
    _handleSeachDis,
    disbursed,
    originalData,
    _handleClearSearch,
    _handleOrderlistDetails,
    _hasAccess,
  } = React.useContext(GlobalContext);
  const canManualDisburse = _hasAccess("action:disbursement:manual");
  const selectedCaseSet = React.useMemo(() => new Set(selectedCases), [selectedCases]);

  const rows = React.useMemo(
    () =>
      !Array.isArray(disbursed) || disbursed.length === 0
        ? []
        : disbursed.map((loan, index) => {
            const customer =
              !Array.isArray(customers) || customers.length === 0
                ? null
                : customers.find((person) => person.userId === loan.userId) || null;
            const paymentMethod = Array.isArray(customer?.paymentMethods)
              ? customer.paymentMethods.find((method) => method.method === loan.paymentMethod)
              : null;

            return {
              ...loan,
              id: loan.ID || loan._id || index + 1,
              accountType: "Momo",
              accountName: customer?.IDinfo
                ? `${customer.IDinfo.firstName || ""} ${customer.IDinfo.lastName || ""}`.trim()
                : "-",
              accountNumber: paymentMethod?.method || loan.paymentMethod || "-",
              accountIssuer: loan.paymentOperator || paymentMethod?.operator || "Unknown",
              description: "Pathway loans disbursement",
              disbursementProvider: loan.disbursementProvider || "Pending",
              payoutStatus: loan.payoutStatus || "Pending",
            };
          }),
    [customers, disbursed]
  );

  const toggleSelection = (loanId, checked) => {
    if (!canManualDisburse) return;

    setSelectedCases((current) => {
      const nextSet = new Set(current);
      if (checked) {
        nextSet.add(loanId);
      } else {
        nextSet.delete(loanId);
      }
      return Array.from(nextSet);
    });
  };

  const handleExport = () => {
    const header = [
      "Order ID",
      "User ID",
      "Account Type",
      "Account Name",
      "Account Number",
      "Account Issuer",
      "Description",
      "Amount",
      "Provider",
      "Payout Status",
    ];
    const csvRows = rows.map((row) =>
      [
        row.ID,
        row.userId,
        row.accountType,
        row.accountName,
        row.accountNumber,
        row.accountIssuer,
        row.description,
        row.amount,
        row.disbursementProvider,
        row.payoutStatus,
      ]
        .map(escapeCsvValue)
        .join(",")
    );

    const csvContent = [header.map(escapeCsvValue).join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `manual-disbursement-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  };

  const columns = [
    {
      key: "pick",
      label: "Pick",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedCaseSet.has(row.ID)}
          disabled={!canManualDisburse}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => toggleSelection(row.ID, event.target.checked)}
        />
      ),
    },
    { key: "ID", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "accountType", label: "Account Type" },
    { key: "accountName", label: "Account Name" },
    { key: "accountNumber", label: "Account Number" },
    { key: "accountIssuer", label: "Account Issuer" },
    { key: "amount", label: "Amount" },
    { key: "disbursementProvider", label: "Provider" },
    {
      key: "payoutStatus",
      label: "Payout Status",
      render: (row) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            String(row.payoutStatus).toLowerCase().includes("pending")
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {row.payoutStatus}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (row) => (
        <button
          type="button"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
          disabled={!canManualDisburse}
          onClick={(event) => {
            event.stopPropagation();
            handleMarkManualDisbursed([row.ID]);
          }}
        >
          Mark Disbursed
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Manual Disbursement</h3>
            <p className="text-sm text-slate-500">
              Confirm approved loans after funds have been disbursed manually.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="app-chip">{rows.length} queued</div>
            <div className="app-chip">{selectedCases.length} selected</div>
          </div>
        </div>

        <div className="app-panel-body space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(220px,320px)_auto] md:items-end">
            <CustomDateRangeInputs />
            <div className="flex flex-wrap gap-3">
              <button
                disabled={dateRange === null}
                onClick={_handleSeachDis}
                type="button"
                className="app-btn-primary gap-2"
              >
                <i className="fa fa-search text-sm" />
                Search
              </button>
              <button
                disabled={originalData.length === 0}
                type="button"
                onClick={_handleClearSearch}
                className="app-btn-secondary gap-2"
              >
                <i className="fa fa-undo text-sm" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="app-btn-secondary gap-2"
                disabled={rows.length === 0}
              >
                <i className="fa fa-download text-sm" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => handleMarkManualDisbursed()}
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canManualDisburse || selectedCases.length === 0}
              >
                Mark Selected Disbursed
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Approved loans stay in this queue until you confirm the manual payout. The customer
            countdown starts after confirmation.
          </div>

          {globalLoader ? (
            <div className="text-sm text-slate-500">Loading manual disbursement queue...</div>
          ) : null}

          <SimpleDataTable
            columns={columns}
            rows={rows}
            rowKey="id"
            dense
            emptyMessage="No loans are waiting for manual disbursement."
            onRowClick={(row) => _handleOrderlistDetails(row)}
          />
        </div>
      </section>
    </div>
  );
}
