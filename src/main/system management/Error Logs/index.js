import React from "react";
import SystemLogsPage from "../SystemLogsPage";

export default function ErrorLogs() {
  return (
    <SystemLogsPage
      title="Error Logs"
      description="Focused debugging view for warning, error, and fatal records, including source path, origin, actor, metadata, and raw error details."
      endpoint="system-logs/errors"
      showLevelFilter={false}
    />
  );
}
