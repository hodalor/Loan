import React from "react";
import PaymentPlan from "../../../components/tables/loanDetial/Payment Plan";
import PreCallRecords from "../../../components/tables/loanDetial/pre-Call Records";
import ReviewFinalResult from "../../../components/tables/loanDetial/Review Final Result";
import CollectionCallRecords from "../../../components/tables/loanDetial/tableCompanents/collection call records";
import CollectionInfo from "../../../components/tables/loanDetial/tableCompanents/Collection info";
import ExtensionRecords from "../../../components/tables/loanDetial/tableCompanents/Extension records";
import IdentityInfo from "../../../components/tables/loanDetial/tableCompanents/identity info";
import JobInfo from "../../../components/tables/loanDetial/tableCompanents/Job Info";
import PaymentMethod from "../../../components/tables/loanDetial/tableCompanents/Payment Method";
import PersonalInfo from "../../../components/tables/loanDetial/tableCompanents/personal Info";
import PhoneBook from "../../../components/tables/loanDetial/tableCompanents/Phone Book";
import ReviewCallRecords from "../../../components/tables/loanDetial/tableCompanents/review Call Record";
import UserLoanRecords from "../../../components/tables/loanDetial/tableCompanents/user Loan Records";
import { GlobalContext } from "../../../libs/context/globalContext";
import LoanDetailsPageShell from "../../../components/tables/loanDetial/LoanDetailsPageShell";

export default function CollectionLoanDetails() {
  const { loan } = React.useContext(GlobalContext);

  return (
    <LoanDetailsPageShell emptyRedirect="/collection-cases">
      <div className="Container">
        <div className="">
          <CollectionInfo />
        </div>
        <div className="">
          <PaymentPlan />
        </div>
        <div className="">
          <PaymentMethod />
        </div>
        <div className="">
          <PhoneBook title="col" />
        </div>
        <div className="">
          <ReviewCallRecords />
        </div>
        {loan.loanStatus === "Rejected" || loan.loanStatus === "Granted" ? (
          <div className="">
            <ReviewFinalResult loanStatus={loan.loanStatus} />
          </div>
        ) : null}
        <div className="">
          <PreCallRecords />
        </div>
        <div className="">
          <CollectionCallRecords />
        </div>
        <div className="">
          <PersonalInfo />
        </div>

        <div className="">
          <JobInfo />
        </div>
        <div className="">
          <IdentityInfo />
        </div>

        <div className="">
          <UserLoanRecords />
        </div>
        <div className="">
          <ExtensionRecords />
        </div>
      </div>
    </LoanDetailsPageShell>
  );
}
