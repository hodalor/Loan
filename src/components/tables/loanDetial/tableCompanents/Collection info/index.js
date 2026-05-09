import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import { DetailMatrix, DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";

export default function CollectionInfo() {
  const { loan } = React.useContext(GlobalContext);

  const overduPenalty =
    loan === undefined ? 0 : -(2 / 100) * parseInt(loan.amount) * loan.dur;

  const _calcDAte = (loan) => {
    let dp = new Date(loan.dp);
    let dop = new Date(loan.dop);

    let timeDiff = dp.getTime() - dop.getTime();

    let diffDate = timeDiff / (1000 * 3600 * 24);

    let dur = parseInt(diffDate);

    return dur;
  };

  const remainingAmount =
    loan?.caseStatus === "Completed"
      ? parseFloat(loan.repaymentAmount || 0) -
        parseFloat(loan.amountPaid || 0) +
        (2 / 100) * parseInt(loan.amount || 0, 10) * _calcDAte(loan)
      : loan?.amountPaid === undefined
      ? loan?.repaymentAmount || 0
      : (parseFloat(loan.repaymentAmount || 0) - parseFloat(loan.amountPaid || 0)).toFixed(2);

  const amountPayable =
    loan?.caseStatus === "Completed"
      ? parseFloat(loan.repaymentAmount || 0) -
        parseFloat(loan.amountPaid || 0) +
        (2 / 100) * parseInt(loan.amount || 0, 10) * _calcDAte(loan)
      : (
          parseFloat(loan?.repaymentAmount || 0) -
          parseFloat(loan?.amountPaid || 0) +
          overduPenalty
        ).toFixed(2);

  const rows = [
    [
      { type: "label", content: "Loan ID" },
      { content: loan?.ID || "-" },
      { type: "label", content: "Remaining Amount" },
      { content: `GHS ${remainingAmount}` },
      { type: "label", content: "Overdue Penalty" },
      { content: `GHS ${loan?.caseStatus === "Completed" ? (2 / 100) * parseInt(loan.amount || 0, 10) * _calcDAte(loan) : overduPenalty}` },
    ],
    [
      { type: "label", content: "Amount Payable" },
      { content: `GHS ${amountPayable}` },
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
      {
        content:
          loan?.caseStatus === "Completed" ? _calcDAte(loan) : loan === undefined ? 0 : -loan.dur,
      },
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
