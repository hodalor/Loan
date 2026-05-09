import * as React from "react";
import { GlobalContext } from "../../libs/context/globalContext";
import AppToast from "../feedback/AppToast";

export default function CustomizedSnackbars() {
  const { alerts, setAlerts } = React.useContext(GlobalContext);
  const closeAlert = React.useCallback(
    () =>
      setAlerts({
        open: false,
        msg: "",
        type: "info",
      }),
    [setAlerts]
  );

  return (
    <AppToast
      open={alerts.open}
      message={alerts.msg}
      type={alerts.type}
      onClose={closeAlert}
    />
  );
}
