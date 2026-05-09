import React from "react";
import SchedulePlannerPage from "../../../components/schedule/SchedulePlannerPage";

const staffOptions = [
  { label: "Pre-Flourence", value: "florence" },
  { label: "Pre-Gloria", value: "gloria" },
  { label: "Pre-Abdulla", value: "abdulla" },
  { label: "Pre-Daniel", value: "daniel" },
];

export default function PreCollectionSchedule() {
  return (
    <SchedulePlannerPage
      title="Precollection Schedule"
      description="Plan early follow-up and precollection staffing with a clean weekly board."
      tabs={[
        { id: "first-advance", label: "First Advance Schedule" },
        { id: "precollection", label: "Precollection Schedule" },
      ]}
      staffOptions={staffOptions}
    />
  );
}
    
