import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import { DetailMatrix, DetailSectionCard, DetailSectionHint } from "../../DetailSectionCard";

export default function PersonalInfo() {
  const { loan, customers } = React.useContext(GlobalContext);
  const customersList = Array.isArray(customers) ? customers : [];
  const customer = customersList.find((item) => item.userId === loan.userId);
  const contacts = Array.isArray(customer?.contacts) ? customer.contacts : [];
  const totalContacts = contacts.length;
  const fullName =
    [
      customer?.IDinfo?.firstName,
      customer?.IDinfo?.middleName,
      customer?.IDinfo?.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "-";
  const dob = customer?.pesonalInfo?.dob;
  const dobText = dob ? new Date(dob).toLocaleDateString() : "-";
  const rows = [
    [
      { type: "label", content: "Name" },
      { content: fullName },
      { type: "label", content: "ID Number" },
      { content: customer?.IDinfo?.gCardNumber || "-" },
      { type: "label", content: "ID Type" },
      { content: "GHANA CARD" },
    ],
    [
      { type: "label", content: "Gender" },
      { content: customer?.IDinfo?.gender || "-" },
      { type: "label", content: "Education" },
      { content: customer?.pesonalInfo?.educationalLevel || "-" },
      { type: "label", content: "Marital Status" },
      { content: customer?.pesonalInfo?.maritalStatus || "-" },
    ],
    [
      { type: "label", content: "Area Name" },
      { content: customer?.pesonalInfo?.areaName || "-", colSpan: 5 },
    ],
    [
      { type: "label", content: "Landmark" },
      { content: customer?.pesonalInfo?.landMark || "-", colSpan: 5 },
    ],
    [
      { type: "label", content: "GPS information when submit order" },
      { content: customer?.pesonalInfo?.gpsAddress || "-", colSpan: 5 },
    ],
    [
      { type: "label", content: "Digital Address" },
      { content: customer?.pesonalInfo?.dAddress || "-" },
      { type: "label", content: "Time Of Residence(years)" },
      { content: customer?.pesonalInfo?.residenceTime || "-" },
      { type: "label", content: "Application Phone Number" },
      { content: customer?.phone || "-" },
    ],
    [
      { type: "label", content: "Total Phone Book" },
      { content: `${totalContacts} contacts found` },
      { type: "label", content: "Alternative Number" },
      { content: customer?.pesonalInfo?.bUPphone || "-" },
      { type: "label", content: "Main Source Of Income" },
      { content: customer?.pesonalInfo?.incomeSource || "-" },
    ],
    [
      { type: "label", content: "Date Of Birth" },
      { content: dobText },
      { type: "label", content: "Number Dependent" },
      { content: customer?.pesonalInfo?.relativesINOC || "-" },
      { type: "label", content: "Work" },
      { content: customer?.workInfo?.workContent || "-" },
    ],
  ];

  return (
    <DetailSectionCard
      title="Personal information"
      subtitle="Customer profile, residence details, and application contact information."
    >
      <DetailSectionHint text="This section now handles missing customer fields safely instead of crashing the page." />
      <DetailMatrix rows={rows} />
    </DetailSectionCard>
  );
}
