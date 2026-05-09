const _sortRankCase = async (loans) => {
  const sortedAsc =
    loans.length === 0
      ? []
      : await loans.sort((a, b) => b.totalCases - a.totalCases);

  return sortedAsc;
};

export default _sortRankCase;
