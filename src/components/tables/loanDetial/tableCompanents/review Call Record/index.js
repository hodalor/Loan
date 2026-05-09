import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import SimpleDataTable from "../../../SimpleDataTable";

export default function ReviewCallRecords() {
  const { loan } = React.useContext(GlobalContext);

  const callRecords = loan.auditCallRecords;
  const columns = [
    {
      key: "calledNumber",
      label: "Called Number",
      cellClassName: "font-semibold text-slate-900",
    },
    { key: "relation", label: "Relationship" },
    { key: "callResult", label: "Call Result" },
    { key: "callDate", label: "Creation Date" },
    { key: "auditOfficer", label: "Credit Audit Employee" },
    { key: "remarks", label: "Remarks" },
  ];

  const rows =
    callRecords === undefined || callRecords.length === 0
      ? []
      : callRecords.map((callRecord, index) => ({
          ...callRecord,
          id: index + 1,
          callDate: callRecord?.callDate
            ? new Date(callRecord.callDate).toLocaleDateString()
            : "-",
        }));

  return (
    <div className="card">
      <div className="card-body">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
            Review call records
          </div>
          <div className="p-4">
            <SimpleDataTable
              columns={columns}
              rows={rows}
              emptyMessage="No review call records found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
