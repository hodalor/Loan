import React from "react";
import FundRequestsWorkspace from "../FundRequestsWorkspace";

export default function FailedPayments() {
  return (
    <FundRequestsWorkspace
      title="Failed Payments"
      description="Review failed single and batch payment sends, then resend them back into the approval and send workflow."
      requestType="payment"
      failedOnly
      requestModeFilter=""
    />
  );
}
