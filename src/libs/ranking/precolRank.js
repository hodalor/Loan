const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toValidDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPaymentEvents = (loan = {}) => {
  const events = (Array.isArray(loan?.paymentEvents) ? loan.paymentEvents : [])
    .map((event, index) => {
      const paidDate = toValidDate(event?.paidDate || event?.datePaid);
      const amountPaid = toNumber(event?.amountPaid);

      if (!paidDate || amountPaid <= 0) return null;

      return {
        id: `${loan?.id || loan?.ID || loan?.loanId || "loan"}-${index}`,
        paidDate,
        amountPaid,
      };
    })
    .filter(Boolean);

  if (events.length > 0) return events;

  const paidDate = toValidDate(loan?.dp);
  const amountPaid = toNumber(loan?.amountPaid);
  if (!paidDate || amountPaid <= 0) return [];

  return [{ id: `${loan?.id || loan?.ID || loan?.loanId || "loan"}-fallback`, paidDate, amountPaid }];
};

const createEmptyDays = () => ({
  mon: 0,
  tue: 0,
  wed: 0,
  thu: 0,
  fri: 0,
  sat: 0,
  sun: 0,
});

const getWeekDayKey = (date) => {
  const day = date.getDay();
  if (day === 1) return "mon";
  if (day === 2) return "tue";
  if (day === 3) return "wed";
  if (day === 4) return "thu";
  if (day === 5) return "fri";
  if (day === 6) return "sat";
  return "sun";
};

const _getPreRankRec = async (data) => {
  const loans = [];

  data.forEach((loan) => {
    const now = new Date();

    const weekDay = (now.getDay() + 6) % 7; // Make sure Sunday is 6, not 0
    const monthDay = now.getDate();
    const mondayThisWeek = monthDay - weekDay;

    const startOfThisWeek = new Date(+now);
    startOfThisWeek.setDate(mondayThisWeek);
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfNextWeek = new Date(+startOfThisWeek);
    startOfNextWeek.setDate(mondayThisWeek + 7);

    getPaymentEvents(loan)
      .filter((event) => event.paidDate >= startOfThisWeek && event.paidDate < startOfNextWeek)
      .forEach((event) => {
        const officerName = loan.preCollOfficer;
        if (!officerName) return;

        let check = loans.find((item) => item.userName === officerName);
        if (!check) {
          check = { userName: officerName, days: createEmptyDays(), totalAmount: 0 };
          loans.push(check);
        }

        const dayKey = getWeekDayKey(event.paidDate);
        check.days[dayKey] += toNumber(event.amountPaid);
        check.totalAmount =
          check.days.mon +
          check.days.tue +
          check.days.wed +
          check.days.thu +
          check.days.fri +
          check.days.sat +
          check.days.sun;
      });
  });

  return loans;
};

export default _getPreRankRec;
