const _filterUser = async (data) => {
  const { filterData, dataToFilter } = data;

  let filteredData = [];

  let type = filterData.type;

  let filter = "";

  await filterData.filterArray.forEach((item) => {
    if (item !== "") return (filter = item);
  });

  if (type === "phone") {
    filteredData = dataToFilter.filter((item) => item.phone === filter);
  }

  if (type === "userName") {
    filteredData = dataToFilter.filter((item) => item.userName === filter);
  }

  if (type === "Departments") {
    filteredData = dataToFilter.filter((item) => item.department === filter);
  }

  if (type === "date") {
    filteredData = dataToFilter.filter(
      (item) =>
        new Date(item.createdAt).toLocaleDateString() ===
        new Date(filter).toLocaleDateString()
    );
  }

  if (type === "userId") {
    filteredData = dataToFilter.filter(
      (item) => item.userId.trim() === filter.trim()
    );
  }

  return filteredData;
};

export default _filterUser;
