import React, { useState, useEffect } from "react";
import AppToast from "../feedback/AppToast";

const NoInternetConnection = (props) => {
  const [isOnline, setOnline] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline = () => {
      setOnline(true);
      setOpen(true);
    };

    const handleOffline = () => {
      setOnline(false);
      setOpen(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div>
      {props.children}
      <AppToast
        open={open}
        type={isOnline ? "success" : "warning"}
        message={isOnline ? "You are back online" : "No internet connection"}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

export default NoInternetConnection;
