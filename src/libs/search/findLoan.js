const _filterLoan = async (data) => {
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

  if (type === "userId") {
    filteredData = dataToFilter.filter((item) => item.userId.trim() === filter);
  }

  if (type === "phone") {
    let customer = customers.find((custo) => custo.phone === filter);

    if (!customer) return (filteredData = []);

    if (customer) {
      filteredData = dataToFilter.filter(
        (item) => item.userId === customer.userId
      );
    }
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

export default _filterLoan;
