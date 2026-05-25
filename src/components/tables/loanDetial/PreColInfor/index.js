import React from "react";
import { GlobalContext } from "../../../../libs/context/globalContext";
import { DetailMatrix, DetailSectionCard, DetailSectionHint } from "../DetailSectionCard";
import { formatMoney, getCollectionMetrics } from "../../../../libs/collectionMetrics";

export default function PreColInfo() {
  const { loan } = React.useContext(GlobalContext);
  const metrics = getCollectionMetrics(loan);
  const remainingDaysLabel =
    loan?.caseStatus === "Completed" || ["Paid", "Payed"].includes(String(loan?.paymentStatus || ""))
      ? "Settled"
      : loan?.dur === 2
      ? "T2"
      : loan?.dur === 1
      ? "T1"
      : loan?.dur === 0
      ? "T0"
      : "-";

  const rows = [
    [
      { type: "label", content: "Loan ID" },
      { content: loan?.ID || "-" },
      { type: "label", content: "Remaining repayment days" },
      { content: remainingDaysLabel },
      { type: "label", content: "Remaining repayment amount" },
      { content: formatMoney(metrics.amountLeft) },
    ],
    [
      { type: "label", content: "Case status" },
      { content: loan?.paymentStatus || "-" },
      { type: "label", content: "Advance Employee" },
      { content: loan?.preCollOfficer || "-" },
      { type: "label", content: "Repayment Date" },
      {
        content:
          loan?.dop === undefined || loan?.dop === null
            ? "-"
            : new Date(loan.dop).toLocaleDateString(),
      },
    ],
  ];

  return (
    <DetailSectionCard
      title="Pre-collection information"
      subtitle="Upcoming repayment status and the assigned advance officer."
    >
      <DetailSectionHint text="This section is shared with the review and collection flows, but shows pre-collection timing data." />
      <DetailMatrix rows={rows} />
    </DetailSectionCard>
  );
}
