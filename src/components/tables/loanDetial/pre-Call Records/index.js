import React from "react";
import { GlobalContext } from "../../../../libs/context/globalContext";
import SimpleDataTable from "../../SimpleDataTable";
import { DetailSectionCard, DetailSectionHint } from "../DetailSectionCard";

export default function PreCallRecords() {
  const { loan } = React.useContext(GlobalContext);
  const preCallRecords = Array.isArray(loan?.preCollCallRecords)
    ? loan.preCollCallRecords
    : [];

  const columns = [
    {
      key: "calledNumber",
      label: "Called number",
      cellClassName: "font-semibold text-slate-900",
    },
    { key: "relation", label: "Relationship" },
    { key: "callResult", label: "Call result" },
    { key: "calldate", label: "Creation time" },
    { key: "preCollOfficer", label: "Pre-collection staff" },
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
    <DetailSectionCard
      title="Pre-collection call records"
      subtitle="Reminder calls and follow-up notes before the loan reaches collection."
    >
      <DetailSectionHint text={`${rows.length} pre-collection record${rows.length === 1 ? "" : "s"} available.`} />
      <SimpleDataTable
        columns={columns}
        rows={rows}
        emptyMessage="No pre-collection call records found."
        dense
      />
    </DetailSectionCard>
  );
}
