import React from "react";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

const TAB_ITEMS = [
  { id: "failed", label: "Failed Loans" },
  { id: "withdrawal", label: "Withdrawal Order" },
];

const failedRows = [];
const withdrawalRows = [
  {
    id: 1,
    orderId: "2",
    userId: "3",
    phone: "35",
    dod: "7658753",
    amount: "300",
    paymentMethod: "7578",
    message: "hgfdjg",
  },
];

export default function OrderLending() {
  const [activeTab, setActiveTab] = React.useState("failed");

  const failedColumns = [
    { key: "loanID", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "userName", label: "User Name" },
    { key: "phone", label: "Phone Number" },
    { key: "amount", label: "Lending Amount" },
    { key: "paymentMethod", label: "Account Number" },
    { key: "doa", label: "Date Of Application" },
    { key: "message", label: "Failure Reason" },
  ];

  const withdrawalColumns = [
    { key: "orderId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "phone", label: "Phone Number" },
    { key: "dod", label: "Date Of Disbursement" },
    { key: "amount", label: "Withdrawal Amount" },
    { key: "paymentMethod", label: "Withdrawal Code" },
    { key: "message", label: "Withdrawal Deadline" },
  ];

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Order Lending</h3>
            <p className="text-sm text-slate-500">
              Review lending failures and withdrawal orders
            </p>
          </div>
        </div>

        <div className="border-b border-slate-200 px-6">
          <div className="flex flex-wrap gap-6 overflow-x-auto">
            {TAB_ITEMS.map((tab) => (
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input type="text" className="app-input" placeholder="User ID" aria-label="userid" />
            <input type="text" className="app-input" placeholder="Phone Numbers" aria-label="phone" />
            <input type="text" className="app-input" placeholder="Order ID" aria-label="idnumber" />
            <div className="flex flex-wrap gap-3">
              <button type="button" className="app-btn-primary gap-2">
                <i className="fa fa-search text-sm" />
                Search
              </button>
              <button type="button" className="app-btn-secondary gap-2">
                <i className="fa fa-undo text-sm" />
                Reset
              </button>
            </div>
          </div>

          {activeTab === "failed" ? (
            <SimpleDataTable
              columns={failedColumns}
              rows={failedRows}
              rowKey="id"
              dense
              emptyMessage="No failed loans found."
            />
          ) : (
            <SimpleDataTable
              columns={withdrawalColumns}
              rows={withdrawalRows}
              rowKey="id"
              dense
              emptyMessage="No withdrawal orders found."
            />
          )}
        </div>
      </section>
    </div>
  );
}
