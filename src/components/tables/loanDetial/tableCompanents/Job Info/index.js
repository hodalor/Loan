import React from "react";
import { DetailMatrix, DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";
import useResolvedLoanDetails from "../../useResolvedLoanDetails";

export default function JobInfo() {
  const { customer, customerProfileLoading } = useResolvedLoanDetails();
  const workInfo = customer?.workInfo || {};

  const rows = [
    [
      { type: "label", content: "Profession" },
      { content: workInfo.workContent || "-" },
      { type: "label", content: "Company Name" },
      { content: workInfo.workUnit || "-" },
      { type: "label", content: "Company Address" },
      { content: workInfo.workAddress || "-" },
    ],
    [
      { type: "label", content: "Work Email" },
      { content: customer?.email || "-" },
      { type: "label", content: "Monthly Income" },
      { content: workInfo.currentIncome ? `GHS ${workInfo.currentIncome}` : "-" },
      { type: "label", content: "Company City" },
      { content: workInfo.companyAddress || "-" },
    ],
    [
      { type: "label", content: "Company Industry" },
      { content: workInfo.industry || "-" },
      { type: "label", content: "Nearest Landmark" },
      { content: workInfo.LNDmarkCompany || "-" },
      { type: "label", content: "Working Hours" },
      { content: workInfo.workHours || "-" },
    ],
  ];

  return (
    <DetailSectionCard
      title="Job information"
      subtitle="Employment and workplace details used during review."
    >
      <DetailSectionHint
        text={
          customerProfileLoading
            ? "Loading the full employment profile recorded by the system."
            : "This section summarizes the customer work profile captured during application."
        }
      />
      <DetailMatrix rows={rows} />
    </DetailSectionCard>
  );
}
