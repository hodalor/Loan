import React from "react";
import { GlobalContext } from "../../libs/context/globalContext";

export default function Home() {
  const { user, inComingLoans, loans, customers } = React.useContext(GlobalContext);

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-body flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
              Welcome
            </p>
            <h2 className="mt-3 text-4xl font-semibold text-slate-900">
              {user?.userName || "SPEED CASH"} Workspace
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Faster daily operations with a simpler navigation flow, cleaner
              tables, and a more focused lending workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Incoming Loans</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {inComingLoans?.length || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Total Loans</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {loans?.length || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Customers</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {customers?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
