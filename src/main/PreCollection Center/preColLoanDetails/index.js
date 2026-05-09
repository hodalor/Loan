import React from "react";
import PhoneBook from "../../../components/tables/loanDetial/tableCompanents/Phone Book";

import IdentityInfo from "../../../components/tables/loanDetial/tableCompanents/identity info";
import JobInfo from "../../../components/tables/loanDetial/tableCompanents/Job Info";
import PersonalInfo from "../../../components/tables/loanDetial/tableCompanents/personal Info";
import ReviewCallRecords from "../../../components/tables/loanDetial/tableCompanents/review Call Record";
import UserLoanRecords from "../../../components/tables/loanDetial/tableCompanents/user Loan Records";
import PreCallRecords from "../../../components/tables/loanDetial/pre-Call Records";
import PreColInfo from "../../../components/tables/loanDetial/PreColInfor";
import PaymentPlan from "../../../components/tables/loanDetial/Payment Plan";

import ReviewFinalResult from "../../../components/tables/loanDetial/Review Final Result";
import ExtensionRecords from "../../../components/tables/loanDetial/tableCompanents/Extension records";
import { GlobalContext } from "../../../libs/context/globalContext";
import PaymentMethod from "../../../components/tables/loanDetial/tableCompanents/Payment Method";
import LoanDetailsPageShell from "../../../components/tables/loanDetial/LoanDetailsPageShell";

export default function PreLoanDetails() {
  const { loan } = React.useContext(GlobalContext);

  return (
    <LoanDetailsPageShell emptyRedirect="/advance-case-list">
      <div className="Container">
        <div className="">
          <PhoneBook title="precol" />
        </div>

        <div className="">
          <ReviewCallRecords />
        </div>

        <div className="">
          <PersonalInfo />
        </div>

        <div className="">
          <IdentityInfo />
        </div>

        <div className="">
          <JobInfo />
        </div>

        <div className="">
          <PreCallRecords />
        </div>
        <div className="">
          <PreColInfo />
        </div>
        <div className="">
          <PaymentPlan />
        </div>

        <div className="">
          <PaymentMethod />
        </div>

        <div className="">
          <UserLoanRecords />
        </div>
        <div className="">
          <ReviewFinalResult loanStatus={loan.loanStatus} />
        </div>
        <div className="">
          <ExtensionRecords />
        </div>
      </div>
    </LoanDetailsPageShell>
  );
}
