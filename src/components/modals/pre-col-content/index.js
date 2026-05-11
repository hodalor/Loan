import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import SharedGroupAssignment from "../sharedGroupAssignment";

export default function PreModalContent(props) {
  const { _handlePreAssignCase, _handleReAssignPreCase } =
    React.useContext(GlobalContext);

  return (
    <SharedGroupAssignment
      department="pre-collection"
      roles={["pre-team-lead", "pre-personel"]}
      title={props.title}
      assignAction={_handlePreAssignCase}
      reassignAction={_handleReAssignPreCase}
      actionKeys={{ assign: "precollection-assign", reassign: "precollection-reassign" }}
      actionLabel={props.title === "re-assign" ? "Reassign Selected" : "Assign Selected"}
      singleReassignLabel="Reassign"
    />
  );
}
