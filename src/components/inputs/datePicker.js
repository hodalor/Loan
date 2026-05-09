import * as React from "react";
import { GlobalContext } from "../../libs/context/globalContext";

export default function MyDatePicker() {
  const { inputs, _handleOnChange } = React.useContext(GlobalContext);

  return (
    <input
      type="date"
      className="block min-h-[44px] w-full rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      value={inputs.date || ""}
      onChange={(event) =>
        _handleOnChange({
          field: "date",
          value: event.target.value,
        })
      }
      aria-label="Date"
    />
  );
}
