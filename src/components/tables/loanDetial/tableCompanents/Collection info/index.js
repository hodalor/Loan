import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";

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

  return (
    <div>
      <div className="card">
        <div className="card-body">
          <div className="row">
            <div
              className="col"
              style={{
                backgroundColor: "#79bbff",
                height: "2.5rem",
                display: "flex",
                alignItems: "center",
                color: "white ",
              }}
            >
              Collection Information
            </div>
          </div>
          <div className="row" style={{ height: "2.5rem" }}>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Loan ID
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.ID === undefined ? "" : loan.ID}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Remaining Amount
            </div>
            <div className=" col-2 border" style={{}}>
              GHS
              {loan.caseStatus === "Completed"
                ? parseFloat(loan.repaymentAmount) -
                  parseFloat(loan.amountPaid) +
                  (2 / 100) * parseInt(loan.amount) * _calcDAte(loan)
                : loan === undefined || loan.amountPaid === undefined
                ? loan.repaymentAmount
                : (
                    parseFloat(loan.repaymentAmount) -
                    parseFloat(loan.amountPaid)
                  ).toFixed(2)}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Overdue Penalty
            </div>
            <div className=" col-2 border" style={{}}>
              GHS
              {loan.caseStatus === "Completed"
                ? (2 / 100) * parseInt(loan.amount) * _calcDAte(loan)
                : overduPenalty}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Amout Payable
            </div>
            <div className=" col-2 border" style={{}}>
              GHS
              {loan.caseStatus === "Completed"
                ? parseFloat(loan.repaymentAmount) -
                  parseFloat(loan.amountPaid) +
                  (2 / 100) * parseInt(loan.amount) * _calcDAte(loan)
                : (
                    parseFloat(loan.repaymentAmount) -
                    parseFloat(loan.amountPaid) +
                    overduPenalty
                  ).toFixed(2)}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Collection completion date
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.dp === undefined || loan.dp === null
                ? ""
                : new Date(loan.dp).toLocaleDateString()}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Collection Staff
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.collofficer === undefined ? "" : loan.collofficer}
            </div>
          </div>
          <div className="row" style={{ height: "2.5rem" }}>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Due Date
            </div>
            <div className=" col-2" style={{}}>
              {loan.dop === undefined
                ? ""
                : new Date(loan.dop).toLocaleDateString()}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Overdue days
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.caseStatus === "Completed"
                ? _calcDAte(loan)
                : loan === undefined
                ? 0
                : -loan.dur}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              casae status
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.paymentStatus === undefined ? "" : loan.paymentStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
