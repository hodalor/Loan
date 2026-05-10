import React from "react";
import SimpleDataTable from "../../../SimpleDataTable";
import useResolvedLoanDetails from "../../useResolvedLoanDetails";
import { DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";

export default function UserLoanRecords() {
  const { customer, customerProfileLoading } = useResolvedLoanDetails();
  const customerLoans = Array.isArray(customer?.loan?.loans)
    ? customer.loan.loans
    : [];

  const checkOverdue = (value) => {
    const inComingDate = new Date(value);
    const overdue = inComingDate.getTime() - new Date().getTime();
    return parseInt(overdue / (1000 * 3600 * 24), 10);
  };

  const calcDateDiff = (loanItem) => {
    const paidDate = new Date(loanItem.dp);
    const dueDate = new Date(loanItem.dop);
    const timeDiff = paidDate.getTime() - dueDate.getTime();
    return parseInt(timeDiff / (1000 * 3600 * 24), 10);
  };

  const columns = [
    { key: "number", label: "#" },
    { key: "ID", label: "Loan ID", cellClassName: "font-semibold text-slate-900" },
    { key: "doa", label: "Apply Time" },
    { key: "amount", label: "Loan Amount" },
    { key: "duration", label: "Loan Term" },
    { key: "autoReviewResult", label: "Auto Review" },
    { key: "loanStatus", label: "Manual Review" },
    { key: "overdueDays", label: "Overdue Days" },
  ];

  const isSettledPayment = (status) =>
    ["Payed", "Paid"].includes(String(status || "").trim());

  const rows =
    customer === undefined
      ? []
      : customerLoans.map((loanItem, index) => ({
          ...loanItem,
          id: loanItem?.ID || index + 1,
          number: index + 1,
          doa: loanItem?.doa ? new Date(loanItem.doa).toLocaleDateString() : "-",
          overdueDays:
            isSettledPayment(loanItem.paymentStatus)
              ? calcDateDiff(loanItem)
              : loanItem.dop === null
              ? loanItem.loanStatus
              : Math.sign(checkOverdue(loanItem.dop)) === -1
              ? checkOverdue(loanItem.dop)
              : "Not overdue",
        }));

  return (
    <DetailSectionCard
      title="User application and loan cases"
      subtitle="Historical loan records already recorded for this customer."
    >
      <DetailSectionHint
        text={
          customerProfileLoading
            ? "Loading the customer profile to show the full loan history."
            : `${rows.length} loan record${rows.length === 1 ? "" : "s"} found for this customer.`
        }
      />
      <SimpleDataTable
        columns={columns}
        rows={rows}
        emptyMessage="No user loan cases found."
        loading={customerProfileLoading}
        loadingMessage="Loading customer loan records..."
      />
    </DetailSectionCard>
  );
}
