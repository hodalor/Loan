import React from "react";
import SimpleDataTable from "../../SimpleDataTable";

const columns = [
  {
    key: "collectionMethods",
    label: "Collection Methods",
    cellClassName: "font-semibold text-slate-900",
  },
  { key: "accountNumber", label: "Account Number" },
  { key: "bindDate", label: "Paid Date" },
  { key: "autoDeduction", label: "Signed Auto Deduction" },
  { key: "action", label: "Action" },
];

const rows = [
  {
    id: 1,
    collectionMethods: "Mobile Money",
    accountNumber: "0243984046",
    bindDate: "12-12-2022 13:00",
    autoDeduction: "Not Sign",
    action: "Send SMS",
  },
];

export default function PaymentInfo() {
  return (
    <div className="card">
      <div className="card-body">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
            Repayment information
          </div>
          <div className="p-4">
            <SimpleDataTable
              columns={columns}
              rows={rows}
              emptyMessage="No repayment information found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
