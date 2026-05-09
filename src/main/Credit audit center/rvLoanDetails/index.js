import React from "react";
import BasicInfo from "../../../components/tables/loanDetial/tableCompanents/Basic information";
import IdentityInfo from "../../../components/tables/loanDetial/tableCompanents/identity info";
import JobInfo from "../../../components/tables/loanDetial/tableCompanents/Job Info";
import PaymentMethod from "../../../components/tables/loanDetial/tableCompanents/Payment Method";
import PersonalInfo from "../../../components/tables/loanDetial/tableCompanents/personal Info";
import PhoneBook from "../../../components/tables/loanDetial/tableCompanents/Phone Book";
import ReviewCallRecords from "../../../components/tables/loanDetial/tableCompanents/review Call Record";
import ReviewResult from "../../../components/tables/loanDetial/tableCompanents/Review Result";
import UserLoanRecords from "../../../components/tables/loanDetial/tableCompanents/user Loan Records";

export default function ReviewLoanDetails() {
  return (
    <div className="Container">
      <div>
        <BasicInfo />
      </div>
      <div>
        <IdentityInfo />
      </div>
      <div>
        <PhoneBook title="" />
      </div>
      <div>
        <ReviewCallRecords />
      </div>
      <div>
        <PersonalInfo />
      </div>
      <div>
        <PaymentMethod />
      </div>
      <div>
        <JobInfo />
      </div>
      <div>
        <UserLoanRecords />
      </div>
      <div>
        <ReviewResult />
      </div>
    </div>
  );
}
