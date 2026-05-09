const _sortAdmins = async (admins) => {
  let lon =
    admins === undefined || admins === null || admins.length === 0
      ? []
      : await admins.map((admin) => {
          return { ...admin, createdAt: new Date(admin.createdAt) };
        });

  const sortedAsc =
    lon.length === 0 ? [] : await lon.sort((a, b) => b.createdAt - a.createdAt);

  return sortedAsc;
};

export default _sortAdmins;
