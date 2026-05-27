import * as React from "react";
import MyDatePicker from "../inputs/datePicker";
import UploadFile from "../inputs/fileUpload";
import { GlobalContext } from "../../libs/context/globalContext";
import DefaultLoader from "../loaders/defaultLoader";

const RECORD_OPTIONS = [
  {
    value: "Repayment by public transfare",
    label: "Repayment by public transfer",
    description: "Upload proof and record a payment made outside the gateway.",
  },
  {
    value: "balance",
    label: "Balance",
    description: "Clear the outstanding balance without adding transfer proof.",
  },
];

const toMoney = (value = 0) => Number.parseFloat(Number(value || 0).toFixed(2));

const renderSummaryValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
};

export default function StepperForm() {
  const {
    activeStep,
    setActiveStep,
    selectedRadio,
    setSelectedRadio,
    inputs,
    _handleOnChange,
    handleNext,
    loan,
    _handleSubmitRecord,
    globalLoader,
  } = React.useContext(GlobalContext);

  const stepItems = React.useMemo(
    () => [
      { id: 0, label: "Loan lookup", description: "Confirm the loan and repayment record type." },
      { id: 1, label: "Record details", description: "Capture the supporting repayment details." },
    ],
    []
  );

  const handleBack = () => {
    setActiveStep((prevActiveStep) => Math.max(prevActiveStep - 1, 0));
  };

  const remainingAmount = React.useMemo(() => {
    if (!loan || !loan.repaymentAmount) return 0;

    return loan.amountPaid === undefined
      ? toMoney(loan.repaymentAmount)
      : toMoney(parseFloat(loan.repaymentAmount) - parseFloat(loan.amountPaid || 0));
  }, [loan]);

  const loanDueDate = React.useMemo(() => {
    if (!loan?.dop) return "-";
    return new Date(loan.dop).toLocaleDateString();
  }, [loan?.dop]);

  const summaryItems = [
    {
      label: "Record type",
      value:
        RECORD_OPTIONS.find((option) => option.value === selectedRadio)?.label ||
        renderSummaryValue(selectedRadio),
    },
    {
      label: "Order ID",
      value: renderSummaryValue(loan?.ID),
    },
    {
      label: "User ID",
      value: renderSummaryValue(loan?.userId),
    },
    {
      label: "Actual repayment date",
      value: loanDueDate,
    },
    {
      label: "Remaining repayment amount",
      value: remainingAmount ? remainingAmount.toFixed(2) : "0.00",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap gap-2">
        {stepItems.map((step) => {
          const isActive = activeStep === step.id;
          const isCompleted = activeStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              disabled={globalLoader}
              onClick={() => {
                if (step.id <= activeStep) {
                  setActiveStep(step.id);
                }
              }}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isActive
                  ? "border-orange-200 bg-orange-50 text-[var(--admin-accent-ink)]"
                  : isCompleted
                  ? "border-[var(--admin-border)] bg-[var(--admin-dark-soft)] text-[var(--admin-surface-dark-alt)]"
                  : "border-[var(--admin-border)] bg-white text-[var(--admin-text-muted)]",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                  isActive
                    ? "bg-[var(--admin-accent)] text-white"
                    : isCompleted
                    ? "bg-[var(--admin-surface-dark-alt)] text-white"
                    : "bg-slate-200 text-slate-600",
                ].join(" ")}
              >
                {step.id + 1}
              </span>
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <section className="rounded-2xl border border-[var(--admin-border)] bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-[var(--admin-text)]">
              {activeStep === 0 ? "Find order record" : "Record repayment details"}
            </h3>
            <p className="text-sm text-[var(--admin-text-muted)]">
              {stepItems[activeStep]?.description || "Capture the required order details."}
            </p>
          </div>

          {activeStep === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Loan ID
                </span>
                <input
                  type="text"
                  className="app-input"
                  placeholder="Enter loan ID"
                  aria-label="loanid"
                  value={inputs.loanId}
                  onChange={(e) =>
                    _handleOnChange({
                      field: "loanId",
                      value: e.target.value,
                    })
                  }
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  User ID
                </span>
                <input
                  type="text"
                  className="app-input"
                  placeholder="Enter user ID"
                  aria-label="userid"
                  value={inputs.userId}
                  onChange={(e) =>
                    _handleOnChange({
                      field: "userId",
                      value: e.target.value,
                    })
                  }
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Clearance date
                </span>
                <MyDatePicker />
              </label>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Record type
                </span>
                <div className="grid gap-2">
                  {RECORD_OPTIONS.map((option) => {
                    const isSelected = selectedRadio === option.value;

                    return (
                      <label
                        key={option.value}
                        className={[
                          "flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-2.5 transition",
                          isSelected
                            ? "border-orange-200 bg-orange-50"
                            : "border-[var(--admin-border)] bg-slate-50/60 hover:border-orange-100 hover:bg-white",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name="order-repayment-record-type"
                          className="mt-1 h-4 w-4 accent-orange-500"
                          checked={isSelected}
                          onChange={() => setSelectedRadio(option.value)}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[var(--admin-text)]">
                            {option.label}
                          </span>
                          <span className="block text-xs text-[var(--admin-text-muted)]">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : selectedRadio === "Repayment by public transfare" ? (
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Repayment amount
                  </span>
                  <input
                    type="text"
                    className="app-input"
                    placeholder="Enter repayment amount"
                    aria-label="repayment-amount"
                    value={inputs.amount}
                    onChange={(e) =>
                      _handleOnChange({
                        field: "amount",
                        value: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Remarks
                  </span>
                  <input
                    type="text"
                    className="app-input"
                    placeholder="Add a short remark"
                    aria-label="remarks"
                    value={inputs.remarks}
                    onChange={(e) =>
                      _handleOnChange({
                        field: "remarks",
                        value: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-[var(--admin-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--admin-text-soft)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-orange-500"
                  checked={Boolean(inputs.check)}
                  onChange={(e) =>
                    _handleOnChange({
                      field: "check",
                      value: e.target.checked,
                    })
                  }
                />
                <span>Reduction and settle current period/loan</span>
              </label>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Record proof
                </span>
                <UploadFile />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-[var(--admin-accent-ink)]">
              Clear the outstanding balance for this loan. The current remaining repayment amount is{" "}
              <span className="font-semibold">{remainingAmount.toFixed(2)}</span>.
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-[var(--admin-border)] bg-orange-50/30 p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Order summary</h3>
            <p className="text-xs text-slate-500">Review the selected order before saving.</p>
          </div>
          <div className="space-y-2">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-3 rounded-xl border border-white bg-white px-3 py-2"
              >
                <span className="text-xs font-medium text-slate-500">{item.label}</span>
                <span className="text-right text-sm font-semibold text-slate-900">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {activeStep > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={globalLoader}
            className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Back
          </button>
        ) : null}

        <button
          type="button"
          onClick={activeStep === stepItems.length - 1 ? _handleSubmitRecord : handleNext}
          disabled={globalLoader}
          className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {globalLoader ? (
            <DefaultLoader />
          ) : activeStep === stepItems.length - 1 ? (
            "Submit record"
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
