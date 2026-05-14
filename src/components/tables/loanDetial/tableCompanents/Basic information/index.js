import React from "react";
import { DetailMatrix, DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";
import useResolvedLoanDetails from "../../useResolvedLoanDetails";

export default function BasicInfo(props) {
  const { loan, customerProfileLoading } = useResolvedLoanDetails();
  const applyTime = loan?.doa ? new Date(loan.doa).toLocaleString() : "-";
  const rows = [
    [
      { type: "label", content: "Loan ID" },
      { content: loan?.ID || "-" },
      { type: "label", content: "Audit Status" },
      { content: loan?.rvOfName === "" ? "Case Not Assigned" : "Case Assigned" },
      { type: "label", content: "Apply Time" },
      { content: applyTime },
    ],
    [
      { type: "label", content: "Products Name" },
      { content: loan?.productName || "PathWay" },
      { type: "label", content: "Apply Amount" },
      { content: loan?.amount || "-" },
      { type: "label", content: "Loan Purpose" },
      { content: loan?.usage || "-" },
    ],
    [
      { type: "label", content: "Loan term" },
      { content: loan?.duration || "-" },
      { type: "label", content: "User ID" },
      { content: loan?.userId || "-" },
      { type: "label", content: "Score card model results" },
      { content: loan?.scoreCard || "-" },
    ],
    [
      { type: "label", content: "Provider" },
      { content: loan?.disbursementProvider || "-" },
      { type: "label", content: "Channel" },
      { content: loan?.disbursementChannel || "-" },
      { type: "label", content: "Service provider" },
      { content: loan?.paymentOperator || "-" },
    ],
    [
      { type: "label", content: "Payout status" },
      { content: loan?.payoutStatus || "-" },
      { type: "label", content: "Gateway message" },
      { content: loan?.payoutMessage || "-" },
      { type: "label", content: "Disbursed" },
      { content: loan?.isDisbursed === true ? "Yes" : "No" },
    ],
  ];

  return (
    <DetailSectionCard
      title="Basic information"
      subtitle="Core application data stored for the selected loan."
    >
      <DetailSectionHint
        text={
          customerProfileLoading
            ? "Loading the most complete case information available."
            : "This section uses the resolved current loan record, not just the row opened from the list."
        }
      />
      <DetailMatrix rows={rows} />
    </DetailSectionCard>
  );
}
