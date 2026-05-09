import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import DefaultLoader from "../../../../loaders/defaultLoader";
import UploadFile from "../../../../inputs/fileUpload";

export default function ReviewResult() {
  const {
    loan,
    globalLoader,
    _handleLoanStatus,
    inputs,
    _handleUploadImage,
    _hasAccess,
  } = React.useContext(GlobalContext);

  const [loanState, setLoanState] = React.useState("");
  const [rvOfCom, setRvOfCom] = React.useState("");
  const canApproveLoan = _hasAccess("action:loan:approve");
  const canRejectLoan = _hasAccess("action:loan:reject");
  const canSubmitReview = canApproveLoan || canRejectLoan;

  return (
    <div>
      {loan.rvOfName === "" ? null : (
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
              {loan.rvOfName === "" ? (
                "Un-assigned"
              ) : (
                <div className=" col-6 border" style={{ height: "2.5rem" }}>
                  Assigned:{" "}
                  {loan.loanStatus === "Review" ? (
                    <span> Waiting review results</span>
                  ) : (
                    <span> Loan {loan.loanStatus}</span>
                  )}
                </div>
              )}

              <div
                className=" col-2 border "
                style={{ backgroundColor: "#f2f6fc" }}
              >
                Attachment Data
              </div>
              <div className=" col-2 border" style={{}}>
                No data available
              </div>
            </div>
            <div className="row">
              <div
                className=" col-2 border"
                style={{ backgroundColor: "#f2f6fc" }}
              >
                Audit Status
              </div>
              <div className=" col-10 border">
                {loan.loanStatus !== "Review" ? (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      loan.loanStatus === "Rejected"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    <span>{loan.loanStatus === "Rejected" ? "Rejected" : "Granted"}</span>
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-4 px-3 py-3 text-sm">
                    <span className="w-full font-semibold text-slate-700">
                      Grant or reject loan
                    </span>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="loan-review-state"
                        value="granted"
                        disabled={globalLoader ? true : !canApproveLoan}
                        checked={loanState === "granted"}
                        onChange={(e) => setLoanState(e.target.value)}
                      />
                      <span>Grant loan</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="loan-review-state"
                        value="rejected"
                        disabled={globalLoader ? true : !canRejectLoan}
                        checked={loanState === "rejected"}
                        onChange={(e) => setLoanState(e.target.value)}
                      />
                      <span>Reject loan</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
            {loan.loanStatus !== "Review" ? null : (
              <div>
                {loanState === "" ? null : (
                  <div className="row">
                    <div
                      className=" col-2 border"
                      style={{ backgroundColor: "#f2f6fc" }}
                    >
                      Audit Comment
                    </div>
                    <div className=" col-10 border">
                      <textarea
                        style={{
                          width: "95%",
                          height: "3rem",
                          fontSize: 12,
                          margin: "0.7rem",
                        }}
                        disabled={globalLoader ? true : false}
                        type="text"
                        value={rvOfCom}
                        onChange={(e) => setRvOfCom(e.target.value)}
                        className="form-control"
                        placeholder="Please enter your comments here"
                        aria-label="text"
                      />
                    </div>
                  </div>
                )}

                {!canSubmitReview ? (
                  <div className="row">
                    <div className="col-12 border p-3 text-sm text-amber-600">
                      Loan review actions are hidden by your current grants.
                    </div>
                  </div>
                ) : null}

                <div className="row">
                  <div
                    className=" col-2 border"
                    style={{ backgroundColor: "#f2f6fc", height: "3rem" }}
                  >
                    {" "}
                    Upload ID
                  </div>
                  <div className=" col-md-4 border" style={{}}>
                    <UploadFile />
                  </div>
                  {inputs.image === null ? null : (
                    <button
                      type="button"
                      onClick={_handleUploadImage}
                      disabled={globalLoader ? true : false}
                      className="btn btn-primary"
                      style={{ height: "1.6rem", margin: "0.7rem" }}
                    >
                      {globalLoader ? <DefaultLoader /> : "Save image"}
                    </button>
                  )}
                </div>
                <div className="row">
                  <div
                    className=" col-2 border"
                    style={{ backgroundColor: "#f2f6fc", height: "3rem" }}
                  ></div>
                  <div className=" col-10 border" style={{}}>
                    <button
                      type="button"
                      onClick={() =>
                        _handleLoanStatus({ loanState, rvOfCom, loan })
                      }
                      disabled={globalLoader ? true : !canSubmitReview}
                      className="btn btn-primary"
                      style={{ height: "1.6rem", margin: "0.7rem" }}
                    >
                      {globalLoader ? <DefaultLoader /> : "Submit"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
