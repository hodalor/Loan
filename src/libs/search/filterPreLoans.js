const _filterPreCases = async (data) => {
  const { filterData, dataToFilter, customers } = data;

  let filteredData;

  let type = filterData.type;

  let filter;

  await filterData.filterArray.forEach((item) => {
    if (item !== "" && item !== null && item !== undefined)
      return (filter = item);
  });

  if (type === "loanId") {
    filteredData = dataToFilter.filter((item) => item.ID.trim() === filter);
  }

  if (type === "Days") {
    if (filter === "T0") {
      filteredData = dataToFilter.filter((item) => item.dur === 0);
    }

    if (filter === "T1") {
      filteredData = dataToFilter.filter((item) => item.dur === 1);
    }

    if (filter === "T2") {
      filteredData = dataToFilter.filter((item) => item.dur === 2);
    }
  }

  if (type === "Loan type") {
    if (filter === "firstLoan") {
      let custos = customers.filter((customer) => customer.loan.loans.length === 1);
      let customerIds = new Set(custos.map((cust) => cust.userId));
      let loans = dataToFilter.filter((loan) => customerIds.has(loan.userId));

      filteredData = loans;
    }

    if (filter === "reLoan") {
      let custos = customers.filter((customer) => customer.loan.loans.length > 1);
      let customerIds = new Set(custos.map((cust) => cust.userId));
      filteredData = dataToFilter.filter((loan) => customerIds.has(loan.userId));
    }
  }

  if (type === "userId") {
    filteredData = dataToFilter.filter((item) => item.userId.trim() === filter);
  }

  if (type === "dateRange") {
    let firstDate = new Date(filter[0]);
    let secondDate = new Date(filter[1]);

    let loans = dataToFilter.filter(
      (loan) =>
        new Date(loan.doa) > firstDate && new Date(loan.doa) < secondDate
    );

    filteredData = loans;
  }

  return filteredData;
};

export default _filterPreCases;
