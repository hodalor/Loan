import React from "react";
import { GlobalContext } from "../../../../libs/context/globalContext";
import {
  DetailMatrix,
  DetailSectionCard,
  DetailSectionHint,
  StatusBadge,
} from "../DetailSectionCard";

export default function ReviewFinalResult(props) {
  const { loan } = React.useContext(GlobalContext);
  const status = props.loanStatus;
  const tone = status === "Granted" ? "success" : "danger";
  const rows = [
    [
      { type: "label", content: "Audit result" },
      {
        content: (
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={tone}>{status || "-"}</StatusBadge>
            <span>{loan?.rvOfCom || "No comment available"}</span>
          </div>
        ),
      },
      { type: "label", content: "Attachment data" },
      { content: loan?.idImage ? "Attachment uploaded" : "No data available" },
    ],
  ];

  return (
    <DetailSectionCard
      title="Credit audit result"
      subtitle="Final review outcome shared across review, pre-collection, and collection detail pages."
    >
      <DetailSectionHint text="This panel stays read-only on follow-up detail pages and shows the final review decision." />
      <DetailMatrix rows={rows} />
    </DetailSectionCard>
  );
}
