const _findByDate = async (data) => {
  const { date, completed, assigned } = data;

  let firstDate = new Date(date[0]);
  let secondDate = new Date(date[1]);

  let comp = completed.filter(
    (loan) => new Date(loan.doa) > firstDate && new Date(loan.doa) < secondDate
  );

  let ass = assigned.filter(
    (loan) => new Date(loan.doa) > firstDate && new Date(loan.doa) < secondDate
  );

  return [comp, ass];
};

export default _findByDate;
