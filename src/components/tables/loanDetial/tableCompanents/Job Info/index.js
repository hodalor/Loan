import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import { DetailMatrix, DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";

export default function JobInfo() {
  const { loan, customers } = React.useContext(GlobalContext);

  const customersList = Array.isArray(customers) ? customers : [];
  const customer = customersList.find((item) => item.userId === loan.userId);
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
      <DetailSectionHint text="This section summarizes the customer work profile captured during application." />
      <DetailMatrix rows={rows} />
    </DetailSectionCard>
  );
}
