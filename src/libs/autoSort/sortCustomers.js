const _sortCustomers = async (customers) => {
  let lon =
    customers === undefined || customers === null || customers.length === 0
      ? []
      : await customers.map((customer) => {
          return { ...customer, createdAt: new Date(customer.createdAt) };
        });

  const sortedAsc =
    lon.length === 0 ? [] : await lon.sort((a, b) => b.createdAt - a.createdAt);

  return sortedAsc;
};

export default _sortCustomers;
