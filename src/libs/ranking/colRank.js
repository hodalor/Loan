const _getColRankRec = async (data) => {
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
      let check = loans.find((item) => item.userName === loan.collofficer);

      if (check) {
        let day = loanDate.getDay();
        let days = {
          mon:
            day === 1
              ? check.days.mon + parseFloat(loan.amountPaid)
              : check.days.mon,
          tue:
            day === 2
              ? check.days.tue + parseFloat(loan.amountPaid)
              : check.days.tue,
          wed:
            day === 3
              ? check.days.wed + parseFloat(loan.amountPaid)
              : check.days.wed,
          thu:
            day === 4
              ? check.days.thu + parseFloat(loan.amountPaid)
              : check.days.thu,
          fri:
            day === 5
              ? check.days.fri + parseFloat(loan.amountPaid)
              : check.days.fri,
          sat:
            day === 6
              ? check.days.sat + parseFloat(loan.amountPaid)
              : check.days.sat,
          sun:
            day === 7
              ? check.days.sun + parseFloat(loan.amountPaid)
              : check.days.sun,
        };

        let newLoans = loans.filter((item) => item.userName !== check.userName);

        check.days = days;
        check.totalAmount =
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
          mon: day === 1 ? parseFloat(loan.amountPaid) : 0,
          tue: day === 2 ? parseFloat(loan.amountPaid) : 0,
          wed: day === 3 ? parseFloat(loan.amountPaid) : 0,
          thu: day === 4 ? parseFloat(loan.amountPaid) : 0,
          fri: day === 5 ? parseFloat(loan.amountPaid) : 0,
          sat: day === 6 ? parseFloat(loan.amountPaid) : 0,
          sun: day === 7 ? parseFloat(loan.amountPaid) : 0,
        };

        let totalAmount =
          days.mon +
          days.tue +
          days.wed +
          days.thu +
          days.fri +
          days.sat +
          days.sun;

        loans.push({ userName: loan.collofficer, days, totalAmount });
      }
    }
  });

  return loans;
};

export default _getColRankRec;
