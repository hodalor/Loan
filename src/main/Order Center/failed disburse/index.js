import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import { _getSystemConfig } from "../../../handlers";
import { channelLabels } from "../../../libs/systemConfig";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

export default function FailedDisbursements() {
  const {
    customers,
    loans,
    globalLoader,
    _handleOrderlistDetails,
    _retryFailedDisbursement,
    _hasAccess,
  } = React.useContext(GlobalContext);
  const canRetryDisbursement = _hasAccess("action:disbursement:retry");

  const [implementedChannels, setImplementedChannels] = React.useState([
    "zynlepay",
    "nsano",
    "bridge",
  ]);
  const [selectedChannels, setSelectedChannels] = React.useState({});
  const [activeRow, setActiveRow] = React.useState("");

  React.useEffect(() => {
    const loadConfig = async () => {
      const response = await _getSystemConfig();
      if (response.success === 1 && Array.isArray(response.data?.implementedChannels)) {
        setImplementedChannels(response.data.implementedChannels);
      }
    };

    loadConfig();
  }, []);

  const rows = React.useMemo(() => {
    const failedLoans = Array.isArray(loans)
      ? loans.filter(
          (loan) =>
            loan.loanStatus === "Granted" &&
            loan.isDisbursed !== true &&
            loan.payoutStatus === "failed"
        )
      : [];

    return failedLoans.map((loan, index) => {
      const customer =
        Array.isArray(customers) && customers.length > 0
          ? customers.find((person) => person.userId === loan.userId)
          : null;

      return {
        ...loan,
        id: loan._id || loan.ID || index + 1,
        loanId: loan.ID,
        customerName: customer?.IDinfo
          ? `${customer.IDinfo.firstName} ${customer.IDinfo.middleName} ${customer.IDinfo.lastName}`
          : "",
        phone: customer?.phone || "",
        provider: loan.disbursementProvider || "Pending",
        message: loan.payoutMessage || "Gateway request failed",
      };
    });
  }, [customers, loans]);

  const columns = [
    { key: "loanId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "customerName", label: "Customer" },
    { key: "phone", label: "Phone" },
    { key: "amount", label: "Amount" },
    { key: "provider", label: "Last Channel" },
    { key: "message", label: "Failure Reason" },
    {
      key: "switchChannel",
      label: "Retry Channel",
      render: (row) => (
        <select
          className="app-input h-10 min-w-[150px] py-2 text-sm"
          disabled={!canRetryDisbursement}
          value={selectedChannels[row.loanId] || row.provider || "zynlepay"}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) =>
            setSelectedChannels((current) => ({
              ...current,
              [row.loanId]: event.target.value,
            }))
          }
        >
          {implementedChannels.map((channel) => (
            <option key={channel} value={channel}>
              {channelLabels[channel] || channel}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (row) => (
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canRetryDisbursement || activeRow === row.loanId}
          onClick={(event) => {
            event.stopPropagation();
            const channel =
              selectedChannels[row.loanId] || row.provider || "zynlepay";
            setActiveRow(row.loanId);
            _retryFailedDisbursement({
              loanId: row.loanId,
              channel,
            }).finally(() => setActiveRow(""));
          }}
        >
          <i
            className={`fa ${
              activeRow === row.loanId ? "fa-spinner fa-spin" : "fa-rotate-right"
            } text-sm`}
          />
          {activeRow === row.loanId ? "Sending..." : "Resend"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Failed Disbursements
            </h3>
            <p className="text-sm text-slate-500">
              Retry approved loans that failed on automatic payout
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            <i className="fa fa-circle-exclamation text-sm" />
            {rows.length} failed loans
          </div>
        </div>
        {!canRetryDisbursement ? (
          <div className="px-6 pb-2 text-sm font-medium text-amber-600">
            Retry action is hidden by your current grants.
          </div>
        ) : null}
        <div className="app-panel-body space-y-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Choose a channel and click resend, or open a row to inspect the full order.
          </div>
          {globalLoader ? <div className="text-sm text-slate-500">Loading failed payouts...</div> : null}
          <SimpleDataTable
            columns={columns}
            rows={rows}
            rowKey="id"
            dense
            emptyMessage="No failed disbursements found."
            onRowClick={(row) => _handleOrderlistDetails(row)}
          />
        </div>
      </section>
    </div>
  );
}
