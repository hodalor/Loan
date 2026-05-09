import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";

export default function useResolvedLoanDetails() {
  const {
    loan,
    loans,
    customer,
    customers,
    customerProfileLoading,
    _loadCustomerDetails,
  } = React.useContext(GlobalContext);

  const resolvedLoan = React.useMemo(() => {
    const loansList = Array.isArray(loans) ? loans : [];

    if (!loan || Object.keys(loan).length === 0) return {};

    const exactLoan = loansList.find((item) => item?.ID === loan?.ID);
    return exactLoan || loan;
  }, [loan, loans]);

  const customerSummary = React.useMemo(() => {
    const customersList = Array.isArray(customers) ? customers : [];

    if (!resolvedLoan?.userId) return null;
    return customersList.find((item) => item?.userId === resolvedLoan.userId) || null;
  }, [customers, resolvedLoan?.userId]);

  const resolvedCustomer =
    customer?.userId && customer.userId === resolvedLoan?.userId ? customer : customerSummary;

  React.useEffect(() => {
    if (!customerSummary?._id) return;
    if (customer?.userId === resolvedLoan?.userId && Object.keys(customer || {}).length !== 0) return;

    _loadCustomerDetails(customerSummary, { silent: true });
  }, [
    _loadCustomerDetails,
    customer,
    customerSummary,
    resolvedLoan?.userId,
  ]);

  return {
    loan: resolvedLoan,
    customer: resolvedCustomer || {},
    customerProfileLoading,
  };
}
