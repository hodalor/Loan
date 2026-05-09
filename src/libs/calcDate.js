const _getDatefromDays = async (numOfDays) => {
  let date = new Date();
  date.setDate(date.getDate() + numOfDays);
  return date;
};

module.exports = { _getDatefromDays };
