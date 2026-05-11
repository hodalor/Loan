import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import SharedGroupAssignment from "../sharedGroupAssignment";

export default function AssignModalContent(props) {
  const { _handleAssignCase, _handleReAssignCase } = React.useContext(GlobalContext);

  return (
    <SharedGroupAssignment
      department="review"
      roles={["rv-team-lead", "rev-personel"]}
      title={props.title}
      assignAction={_handleAssignCase}
      reassignAction={_handleReAssignCase}
      actionKeys={{ assign: "credit-assign", reassign: "credit-reassign" }}
      actionLabel={props.title === "re-assign" ? "Reassign Selected" : "Assign Selected"}
      singleReassignLabel="Reassign"
    />
  );
}
