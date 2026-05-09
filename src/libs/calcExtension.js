const _calExtDate = async ({ duration, dop }) => {
  let date = new Date(dop);
  date.setDate(date.getDate() + parseInt(duration));
  return date;
};

module.exports = { _calExtDate };
