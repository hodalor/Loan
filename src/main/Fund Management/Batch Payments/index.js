import React from "react";
import FundRequestsWorkspace from "../FundRequestsWorkspace";

export default function BatchPayments() {
  return (
    <FundRequestsWorkspace
      title="Batch Upload"
      description="Import payment batches from xlsx, fetch employee department/group/salary details by username, and approve batch rows item by item through two-step approval."
      requestType="payment"
      requestMode="batch"
    />
  );
}
