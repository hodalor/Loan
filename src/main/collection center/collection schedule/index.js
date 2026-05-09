import React from "react";
import SchedulePlannerPage from "../../../components/schedule/SchedulePlannerPage";

const staffOptions = [
  { label: "COL-Prince", value: "prince" },
  { label: "COL-Abigail", value: "abigail" },
  { label: "COL-Amanda", value: "amanda" },
  { label: "COL-Florence", value: "florence" },
  { label: "COL-Gloria", value: "gloria" },
  { label: "COL-Abdulla", value: "abdulla" },
  { label: "COL-Daniel", value: "daniel" },
];

export default function CollectionSchedule() {
  return (
    <SchedulePlannerPage
      title="Collection Schedule"
      description="Organize collection rotations and weekly coverage with a cleaner planning board."
      tabs={[
        { id: "first-collection", label: "First Collection Schedule" },
        { id: "collection", label: "Collection Schedule" },
      ]}
      staffOptions={staffOptions}
      autoAssignLabel="Turn on auto assign"
    />
  );
}
