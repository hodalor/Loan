import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { GlobalContext } from "../../../libs/context/globalContext";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Employee analysis chart",
    },
  },
};

export default function AnalysisOfCreditAudit() {
  const {
    admins,
    completedCases,
    assignedCases,
    originalData,
    _handleDateSearch,
    _clearDateSearch,
  } = React.useContext(GlobalContext);

  const data = admins.filter((admin) => admin.department === "review");

  const [selectedAdmin, setSelectedAdmin] = React.useState("");

  const [dataSet, setData] = React.useState({});

  const [dataSet2, setData2] = React.useState({});

  const [emp, setEmp] = React.useState({});

  const _handleChange = async (userName) => {
    setSelectedAdmin(userName);

    if (userName === "") return setEmp({});

    let person = data.find((per) => per.userName === userName);

    let adminCases = completedCases.filter(
      (cas) => cas.rvOfName === person.userName
    );

    let assigned = assignedCases.filter(
      (cas) => cas.rvOfName === person.userName
    );

    let processed = adminCases.filter((cas) => cas.loanStatus !== "Review");

    let granted = adminCases.filter((cas) => cas.loanStatus === "Granted");

    let rejected = adminCases.filter((cas) => cas.loanStatus === "Rejected");

    let unProcessed = assigned.filter((cas) => cas.loanStatus === "Review");

    let grantedPercentage = (granted.length / processed.length) * 100;

    let rejectedPercentage = (rejected.length / processed.length) * 100;

    const chartData = {
      labels: [
        "Total cases",
        "Total reviewed",
        "Total granted",
        "Total rejected",
        "Unprocessed cases",
      ],
      datasets: [
        {
          label: "",
          backgroundColor: [
            "#3e95cd",
            "#8e5ea2",
            "#3cba9f",
            "#e8c3b9",
            "#c45850",
          ],
          data: [
            assigned.length,
            processed.length,
            granted.length,
            rejected.length,
            unProcessed.length,
          ],
        },
      ],
    };

    const chartData2 = {
      labels: ["Percentage of granted cases", "Percentage of rejected cases"],
      datasets: [
        {
          label: "",
          backgroundColor: ["#3cba9f", "#c45850"],
          data: [grantedPercentage, rejectedPercentage],
        },
      ],
    };

    setEmp(person);

    setData(chartData);

    setData2(chartData2);
  };

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-body space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Analysis Review Officers
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review productivity, approval mix, and outstanding cases per officer.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
            <div>
              <label className="app-label">Select Personnel</label>
              <select
                className="app-select"
                value={selectedAdmin}
                onChange={(e) => _handleChange(e.target.value)}
              >
                <option value="">Clear field</option>
                {data.map((item) => (
                  <option key={item.userName} value={item.userName}>
                    {item.userName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="app-label">Date Range</label>
              <CustomDateRangeInputs />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={_handleDateSearch}
                disabled={originalData.length !== 0}
                type="button"
                className="app-btn-primary h-[44px] px-4"
              >
                <i className="fa fa-search text-xs" /> Search
              </button>
              <button
                onClick={_clearDateSearch}
                type="button"
                className="app-btn-secondary h-[44px] px-4"
              >
                <i className="fa fa-undo text-xs" /> Reset
              </button>
            </div>
          </div>

          {selectedAdmin === "" ? null : (
            <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <h2 className="text-base font-semibold text-slate-900">
                  Personnel Summary
                </h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Employee Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {[emp.firstName, emp.lastName].filter(Boolean).join(" ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      User Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {emp.userName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Phone Number
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {emp.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                      {emp.email || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className="min-h-[280px]">
                  <Bar options={options} data={dataSet} />
                </div>
                <div className="mt-6 flex justify-center">
                  <div className="h-[300px] w-full max-w-[320px]">
                    <Pie data={dataSet2} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
