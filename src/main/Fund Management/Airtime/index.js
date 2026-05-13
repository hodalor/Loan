import React from "react";
import FundRequestsWorkspace from "../FundRequestsWorkspace";

export default function FundAirtime() {
  return (
    <FundRequestsWorkspace
      title="Airtime"
      description="Create airtime requests, review them in one approval step, and move approved or rejected items into the completed records tab."
      requestType="airtime"
      requestMode="single"
    />
  );
}
