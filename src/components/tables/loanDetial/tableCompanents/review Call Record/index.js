import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import SimpleDataTable from "../../../SimpleDataTable";
import { DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";

export default function ReviewCallRecords() {
  const { loan } = React.useContext(GlobalContext);

  const callRecords = Array.isArray(loan?.auditCallRecords)
    ? loan.auditCallRecords
    : [];
  const columns = [
    {
      key: "calledNumber",
      label: "Called number",
      cellClassName: "font-semibold text-slate-900",
    },
    { key: "relation", label: "Relationship" },
    { key: "callResult", label: "Call result" },
    { key: "callDate", label: "Creation time" },
    { key: "auditOfficer", label: "Credit review staff" },
    { key: "remarks", label: "Remarks" },
  ];

  const rows =
    callRecords.length === 0
      ? []
      : callRecords.map((callRecord, index) => ({
          ...callRecord,
          id: index + 1,
          callDate: callRecord?.callDate
            ? new Date(callRecord.callDate).toLocaleDateString()
            : "-",
        }));

  return (
    <DetailSectionCard
      title="Message record"
      subtitle="Phone verification and audit communication history for this case."
    >
      <DetailSectionHint text={`${rows.length} message record${rows.length === 1 ? "" : "s"} available.`} />
      <SimpleDataTable
        columns={columns}
        rows={rows}
        emptyMessage="No review call records found."
        dense
      />
    </DetailSectionCard>
  );
}
