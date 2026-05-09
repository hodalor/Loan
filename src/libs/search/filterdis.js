const _filterDis = async (data) => {
  const { date, dataToFilter } = data;

  let firstDate = new Date(date[0]);
  let secondDate = new Date(date[1]);

  let loans = dataToFilter.filter(
    (loan) => new Date(loan.doa) > firstDate && new Date(loan.doa) < secondDate
  );

  return loans;
};

export default _filterDis;
