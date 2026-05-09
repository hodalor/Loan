import SchedulePlannerPage from "../../../components/schedule/SchedulePlannerPage";

const staffOptions = [
  { label: "RV-Prince", value: "RV-PRINCE" },
  { label: "RV-Abigail", value: "abigail" },
  { label: "RV-Amanda", value: "manda" },
  { label: "RV-Florence", value: "florence" },
  { label: "RV-Gloria", value: "gloria" },
  { label: "RV-Abdulla", value: "abdulla" },
  { label: "RV-Daniel", value: "daniel" },
];

export default function ReviewStaffSchedule() {
  return (
    <SchedulePlannerPage
      title="Review Staff Schedule"
      description="Manage first audit and follow-up review staffing calendars without the old grid."
      tabs={[
        { id: "first-audit", label: "First Audit Staff" },
        { id: "audit", label: "The Audit Staff" },
      ]}
      staffOptions={staffOptions}
    />
  );
}
