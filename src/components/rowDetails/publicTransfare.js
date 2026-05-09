import React from "react";
import UploadFile from "../inputs/fileUpload";
import { GlobalContext } from "../../libs/context/globalContext";
import MyModal from "../modals";
import BigLoader from "../loaders/bigLoader";

export default function PublicTransfare() {
  const {
    loan,
    radio,
    setRadio,
    modalTitle,
    setmodalTitle,
    setAlerts,
    alerts,
    _handleConfirmClearPublic,
    bigLoader,
    _hasAccess,
  } = React.useContext(GlobalContext);

  const [area, setArea] = React.useState("");
  const canReviewPayments = _hasAccess("action:payment:review");
  const reductionAmount =
    loan.amountPaid === undefined
      ? parseFloat(loan.repaymentAmount) +
        (2 / 100) * loan.amount * -loan.dur -
        parseFloat(loan.clearanceRecord.amountPaid)
      : parseFloat(loan.repaymentAmount) +
        (2 / 100) * loan.amount * -loan.dur -
        (parseFloat(loan.amountPaid) +
          parseFloat(loan.clearanceRecord.amountPaid));
  const remainingAmount =
    Math.sign(loan.dur) === -1
      ? loan.amountPaid === undefined
        ? parseFloat(loan.repaymentAmount) +
          (2 / parseInt(loan.amount, 10)) * 100 * -loan.dur -
          parseFloat(loan.clearanceRecord.amountPaid)
        : parseFloat(loan.repaymentAmount) +
          (2 / parseInt(loan.amount, 10)) * 100 * -loan.dur -
          (parseFloat(loan.clearanceRecord.amountPaid) +
            parseFloat(loan.amountPaid))
      : loan.amountPaid === undefined
      ? parseFloat(loan.repaymentAmount) -
        parseFloat(loan.clearanceRecord.amountPaid)
      : parseFloat(loan.repaymentAmount) -
        (parseFloat(loan.clearanceRecord.amountPaid) +
          parseFloat(loan.amountPaid));
  const detailRows = [
    { label: "Record Type", value: loan.clearanceRecord.recordType },
    { label: "Order ID", value: loan.ID },
    { label: "User ID", value: loan.userId },
    { label: "Actual Repayment Date", value: new Date(loan.dop).toLocaleDateString() },
    { label: "Repayment Amount", value: loan.clearanceRecord.amountPaid },
    { label: "Remaining Repayment Amount", value: remainingAmount },
    { label: "Remarks", value: loan.clearanceRecord.remarks },
  ];

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-body space-y-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Public Transfer Review
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Validate uploaded proof, confirm the repayment result, and post the final decision.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {detailRows.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {item.value ?? "-"}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold text-slate-900">Proof</p>
              <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <img
                  alt="proof"
                  className="max-h-[220px] rounded-xl object-contain"
                  src={loan.clearanceRecord.recordProofAudit}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div>
                <label className="app-label">Upload Proof</label>
                <UploadFile />
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-900">Audit Result</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {["pass", "reject"].map((value) => (
                    <label
                      key={value}
                      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
                        radio === value
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      } ${canReviewPayments ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                    >
                      <input
                        type="radio"
                        name="public-transfer-audit-result"
                        value={value}
                        disabled={!canReviewPayments}
                        checked={radio === value}
                        onChange={(e) => setRadio(e.target.value)}
                        className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {value === "pass" ? "Pass" : "Reject"}
                    </label>
                  ))}
                </div>
              </div>

              {radio === "reject" ? (
                <div className="mt-4">
                  <label className="app-label">Remark</label>
                  <textarea
                    onChange={(e) => setArea(e.target.value)}
                    rows={3}
                    value={area}
                    className="app-input min-h-[96px] resize-none"
                    placeholder="Enter rejection remark"
                  />
                </div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  className="app-btn-primary gap-2"
                  disabled={!canReviewPayments}
                  onClick={() => {
                    if (radio === "")
                      return setAlerts({
                        ...alerts,
                        type: "warning",
                        msg: "please select a result",
                        open: true,
                      });

                    if (radio !== "" && radio === "reject" && area === "")
                      return setAlerts({
                        ...alerts,
                        type: "warning",
                        msg: "please provide a remark",
                        open: true,
                      });

                    setmodalTitle("publicT");
                  }}
                >
                  <i className="fa fa-save text-sm" /> Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {modalTitle === "publicT" ? (
        <MyModal>
          <div className="relative w-full max-w-xs p-4">
            {bigLoader ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-900/45">
                <BigLoader />
              </div>
            ) : null}
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-base font-semibold text-slate-900">Confirm</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">Order ID</span>
                <span>{loan.ID}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">Reduction Amount</span>
                <span>{reductionAmount}</span>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="app-btn-secondary px-4"
                onClick={() => setmodalTitle("")}
              >
                <i className="fa fa-times text-sm" />
              </button>
              <button
                type="button"
                className="app-btn-primary px-4"
                onClick={() => _handleConfirmClearPublic(area)}
              >
                <i className="fa fa-check text-sm" />
              </button>
            </div>
          </div>
        </MyModal>
      ) : null}
    </div>
  );
}
