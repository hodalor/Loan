const _getPreRankRecCase = async (data) => {
  var loans = [];

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

    let loanDate =
      loan.dp === undefined || loan.dp === null ? null : new Date(loan.dp);

    if (
      loanDate !== null &&
      loanDate >= startOfThisWeek &&
      loanDate < startOfNextWeek
    ) {
      let check = loans.find((item) => item.userName === loan.preCollOfficer);

      if (check) {
        let day = loanDate.getDay();
        let days = {
          mon: day === 1 ? check.days.mon + 1 : check.days.mon,
          tue: day === 2 ? check.days.tue + 1 : check.days.tue,
          wed: day === 3 ? check.days.wed + 1 : check.days.wed,
          thu: day === 4 ? check.days.thu + 1 : check.days.thu,
          fri: day === 5 ? check.days.fri + 1 : check.days.fri,
          sat: day === 6 ? check.days.sat + 1 : check.days.sat,
          sun: day === 7 ? check.days.sun + 1 : check.days.sun,
        };

        let newLoans = loans.filter((item) => item.userName !== check.userName);

        check.days = days;
        check.totalCases =
          days.mon +
          days.tue +
          days.wed +
          days.thu +
          days.fri +
          days.sat +
          days.sun;

        newLoans.push(check);
      }

      if (!check) {
        let day = loanDate.getDay();
        let days = {
          mon: day === 1 ? 1 : 0,
          tue: day === 2 ? 1 : 0,
          wed: day === 3 ? 1 : 0,
          thu: day === 4 ? 1 : 0,
          fri: day === 5 ? 1 : 0,
          sat: day === 6 ? 1 : 0,
          sun: day === 7 ? 1 : 0,
        };

        let totalCases =
          days.mon +
          days.tue +
          days.wed +
          days.thu +
          days.fri +
          days.sat +
          days.sun;

        loans.push({ userName: loan.preCollOfficer, days, totalCases });
      }
    }
  });

  return loans;
};

export default _getPreRankRecCase;
