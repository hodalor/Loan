import React from "react";
import { GlobalContext } from "../../../../libs/context/globalContext";

export default function PreColInfo() {
  const { loan } = React.useContext(GlobalContext);

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
              Pre-collection information
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Loan ID
            </div>
            <div className=" col-2 border" style={{}}>
              {loan === undefined ? "" : loan.ID}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Remaining repayment days
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.dur === 2 ? "T2" : loan.dur === 1 ? "T1" : "T0"}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Remaining repayment amount
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.amountPaid === undefined
                ? loan.repaymentAmount
                : parseInt(loan.repaymentAmount) - parseInt(loan.amountPaid)}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Case status
            </div>
            <div className=" col-2 border" style={{ height: "2rem" }}>
              {loan.paymentStatus === undefined ? "" : loan.paymentStatus}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Advance Employee
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.preCollOfficer === undefined ? "" : loan.preCollOfficer}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Repayment Date
            </div>
            <div className=" col-2 border" style={{}}>
              {loan === undefined
                ? ""
                : new Date(loan.dop).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
