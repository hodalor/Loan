import React from "react";
import { GlobalContext } from "../../../../libs/context/globalContext";
import SimpleDataTable from "../../SimpleDataTable";

export default function PaymentPlan() {
  const { loan } = React.useContext(GlobalContext);

  const calcDateDiff = (loanItem) => {
    const paidDate = new Date(loanItem.dp);
    const dueDate = new Date(loanItem.dop);
    const timeDiff = paidDate.getTime() - dueDate.getTime();
    return parseInt(timeDiff / (1000 * 3600 * 24), 10);
  };

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
            overdueDays: loan.caseStatus === "Completed" ? calcDateDiff(loan) : -loan.dur,
            repaymentAmount:
              loan.repaymentAmount === undefined ? 0 : `GHC${loan.repaymentAmount}`,
            amountPaid:
              loan.amountPaid === null || loan.amountPaid === undefined
                ? "GHS0.00"
                : `GHC${loan.amountPaid}`,
            remainingAmount:
              loan.caseStatus === "Completed"
                ? "GHC0.00"
                : loan.amountPaid === "" || loan.amountPaid === undefined
                ? `GHC${loan.repaymentAmount}`
                : `GHC${(
                    parseFloat(loan.repaymentAmount) -
                    parseFloat(loan.amountPaid) +
                    -(2 / 100) * parseInt(loan.amount, 10) * loan.dur
                  ).toFixed(2)}`,
            amountLeft:
              loan.amountPaid === "" || loan.amountPaid === undefined
                ? `GHC${loan.repaymentAmount}`
                : `GHC${(
                    parseFloat(loan.repaymentAmount) - parseFloat(loan.amountPaid)
                  ).toFixed(2)}`,
            overduePenalty:
              loan.caseStatus === "Completed"
                ? `GHC${-(2 / 100) * parseInt(loan.amount, 10) * -calcDateDiff(loan)}`
                : `GHC${-(2 / 100) * parseInt(loan.amount, 10) * loan.dur}`,
          },
        ];

  return (
    <div className="card">
      <div className="card-body">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
            Repayment Plan
          </div>
          <div className="p-4">
            <SimpleDataTable
              columns={columns}
              rows={rows}
              rowKey="id"
              emptyMessage="No repayment plan found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
