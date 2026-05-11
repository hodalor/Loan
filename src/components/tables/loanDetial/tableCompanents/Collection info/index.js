import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import { DetailMatrix, DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";
import { formatMoney, getCollectionMetrics } from "../../../../../libs/collectionMetrics";

export default function CollectionInfo() {
  const { loan } = React.useContext(GlobalContext);
  const metrics = getCollectionMetrics(loan || {}, loan || {});

  const rows = [
    [
      { type: "label", content: "Loan ID" },
      { content: loan?.ID || "-" },
      { type: "label", content: "Remaining Amount" },
      { content: `GHS ${formatMoney(metrics.amountLeft)}` },
      { type: "label", content: "Overdue Penalty" },
      { content: `GHS ${formatMoney(metrics.overduePenalty)}` },
    ],
    [
      { type: "label", content: "Amount Payable" },
      { content: `GHS ${formatMoney(metrics.amountPayable)}` },
      { type: "label", content: "Collection completion date" },
      {
        content:
          loan?.dp === undefined || loan?.dp === null
            ? "-"
            : new Date(loan.dp).toLocaleDateString(),
      },
      { type: "label", content: "Collection Staff" },
      { content: loan?.collofficer || "-" },
    ],
    [
      { type: "label", content: "Due Date" },
      {
        content:
          loan?.dop === undefined || loan?.dop === null
            ? "-"
            : new Date(loan.dop).toLocaleDateString(),
      },
      { type: "label", content: "Overdue days" },
      { content: metrics.overdueDays },
      { type: "label", content: "Case status" },
      { content: loan?.paymentStatus || "-" },
    ],
  ];

  return (
    <DetailSectionCard
      title="Collection information"
      subtitle="Balance, overdue status, and collection assignment for this case."
    >
      <DetailSectionHint text="This section summarizes the active collection amounts and timeline." />
      <DetailMatrix rows={rows} />
    </DetailSectionCard>
  );
}
