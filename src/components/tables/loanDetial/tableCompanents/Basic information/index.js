import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";

export default function BasicInfo(props) {
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
              Basic Information
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Loan ID
            </div>
            <div className=" col-2 border">
              {loan.ID}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Audit Status
            </div>
            <div className=" col-2 border">
            {loan.rvOfName === "" ? "Case Not Assigned " : "Case Assigned"}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Apply Time
            </div>
            <div className=" col-2 border">
             {new Date(loan.doa).toLocaleDateString()}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Products Name
            </div>
            <div className=" col-2 border" style={{height:"2.5rem"}}>
              PathWay
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Apply Amount
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.amount}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Loan Purpose
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.usage}
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Loan term
            </div>
            <div className=" col-2" style={{}}>
              {loan.duration}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              User ID
            </div>
            <div className=" col-2 border" style={{}}>
              {loan.userId}
            </div>
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Score card model results
            </div>
            <div className=" col-2 border" style={{}}>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
