import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import SimpleDataTable from "../../../SimpleDataTable";

export default function PaymentMethod() {
  const { loan, customers } = React.useContext(GlobalContext);

  const customer = customers.find((item) => item.userId === loan.userId);
  const paymentMethods = customer?.paymentMethods || [];
  const getMethodLabel = (item = {}) =>
    String(item.method || "").includes("@") ? "Card / Email" : "Mobile Money";

  const columns = [
    {
      key: "operator",
      label: "Collection Methods",
      cellClassName: "font-semibold text-slate-900",
    },
    { key: "method", label: "Account Number" },
    { key: "createdAt", label: "Bind Date" },
    { key: "autoDeduction", label: "Signed Auto Deduction" },
    {
      key: "action",
      label: "Action",
      render: () => (
        <button
          type="button"
          className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
        >
          Send text message
        </button>
      ),
    },
  ];

  const rows = paymentMethods.map((paymentMethod, index) => ({
    ...paymentMethod,
    id: index + 1,
    operator: getMethodLabel(paymentMethod),
    createdAt: paymentMethod?.createdAt
      ? new Date(paymentMethod.createdAt).toLocaleDateString()
      : "-",
    autoDeduction: "Not signed",
  }));

  return (
    <div className="card">
      <div className="card-body">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
            Collection method information
          </div>
          <div className="p-4">
            <SimpleDataTable
              columns={columns}
              rows={rows}
              emptyMessage="No collection methods found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
