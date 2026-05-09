import React from "react";
import StepperForm from "../../../components/stepper";

export default function OrderRepayment() {
  return (
    <div className="space-y-5">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Order Repayment</h3>
            <p className="text-sm text-slate-500">
              Search a loan, choose the repayment record type, and save the clearance in a compact flow.
            </p>
          </div>
        </div>
        <div className="app-panel-body">
          <StepperForm />
        </div>
      </section>
    </div>
  );
}
