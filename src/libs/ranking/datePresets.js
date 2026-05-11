const toStartOfDay = (value = new Date()) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const getTodayRange = () => {
  const today = toStartOfDay(new Date());
  return [today, today];
};

const getLastNDaysRange = (days = 7) => {
  const endDate = toStartOfDay(new Date());
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - Math.max(0, days - 1));
  return [startDate, endDate];
};

const getThisMonthRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = toStartOfDay(now);
  return [toStartOfDay(startDate), endDate];
};

const getLastMonthRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
  return [toStartOfDay(startDate), toStartOfDay(endDate)];
};

export { getLastMonthRange, getLastNDaysRange, getThisMonthRange, getTodayRange };
