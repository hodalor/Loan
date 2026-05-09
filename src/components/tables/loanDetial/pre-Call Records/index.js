import React from "react";
import { GlobalContext } from "../../../../libs/context/globalContext";
import SimpleDataTable from "../../SimpleDataTable";

export default function PreCallRecords() {
  const { loan } = React.useContext(GlobalContext);
  const preCallRecords = loan.preCollCallRecords;

  const columns = [
    {
      key: "calledNumber",
      label: "Called Number",
      cellClassName: "font-semibold text-slate-900",
    },
    { key: "relation", label: "Relationship" },
    { key: "callResult", label: "Call Result" },
    { key: "calldate", label: "Creation Date" },
    { key: "preCollOfficer", label: "Credit Audit Employee" },
    { key: "remarks", label: "Remarks" },
  ];

  const rows =
    preCallRecords === undefined || preCallRecords.length === 0
      ? []
      : preCallRecords.map((callRecord, index) => ({
          ...callRecord,
          id: index + 1,
          calldate: callRecord?.callDate
            ? new Date(callRecord.callDate).toLocaleDateString()
            : "-",
        }));

  return (
    <div className="card">
      <div className="card-body">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
            Pre-collection call records
          </div>
          <div className="p-4">
            <SimpleDataTable
              columns={columns}
              rows={rows}
              emptyMessage="No pre-collection call records found."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
