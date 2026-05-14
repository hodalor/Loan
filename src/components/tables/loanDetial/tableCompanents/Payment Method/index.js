import React from "react";
import SimpleDataTable from "../../../SimpleDataTable";
import { DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";
import useResolvedLoanDetails from "../../useResolvedLoanDetails";

export default function PaymentMethod() {
  const { loan, customer, customerProfileLoading } = useResolvedLoanDetails();
  const paymentMethods = Array.isArray(customer?.paymentMethods)
    ? customer.paymentMethods
    : loan?.paymentMethod
    ? [{ method: loan.paymentMethod, operator: loan.paymentOperator || "", createdAt: loan.doa }]
    : [];
  const getMethodLabel = (item = {}) =>
    String(item.method || "").includes("@") ? "Card / Email" : "Mobile Money";
  const getOperatorLabel = (item = {}) => String(item.operator || "").trim() || "Not set";

  const columns = [
    {
      key: "type",
      label: "Collection methods",
      cellClassName: "font-semibold text-slate-900",
    },
    { key: "operator", label: "Service provider" },
    { key: "method", label: "Card number/Account number/Collection code" },
    { key: "createdAt", label: "Bind time" },
    { key: "autoDeduction", label: "Whether sign deduction agreement" },
    {
      key: "action",
      label: "Action",
      render: () => (
        <button
          type="button"
          className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
        >
          Send SMS message
        </button>
      ),
    },
  ];

  const rows = paymentMethods.map((paymentMethod, index) => ({
    ...paymentMethod,
    id: index + 1,
    type: getMethodLabel(paymentMethod),
    operator: getOperatorLabel(paymentMethod),
    createdAt: paymentMethod?.createdAt
      ? new Date(paymentMethod.createdAt).toLocaleDateString()
      : "-",
    autoDeduction: "not support",
  }));

  return (
    <DetailSectionCard
      title="Collection method information"
      subtitle="Accounts and payment channels linked to this customer."
    >
      <DetailSectionHint
        text={
          customerProfileLoading
            ? "Loading saved collection methods from the customer profile."
            : `${rows.length} collection method${rows.length === 1 ? "" : "s"} available for this case.`
        }
      />
      <SimpleDataTable
        columns={columns}
        rows={rows}
        emptyMessage="No collection methods found."
        dense
        loading={customerProfileLoading}
        loadingMessage="Loading collection methods..."
      />
    </DetailSectionCard>
  );
}
