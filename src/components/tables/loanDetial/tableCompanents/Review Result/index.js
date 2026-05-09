import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import DefaultLoader from "../../../../loaders/defaultLoader";
import UploadFile from "../../../../inputs/fileUpload";
import {
  DetailMatrix,
  DetailSectionCard,
  DetailSectionHint,
  StatusBadge,
} from "../../DetailSectionCard";

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
  const isAssigned = Boolean(loan?.rvOfName);
  const isPendingReview = loan?.loanStatus === "Review";
  const statusTone =
    loan?.loanStatus === "Rejected"
      ? "danger"
      : loan?.loanStatus === "Granted"
      ? "success"
      : "warning";
  const summaryRows = [
    [
      { type: "label", content: "Audit result" },
      {
        content: isAssigned
          ? loan?.loanStatus === "Review"
            ? "Waiting review results"
            : `Loan ${loan?.loanStatus || "-"}`
          : "Unassigned",
      },
      { type: "label", content: "Assigned officer" },
      { content: loan?.rvOfName || "-" },
      { type: "label", content: "Audit comment" },
      { content: loan?.rvOfCom || "-" },
    ],
  ];

  return (
    <DetailSectionCard
      title="Credit audit result"
      subtitle="Review decision, supporting notes, and evidence uploads."
    >
      {!isAssigned ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This case has not been assigned to a credit review staff member yet.
        </div>
      ) : (
        <>
          <DetailSectionHint text="Use this section to inspect the current review status and complete approval or rejection." />
          <DetailMatrix rows={summaryRows} />

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Audit status</h4>
                <p className="mt-1 text-sm text-slate-500">
                  {isPendingReview
                    ? "Choose whether to grant or reject this loan."
                    : "This case already has a final audit decision."}
                </p>
              </div>
              <StatusBadge tone={statusTone}>
                {isPendingReview ? "Pending review" : loan?.loanStatus || "Unknown"}
              </StatusBadge>
            </div>

            {isPendingReview ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
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
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
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
            ) : null}
          </div>

          {isPendingReview ? (
            <div className="mt-4 space-y-4">
              {loanState ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Audit comment
                  </span>
                  <textarea
                    disabled={globalLoader}
                    value={rvOfCom}
                    onChange={(e) => setRvOfCom(e.target.value)}
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="Please enter your comments here"
                    aria-label="Audit comment"
                  />
                </label>
              ) : null}

              {!canSubmitReview ? (
                <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Loan review actions are hidden by your current grants.
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Upload ID / proof
                  </span>
                  <UploadFile />
                </div>
                {inputs.image !== null ? (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={_handleUploadImage}
                      disabled={globalLoader}
                      className="app-btn-secondary min-w-[140px]"
                    >
                      {globalLoader ? <DefaultLoader /> : "Save image"}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => _handleLoanStatus({ loanState, rvOfCom, loan })}
                  disabled={globalLoader ? true : !canSubmitReview}
                  className="app-btn-primary"
                >
                  {globalLoader ? <DefaultLoader /> : "Submit audit result"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </DetailSectionCard>
  );
}
