import React from "react";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import { GlobalContext } from "../../libs/context/globalContext";

export default function CustomDateRangeInputs() {
  const { dateRange, _handleOnChange } = React.useContext(GlobalContext);

  return (
    <div className="w-full min-w-0">
      <DateRangePicker
        className="app-range-picker"
        calendarIcon={null}
        clearIcon={null}
        dayPlaceholder="DD"
        monthPlaceholder="MM"
        yearPlaceholder="YYYY"
        onChange={(value) =>
          _handleOnChange({
            field: "dateRange",
            value,
          })
        }
        value={dateRange}
      />
    </div>
  );
}
