import React from "react";
import FailedDisbursements from "../failed disburse";

export default function BouncedBackDisbursements() {
  return (
    <FailedDisbursements
      queueMode="bounced-back"
      title="Bounced Back"
      description="Manage payout requests that were first accepted as pending and later failed from the gateway callback."
    />
  );
}
