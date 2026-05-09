import React from "react";
import { GlobalContext } from "../../../../libs/context/globalContext";
import { DetailMatrix, DetailSectionCard, DetailSectionHint } from "../DetailSectionCard";

export default function PreColInfo() {
  const { loan } = React.useContext(GlobalContext);

  const rows = [
    [
      { type: "label", content: "Loan ID" },
      { content: loan?.ID || "-" },
      { type: "label", content: "Remaining repayment days" },
      { content: loan?.dur === 2 ? "T2" : loan?.dur === 1 ? "T1" : "T0" },
      { type: "label", content: "Remaining repayment amount" },
      {
        content:
          loan?.amountPaid === undefined
            ? loan?.repaymentAmount || "-"
            : parseInt(loan.repaymentAmount || 0, 10) - parseInt(loan.amountPaid || 0, 10),
      },
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
