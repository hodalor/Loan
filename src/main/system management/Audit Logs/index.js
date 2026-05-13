import React from "react";
import SystemLogsPage from "../SystemLogsPage";

export default function AuditLogs() {
  return (
    <SystemLogsPage
      title="Audit Logs"
      description="Full system activity timeline for payment events, admin login, configuration updates, and other tracked actions."
      endpoint="system-logs"
      showLevelFilter
    />
  );
}
