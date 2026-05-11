import React from "react";
import { GlobalContext } from "../../../../libs/context/globalContext";
import SimpleDataTable from "../../SimpleDataTable";
import { DetailSectionCard, DetailSectionHint } from "../DetailSectionCard";
import { formatMoney, getCollectionMetrics } from "../../../../libs/collectionMetrics";

export default function PaymentPlan() {
  const { loan } = React.useContext(GlobalContext);
  const metrics = getCollectionMetrics(loan || {}, loan || {});

  const columns = [
    { key: "duration", label: "Loan Period" },
    { key: "dp", label: "Payment date" },
    { key: "dop", label: "Due date" },
    { key: "overdueDays", label: "Overdue Days" },
    { key: "repaymentAmount", label: "Repayment Amount" },
    { key: "amountPaid", label: "Amount Paid" },
    { key: "amountLeft", label: "Amount Left" },
    { key: "overduePenalty", label: "Overdue Penalty" },
    { key: "remainingAmount", label: "Remaining Amount" },
  ];

  const rows =
    loan === undefined || Object.keys(loan).length === 0
      ? []
      : [
          {
            id: loan.ID,
            duration: loan.duration === undefined ? "" : loan.duration,
            dp:
              loan.dp === null || loan.dp === undefined
                ? "Not paid"
                : new Date(loan.dp).toLocaleDateString(),
            dop:
              loan.dop === null || loan.dop === undefined
                ? loan.loanStatus
                : new Date(loan.dop).toLocaleDateString(),
            overdueDays: metrics.overdueDays,
            repaymentAmount: `GHS ${formatMoney(metrics.repaymentAmount)}`,
            amountPaid: `GHS ${formatMoney(metrics.amountPaid)}`,
            remainingAmount: `GHS ${formatMoney(metrics.amountPayable)}`,
            amountLeft: `GHS ${formatMoney(metrics.amountLeft)}`,
            overduePenalty: `GHS ${formatMoney(metrics.overduePenalty)}`,
          },
        ];

  return (
    <DetailSectionCard
      title="Repayment plan"
      subtitle="Payment timeline, due dates, and remaining balance for the current loan."
    >
      <DetailSectionHint text="The same repayment plan block is reused by review, pre-collection, and collection detail pages." />
      <SimpleDataTable
        columns={columns}
        rows={rows}
        rowKey="id"
        emptyMessage="No repayment plan found."
        dense
      />
    </DetailSectionCard>
  );
}
