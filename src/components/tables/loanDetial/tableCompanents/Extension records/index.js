import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import SimpleDataTable from "../../../SimpleDataTable";

export default function ExtensionRecords() {
  const { loan } = React.useContext(GlobalContext);

  const columns = [
    { key: "loanId", label: "Loan ID", cellClassName: "font-semibold text-slate-900" },
    { key: "extPeriod", label: "Extension Period" },
    { key: "extHandlingFee", label: "Extension handling fee" },
    { key: "createdAt", label: "Extension Date" },
    { key: "extExpDate", label: "Extension Expiry Date" },
    { key: "extensionStatus", label: "Extension Status" },
  ];

  const rows =
    loan.extRecords === undefined
      ? []
      : loan.extRecords.map((extRecord, index) => ({
          ...extRecord,
          id: index + 1,
        }));

  return (
    <div className="card">
      <div className="card-body">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
            Extension record
          </div>
          <div className="p-4">
            <SimpleDataTable
              columns={columns}
              rows={rows}
              emptyMessage="No extension records found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
