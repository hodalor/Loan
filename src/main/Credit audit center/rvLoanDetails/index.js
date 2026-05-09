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
import LoanDetailsPageShell, {
  LoanDetailSectionBoundary,
} from "../../../components/tables/loanDetial/LoanDetailsPageShell";

export default function ReviewLoanDetails() {
  return (
    <LoanDetailsPageShell emptyRedirect="/order-list">
      <div className="Container">
        <LoanDetailSectionBoundary title="Basic information">
          <BasicInfo />
        </LoanDetailSectionBoundary>
        <LoanDetailSectionBoundary title="Internal matching information">
          <IdentityInfo />
        </LoanDetailSectionBoundary>
        <LoanDetailSectionBoundary title="Address book">
          <PhoneBook title="" />
        </LoanDetailSectionBoundary>
        <LoanDetailSectionBoundary title="Message record">
          <ReviewCallRecords />
        </LoanDetailSectionBoundary>
        <LoanDetailSectionBoundary title="Personal information">
          <PersonalInfo />
        </LoanDetailSectionBoundary>
        <LoanDetailSectionBoundary title="Collection method information">
          <PaymentMethod />
        </LoanDetailSectionBoundary>
        <LoanDetailSectionBoundary title="Job information">
          <JobInfo />
        </LoanDetailSectionBoundary>
        <LoanDetailSectionBoundary title="User application and loan cases">
          <UserLoanRecords />
        </LoanDetailSectionBoundary>
        <LoanDetailSectionBoundary title="Credit audit result">
          <ReviewResult />
        </LoanDetailSectionBoundary>
      </div>
    </LoanDetailsPageShell>
  );
}
