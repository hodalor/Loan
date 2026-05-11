import { getCalendarDayDifferenceByCountry } from "./countryTime";

const toNumber = (value = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const roundMoney = (value = 0) => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const getPenaltyRate = (loan = {}) => {
  const configuredRate = toNumber(loan?.overduePenaltyRate);
  return configuredRate > 0 ? configuredRate : 2;
};

const getAmountPaidBeforeFinalClearance = (loan = {}) => {
  const totalAmountPaid = toNumber(loan?.amountPaid);
  const finalClearanceAmount = toNumber(loan?.clearanceRecord?.amountPaid);

  if (loan?.caseStatus === "Completed" && finalClearanceAmount > 0) {
    return Math.max(totalAmountPaid - finalClearanceAmount, 0);
  }

  return totalAmountPaid;
};

const getOverdueDays = (loan = {}, countryProfile = {}) => {
  if (loan?.caseStatus === "Completed" && loan?.dp) {
    return Math.max(
      0,
      -getCalendarDayDifferenceByCountry(loan?.dop, loan?.dp, countryProfile)
    );
  }

  return Math.max(0, -toNumber(loan?.dur));
};

const getCollectionMetrics = (loan = {}, countryProfile = {}) => {
  const repaymentAmount = roundMoney(loan?.repaymentAmount);
  const amountPaid = roundMoney(loan?.amountPaid);
  const paidBeforeFinalClearance = roundMoney(getAmountPaidBeforeFinalClearance(loan));
  const overdueDays = getOverdueDays(loan, countryProfile);
  const principalForPenalty = roundMoney(Math.max(repaymentAmount - paidBeforeFinalClearance, 0));
  const overduePenalty = roundMoney(
    principalForPenalty * (getPenaltyRate(loan) / 100) * overdueDays
  );
  const amountPayable = roundMoney(principalForPenalty + overduePenalty);
  const amountLeft = roundMoney(Math.max(repaymentAmount - amountPaid, 0));

  return {
    repaymentAmount,
    amountPaid,
    amountLeft,
    overdueDays,
    overduePenalty,
    amountPayable,
    principalForPenalty,
  };
};

const formatMoney = (value = 0) => roundMoney(value).toFixed(2);

export { formatMoney, getCollectionMetrics, roundMoney, toNumber };
