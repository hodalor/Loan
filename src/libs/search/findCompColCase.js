const _filterCompColCases = async (data) => {
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

  if (type === "Collection Staff") {
    filteredData = dataToFilter.filter((item) => item.collofficer === filter);
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

  if (type === "phone") {
    let customer = customers.find((custo) => custo.phone === filter);

    if (!customer) {
      filteredData = [];
    }

    if (customer) {
      filteredData = dataToFilter.filter(
        (item) => item.userId === customer.userId
      );
    }
  }

  if (type === "daysToFrom") {
    let startDay = filter.split("-")[0];
    let endDay = filter.split("-")[1];

    filteredData = dataToFilter.filter((item) => {
      let dur = -item.dur;

      return startDay <= dur && dur <= endDay;
    });
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

export default _filterCompColCases;
