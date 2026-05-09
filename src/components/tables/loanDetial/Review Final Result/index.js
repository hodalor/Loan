import React from "react";
import { GlobalContext } from "../../../../libs/context/globalContext";

export default function ReviewFinalResult(props) {
  const { loan } = React.useContext(GlobalContext);
  const status = props.loanStatus;

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
              Credit audit result
            </div>
          </div>
          <div className="row">
            <div
              className=" col-2 border"
              style={{ backgroundColor: "#f2f6fc" }}
            >
              Audit result
            </div>
            <div className=" col-6 border" style={{ height: "2.5rem" }}>
              Audit Result:{" "}
              {status === "Granted" ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span>Granted</span>
                  <span>{loan.rvOfCom === undefined ? "" : loan.rvOfCom}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                  <span>Rejected</span>
                  <span>{loan.rvOfCom === undefined ? "" : loan.rvOfCom}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
