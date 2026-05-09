import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import SimpleDataTable from "../../../SimpleDataTable";

export default function UserLoanRecords() {
  const { loan, customers } = React.useContext(GlobalContext);

  const customersList = Array.isArray(customers) ? customers : [];
  const customer = customersList.find((item) => item.userId === loan.userId);
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

  const rows =
    customer === undefined
      ? []
      : customerLoans.map((loanItem, index) => ({
          ...loanItem,
          id: loanItem?.ID || index + 1,
          number: index + 1,
          doa: loanItem?.doa ? new Date(loanItem.doa).toLocaleDateString() : "-",
          overdueDays:
            loanItem.paymentStatus === "Payed"
              ? calcDateDiff(loanItem)
              : loanItem.dop === null
              ? loanItem.loanStatus
              : Math.sign(checkOverdue(loanItem.dop)) === -1
              ? checkOverdue(loanItem.dop)
              : "Not overdue",
        }));

  return (
    <div className="card">
      <div className="card-body">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
            User application and loan cases
          </div>
          <div className="p-4">
            <SimpleDataTable
              columns={columns}
              rows={rows}
              emptyMessage="No user loan cases found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
