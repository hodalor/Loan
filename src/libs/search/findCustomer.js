const _findCustomer = async (data) => {
  const { filterData, dataToFilter } = data;

  let filteredData = {};

  let type = filterData.type;

  let filter = "";

  await filterData.filterArray.forEach((item) => {
    if (item !== "") return (filter = item);
  });

  if (type === "phone") {
    filteredData = dataToFilter.find((item) => item.phone === filter);
  }

  if (type === "idCard") {
    filteredData = dataToFilter.find(
      (item) => item.IDinfo.gCardNumber === filter
    );
  }

  if (type === "userId") {
    filteredData = dataToFilter.find(
      (item) => item.userId.trim() === filter.trim()
    );
  }

  return filteredData;
};

export default _findCustomer;
