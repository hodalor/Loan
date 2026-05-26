import React from "react";
import SystemLogsPage from "../SystemLogsPage";

export default function CustomerLogs() {
  return (
    <SystemLogsPage
      title="Customer Logs"
      description="Customer-focused audit timeline for profile edits, block and unblock actions, identity updates, payment method changes, and related customer activity."
      endpoint="system-logs"
      showLevelFilter
      defaultRecordType="customer"
    />
  );
}
