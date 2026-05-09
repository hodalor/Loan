const _sortLoans = async (loans) => {
  let lon =
    loans === undefined || loans === null || loans.length === 0
      ? []
      : await loans.map((item) => {
          return { ...item, doa: new Date(item.doa) };
        });

  const sortedAsc =
    lon.length === 0 ? [] : await lon.sort((a, b) => b.doa - a.doa);

  return sortedAsc;
};

export default _sortLoans;
