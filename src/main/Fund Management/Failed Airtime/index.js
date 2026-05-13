import React from "react";
import FundRequestsWorkspace from "../FundRequestsWorkspace";

export default function FailedAirtime() {
  return (
    <FundRequestsWorkspace
      title="Failed Airtime"
      description="Hold failed single and batch airtime records and return them to the review queue when resend is needed."
      requestType="airtime"
      failedOnly
      requestModeFilter=""
    />
  );
}
