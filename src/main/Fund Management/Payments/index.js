import React from "react";
import FundRequestsWorkspace from "../FundRequestsWorkspace";

export default function FundPayments() {
  return (
    <FundRequestsWorkspace
      title="Payments"
      description="Create staff payment requests, review first approval, complete second approval, and keep actor names attached across the workflow."
      requestType="payment"
      requestMode="single"
    />
  );
}
