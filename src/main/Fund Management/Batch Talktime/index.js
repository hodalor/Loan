import React from "react";
import FundRequestsWorkspace from "../FundRequestsWorkspace";

export default function BatchTalktime() {
  return (
    <FundRequestsWorkspace
      title="Batch Talktime"
      description="Import talktime batches from xlsx, fetch employee phone details by username, and review each row through the airtime approval workflow."
      requestType="airtime"
      requestMode="batch"
    />
  );
}
