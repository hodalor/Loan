import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import SharedGroupAssignment from "../sharedGroupAssignment";

export default function ColModalContent(props) {
  const { _handleColAssignCase, _handleReAssignColCase } =
    React.useContext(GlobalContext);

  return (
    <SharedGroupAssignment
      department="collection"
      roles={["col-team-lead", "col-personel"]}
      title={props.title}
      assignAction={_handleColAssignCase}
      reassignAction={_handleReAssignColCase}
      actionKeys={{ assign: "collection-assign", reassign: "collection-reassign" }}
      actionLabel={props.title === "re-assign" ? "Reassign Selected" : "Assign Selected"}
      singleReassignLabel="Reassign"
    />
  );
}
