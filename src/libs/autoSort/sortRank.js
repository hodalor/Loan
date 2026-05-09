const _sortRank = async (loans) => {
  const sortedAsc =
    loans.length === 0
      ? []
      : await loans.sort((a, b) => b.totalAmount - a.totalAmount);

  return sortedAsc;
};

export default _sortRank;
