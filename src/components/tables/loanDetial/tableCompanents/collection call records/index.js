import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import SimpleDataTable from "../../../SimpleDataTable";
import { DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";

export default function CollectionCallRecords() {
  const { loan } = React.useContext(GlobalContext);
  const collectionRecords = Array.isArray(loan?.collCallRecords) ? loan.collCallRecords : [];

  const columns = [
    {
      key: "calledNumber",
      label: "Called number",
      cellClassName: "font-semibold text-slate-900",
    },
    { key: "relation", label: "Relationship" },
    { key: "callResult", label: "Call result" },
    { key: "creationDate", label: "Creation time" },
    { key: "collOfficer", label: "Collection staff" },
    { key: "remarks", label: "Remarks" },
  ];

  const rows =
    collectionRecords.length === 0
      ? []
      : collectionRecords.map((item, index) => ({
          ...item,
          id: index + 1,
          creationDate: item?.callDate
            ? new Date(item.callDate).toLocaleDateString()
            : "-",
        }));

  return (
    <DetailSectionCard
      title="Collection call records"
      subtitle="Follow-up calls, outcomes, and notes after the loan enters collection."
    >
      <DetailSectionHint text={`${rows.length} collection call record${rows.length === 1 ? "" : "s"} available.`} />
      <SimpleDataTable
        columns={columns}
        rows={rows}
        emptyMessage="No collection call records found."
        dense
      />
    </DetailSectionCard>
  );
}
