import * as React from "react";
import { GlobalContext } from "../../libs/context/globalContext";

export default function BasicSelect(props) {
  const { select, _handleSelect } = React.useContext(GlobalContext);

  const _renderSelectValue = () => {
    if (props.title === "Loan type") return select.loanType;
    if (props.title === "Review Staff") return select.staff;
    if (props.title === "Days") return select.days;
    if (props.title === "Advance Staff") return select.advanceStaff;
    if (props.title === "Collection Staff") return select.collectionStaff;
    if (props.title === "Case Status") return select.caseStatus;
    if (props.title === "Advance Group") return select.advanceGroup;
    if (props.title === "Collection Group") return select.collectionGroup;
    if (props.title === "Review Group") return select.reviewGroup;
    if (props.title === "Roles*" || props.title === "Roles") return select.role;
    if (props.title === "Relationship") return select.relationship;
    if (props.title === "Call result") return select.callResult;
    if (props.title === "Departments*" || props.title === "Departments")
      return select.department;
    if (props.title === "Gender*") return select.gender;
  };

  return (
    <div className="w-full">
      <select
        className="block min-h-[44px] w-full rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        value={_renderSelectValue() || ""}
        onChange={(e) =>
          _handleSelect({ field: props.title, value: e.target.value })
        }
      >
        <option value="">{props.title}</option>
        {props.data.map((item, index) => {
          return (
            <option key={index} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
