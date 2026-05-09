import React from "react";
import { GlobalContext } from "../../libs/context/globalContext";
import DefaultLoader from "../../components/loaders/defaultLoader";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getMonthIndex = (dateValue) => {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? -1 : date.getMonth();
};

const isCurrentYear = (dateValue) => {
  const date = new Date(dateValue);
  return !Number.isNaN(date.getTime()) && date.getFullYear() === new Date().getFullYear();
};

const isCurrentMonth = (dateValue) => {
  const date = new Date(dateValue);
  const now = new Date();

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

const calculatePenalty = (loan) => {
  if (Math.sign(toNumber(loan?.dur)) !== -1) return 0;

  const paymentDate = loan?.caseStatus === "Completed" ? new Date(loan?.dp) : new Date();
  const dueDate = new Date(loan?.dop);

  if (Number.isNaN(dueDate.getTime()) || Number.isNaN(paymentDate.getTime())) return 0;

  const dayDifference = Math.trunc(
    (paymentDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)
  );

  return (2 / Math.max(toNumber(loan?.amount), 1)) * 100 * dayDifference;
};

export default function Dashboard() {
  const { loans, customers, globalLoader } = React.useContext(GlobalContext);

  const loanData = React.useMemo(() => (Array.isArray(loans) ? loans : []), [loans]);
  const customerData = React.useMemo(
    () => (Array.isArray(customers) ? customers : []),
    [customers]
  );

  const metrics = React.useMemo(() => {
    const monthlyCollected = new Array(12).fill(0);
    const monthlyDisbursed = new Array(12).fill(0);
    const monthlyRegistrations = new Array(12).fill(0);

    const underReview = loanData.filter((loan) => loan.loanStatus === "Review");
    const grantedLoans = loanData.filter((loan) => loan.loanStatus === "Granted");
    const rejectedLoans = loanData.filter((loan) => loan.loanStatus === "Rejected");
    const allThisMonth = loanData.filter((loan) => isCurrentMonth(loan.doa));
    const grantedThisMonth = loanData.filter(
      (loan) => isCurrentMonth(loan.doa) && loan.loanStatus === "Granted"
    );
    const rejectedThisMonth = loanData.filter(
      (loan) => isCurrentMonth(loan.doa) && loan.loanStatus === "Rejected"
    );

    grantedLoans.forEach((loan) => {
      if (loan.dp && isCurrentYear(loan.dp)) {
        const index = getMonthIndex(loan.dp);
        if (index >= 0) monthlyCollected[index] += toNumber(loan.amountPaid);
      }

      if (loan.dod && isCurrentYear(loan.dod)) {
        const index = getMonthIndex(loan.dod);
        if (index >= 0) monthlyDisbursed[index] += toNumber(loan.amount);
      }
    });

    customerData.forEach((customer) => {
      if (customer.createdAt && isCurrentYear(customer.createdAt)) {
        const index = getMonthIndex(customer.createdAt);
        if (index >= 0) monthlyRegistrations[index] += 1;
      }
    });

    const expectedAmount = grantedLoans.reduce(
      (sum, loan) => sum + toNumber(loan.repaymentAmount) + calculatePenalty(loan),
      0
    );
    const disbursedAmount = grantedLoans.reduce(
      (sum, loan) => sum + toNumber(loan.amount),
      0
    );
    const collectedAmount = grantedLoans.reduce(
      (sum, loan) => sum + toNumber(loan.amountPaid),
      0
    );

    const currentMonthGranted = grantedLoans.filter((loan) => isCurrentMonth(loan.dod));
    const disbursedThisMonth = currentMonthGranted.reduce(
      (sum, loan) => sum + toNumber(loan.amount),
      0
    );
    const expectedThisMonth = currentMonthGranted.reduce(
      (sum, loan) => sum + toNumber(loan.repaymentAmount) + calculatePenalty(loan),
      0
    );
    const collectedThisMonth = currentMonthGranted.reduce(
      (sum, loan) => sum + toNumber(loan.amountPaid),
      0
    );

    const extFeeThisMonth = currentMonthGranted.reduce((sum, loan) => {
      if (Array.isArray(loan.extRecords) && loan.extRecords.length > 0) {
        return sum + toNumber(loan.extHandlingFee);
      }
      return sum;
    }, 0);

    const overduePenalty = grantedLoans
      .filter((loan) => isCurrentMonth(loan.dop))
      .reduce((sum, loan) => sum + calculatePenalty(loan), 0);

    const paidOverduePenalty = grantedLoans
      .filter((loan) => isCurrentMonth(loan.dop) && loan.caseStatus === "Completed")
      .reduce((sum, loan) => sum + Math.max(calculatePenalty(loan), 0), 0);

    const blockedUsers = customerData.filter((customer) => customer.isActive === false);
    const appliedUsers = customerData.filter(
      (customer) => customer.loan?.isApplied === true
    );
    const notAppliedUsers = customerData.filter(
      (customer) => customer.loan?.isApplied === false
    );

    const currentProfit = Math.max(collectedAmount - disbursedAmount, 0);
    const currentMonthProfit = Math.max(collectedThisMonth - disbursedThisMonth, 0);
    const expectedProfit = expectedAmount - disbursedAmount;
    const expectedMonthProfit = expectedThisMonth - disbursedThisMonth;
    const profitPercentage =
      disbursedThisMonth > 0 ? (currentMonthProfit / disbursedThisMonth) * 100 : 0;

    return {
      underReview,
      grantedLoans,
      rejectedLoans,
      allThisMonth,
      grantedThisMonth,
      rejectedThisMonth,
      monthlyCollected,
      monthlyDisbursed,
      monthlyRegistrations,
      expectedAmount,
      disbursedAmount,
      collectedAmount,
      disbursedThisMonth,
      expectedThisMonth,
      collectedThisMonth,
      extFeeThisMonth,
      overduePenalty,
      paidOverduePenalty,
      blockedUsers,
      appliedUsers,
      notAppliedUsers,
      currentProfit,
      currentMonthProfit,
      expectedProfit,
      expectedMonthProfit,
      profitPercentage,
    };
  }, [customerData, loanData]);

  const chartOptions = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "top",
        },
      },
    }),
    []
  );

  const revenueChartData = React.useMemo(
    () => ({
      labels: monthLabels,
      datasets: [
        {
          fill: true,
          label: "Collected",
          data: metrics.monthlyCollected,
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
        },
        {
          fill: true,
          label: "Disbursed",
          data: metrics.monthlyDisbursed,
          borderColor: "rgb(240, 53, 112)",
          backgroundColor: "rgba(240, 53, 112, 0.5)",
        },
      ],
    }),
    [metrics.monthlyCollected, metrics.monthlyDisbursed]
  );

  const profitChartData = React.useMemo(
    () => ({
      labels: ["Percentage profit"],
      datasets: [
        {
          label: "",
          backgroundColor: ["#3cba9f"],
          data: [metrics.profitPercentage],
        },
      ],
    }),
    [metrics.profitPercentage]
  );

  const userChartData = React.useMemo(
    () => ({
      labels: monthLabels,
      datasets: [
        {
          label: "users",
          backgroundColor: [
            "#3e95cd",
            "#8e5ea2",
            "#3cba9f",
            "#e8c3b9",
            "#c45850",
            "#3e95cc",
            "#8e5ea3",
            "#3cba9f",
            "#e8c3bD",
            "#c45851",
            "#e8c3b5",
            "#c4f851",
          ],
          data: metrics.monthlyRegistrations,
        },
      ],
    }),
    [metrics.monthlyRegistrations]
  );

  const summaryCards = [
    {
      label: "New Loans",
      value: metrics.underReview.length,
      iconClass: "fa fa-chart-line",
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Loans This Month",
      value: metrics.allThisMonth.length,
      iconClass: "fa fa-wallet",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Granted This Month",
      value: metrics.grantedThisMonth.length,
      iconClass: "fa fa-check-circle",
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Rejected This Month",
      value: metrics.rejectedThisMonth.length,
      iconClass: "fa fa-times-circle",
      tone: "bg-rose-50 text-rose-700",
    },
  ];

  const portfolioCards = [
    {
      label: "Expected Amount",
      value: `GHS ${metrics.expectedAmount.toFixed(2)}`,
      iconClass: "fa fa-piggy-bank",
    },
    {
      label: "Overall Disbursed",
      value: `GHS ${metrics.disbursedAmount.toFixed(2)}`,
      iconClass: "fa fa-money-bill-wave",
    },
    {
      label: "Overall Collected",
      value: `GHS ${metrics.collectedAmount.toFixed(2)}`,
      iconClass: "fa fa-sync-alt",
    },
    {
      label: "Current Profit",
      value: `GHS ${metrics.currentProfit.toFixed(2)}`,
      iconClass: "fa fa-arrow-trend-up",
    },
  ];

  if (globalLoader && loanData.length === 0 && customerData.length === 0) {
    return (
      <div className="space-y-6">
        <section className="app-panel overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 text-white">
          <div className="app-panel-body">
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center">
              <DefaultLoader />
              <div>
                <p className="text-lg font-semibold text-white">Loading dashboard</p>
                <p className="mt-1 text-sm text-slate-300">
                  Cards, charts, and tables are refreshing...
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="app-panel overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 text-white">
        <div className="app-panel-body">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-sm">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
                Dashboard
              </span>
              <h2 className="mt-4 text-2xl font-semibold leading-tight xl:text-3xl">
                Business Health And Operations Summary
              </h2>
            </div>

            <div className="grid flex-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                return (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}
                    >
                      <i className={`${card.iconClass} text-sm`} />
                    </div>
                    <p className="mt-3 text-xl font-semibold">{card.value}</p>
                    <p className="mt-1 text-xs text-slate-300">{card.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <div className="app-panel xl:col-span-4">
          <div className="app-panel-body grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {portfolioCards.map((card) => {
              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">{card.label}</p>
                      <p className="mt-1.5 text-xl font-semibold leading-tight text-slate-900">
                        {card.value}
                      </p>
                    </div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                      <i className={`${card.iconClass} text-sm`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Revenue Flow
              </h3>
              <p className="text-sm text-slate-500">
                Monthly comparison of collection against disbursement.
              </p>
            </div>
          </div>
          <div className="app-panel-body">
            <div className="h-[360px]">
              <Line
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      display: true,
                      text: `Monthly Revenue Flow For ${new Date().getFullYear()}`,
                    },
                  },
                }}
                data={revenueChartData}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="app-panel">
            <div className="app-panel-header">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Profit Percentage
                </h3>
                <p className="text-sm text-slate-500">
                  Current month actual profit against disbursement.
                </p>
              </div>
            </div>
            <div className="app-panel-body">
              <div className="h-[260px]">
                <Pie options={chartOptions} data={profitChartData} />
              </div>
            </div>
          </div>

          <div className="app-panel">
            <div className="app-panel-body space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-500">This Month Disbursed</p>
                <p className="mt-1.5 text-xl font-semibold text-slate-900">
                  GHS {metrics.disbursedThisMonth.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-500">This Month Expected</p>
                <p className="mt-1.5 text-xl font-semibold text-slate-900">
                  GHS {metrics.expectedThisMonth.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-500">This Month Collected</p>
                <p className="mt-1.5 text-xl font-semibold text-slate-900">
                  GHS {metrics.collectedThisMonth.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="app-panel">
          <div className="app-panel-header">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Customer Growth
              </h3>
              <p className="text-sm text-slate-500">
                New user registration trend across the current year.
              </p>
            </div>
          </div>
          <div className="app-panel-body">
            <div className="h-[320px]">
              <Bar
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      display: true,
                      text: `Monthly User Registration For ${new Date().getFullYear()}`,
                    },
                  },
                }}
                data={userChartData}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="app-panel">
            <div className="app-panel-body grid gap-4">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <i className="fa fa-users text-sm" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Customers</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {customerData.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <i className="fa fa-user-slash text-sm" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Blocked Customers</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {metrics.blockedUsers.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <i className="fa fa-check-circle text-sm" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Currently Applied</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {metrics.appliedUsers.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3.5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <i className="fa fa-ban text-sm" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Not Applied</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {metrics.notAppliedUsers.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="app-panel">
            <div className="app-panel-header">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Other Amounts
                </h3>
                <p className="text-sm text-slate-500">
                  Supporting financial indicators for the current month.
                </p>
              </div>
            </div>
            <div className="app-panel-body space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Extension handling fee</span>
                  <span className="font-semibold text-slate-900">
                    GHS {metrics.extFeeThisMonth.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-full rounded-full bg-blue-500" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Expected profit this month</span>
                  <span className="font-semibold text-slate-900">
                    GHS {metrics.expectedMonthProfit.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(
                        100,
                        metrics.expectedThisMonth > 0
                          ? (metrics.currentMonthProfit / metrics.expectedThisMonth) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">Overdue penalty recovered</span>
                  <span className="font-semibold text-slate-900">
                    {metrics.paidOverduePenalty.toFixed(2)} /{" "}
                    {metrics.overduePenalty.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{
                      width: `${Math.min(
                        100,
                        metrics.overduePenalty > 0
                          ? (metrics.paidOverduePenalty / metrics.overduePenalty) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
