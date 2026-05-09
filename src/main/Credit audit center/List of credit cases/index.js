import React from "react";
import BasicSelect from "../../../components/inputs/select";
import { GlobalContext } from "../../../libs/context/globalContext";
import MyModal from "../../../components/modals";
import AssignModalContent from "../../../components/modals/assingContent";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";
import DefaultLoader from "../../../components/loaders/defaultLoader";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

const TAB_PENDING = "pending";
const TAB_COMPLETED = "completed";

const getReviewBadgeClasses = (status = "") =>
  status === "Granted"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";

export default function ListOfCreditCases() {
  const {
    _routeToPage,
    globalLoader,
    inputs,
    _handleOnChange,
    _handleFindAssignedLoan,
    _clearAssignedLoanSearch,
    modalTitle,
    setmodalTitle,
    setAssignModal,
    setLoan,
    selectedCases,
    setSelectedCases,
    assignedCases,
    user,
    customers,
    admins,
    completedCases,
    _handleFindCompletedLoan,
    _clearCompletedLoanSearch,
  } = React.useContext(GlobalContext);

  const [activeTab, setActiveTab] = React.useState(TAB_PENDING);
  const role = user?.role || "";
  const canReassign = role !== "rev-personel";

  const officers = React.useMemo(
    () =>
      admins
        .filter((admin) => admin.role === "rev-personel")
        .map((officer) => ({ label: officer.userName, value: officer.userName })),
    [admins]
  );

  const pendingLoans = React.useMemo(
    () => assignedCases.filter((loan) => loan.loanStatus === "Review"),
    [assignedCases]
  );

  const pendingRows = React.useMemo(
    () =>
      pendingLoans.map((loan) => {
        const customer = customers.find((item) => item.userId === loan.userId);

        return {
          ...loan,
          id: loan.ID,
          loanId: loan.ID,
          phone: customer?.phone || "-",
          applyTime: new Date(loan.doa).toLocaleString(),
          reviewStaff: loan.rvOfName || "-",
        };
      }),
    [customers, pendingLoans]
  );

  const completedRows = React.useMemo(
    () =>
      completedCases.map((loan) => {
        const customer = customers.find((item) => item.userId === loan.userId);

        return {
          ...loan,
          id: loan.ID,
          loanId: loan.ID,
          phone: customer?.phone || "-",
          applyTime: new Date(loan.doa).toLocaleString(),
          reviewStaff: loan.rvOfName || "-",
        };
      }),
    [completedCases, customers]
  );

  const pendingIds = React.useMemo(
    () => pendingRows.map((row) => row.ID),
    [pendingRows]
  );
  const allPendingSelected =
    pendingIds.length > 0 && pendingIds.every((loanId) => selectedCases.includes(loanId));

  const toggleSelectedCase = React.useCallback(
    (loanId) => {
      setSelectedCases((current) =>
        current.includes(loanId)
          ? current.filter((item) => item !== loanId)
          : [...current, loanId]
      );
    },
    [setSelectedCases]
  );

  const toggleSelectAllPending = React.useCallback(() => {
    setSelectedCases((current) => {
      if (allPendingSelected) {
        return current.filter((item) => !pendingIds.includes(item));
      }

      return Array.from(new Set([...current, ...pendingIds]));
    });
  }, [allPendingSelected, pendingIds, setSelectedCases]);

  const openLoanDetails = React.useCallback(
    (loan) => {
      localStorage.setItem("loan", JSON.stringify(loan));
      setLoan(loan);
      _routeToPage("/loan-details");
    },
    [_routeToPage, setLoan]
  );

  const pendingColumns = React.useMemo(() => {
    const baseColumns = [
      { key: "loanId", label: "Loan ID", cellClassName: "font-semibold text-slate-900" },
      { key: "userId", label: "User ID" },
      { key: "phone", label: "Phone" },
      { key: "applyTime", label: "Apply Time" },
      { key: "amount", label: "Loan Amount" },
      { key: "reviewStaff", label: "Review Staff" },
    ];

    if (!canReassign) {
      return baseColumns;
    }

    return [
      {
        key: "select",
        label: (
          <input
            type="checkbox"
            checked={allPendingSelected}
            onChange={toggleSelectAllPending}
            onClick={(event) => event.stopPropagation()}
            aria-label="Select all pending review cases"
          />
        ),
        render: (row) => (
          <input
            type="checkbox"
            checked={selectedCases.includes(row.ID)}
            onClick={(event) => event.stopPropagation()}
            onChange={() => toggleSelectedCase(row.ID)}
            aria-label={`Select case ${row.ID}`}
          />
        ),
      },
      ...baseColumns,
    ];
  }, [
    allPendingSelected,
    canReassign,
    selectedCases,
    toggleSelectAllPending,
    toggleSelectedCase,
  ]);

  const completedColumns = React.useMemo(
    () => [
      { key: "loanId", label: "Loan ID", cellClassName: "font-semibold text-slate-900" },
      { key: "userId", label: "User ID" },
      { key: "phone", label: "Phone" },
      { key: "applyTime", label: "Apply Time" },
      { key: "amount", label: "Loan Amount" },
      { key: "reviewStaff", label: "Review Staff" },
      {
        key: "status",
        label: "Review Result",
        render: (row) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getReviewBadgeClasses(
              row.loanStatus
            )}`}
          >
            {row.loanStatus === "Granted" ? "Approved" : "Rejected"}
          </span>
        ),
      },
    ],
    []
  );

  const isPendingTab = activeTab === TAB_PENDING;
  const currentRows = isPendingTab ? pendingRows : completedRows;

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-body space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Review Case List</h1>
              <p className="mt-1 text-sm text-slate-500">
                Track assigned review work, search live records, and reassign selected cases.
              </p>
            </div>
            {canReassign && isPendingTab ? (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={selectedCases.length === 0}
                onClick={() => {
                  setAssignModal(true);
                  setmodalTitle("assignModal");
                }}
              >
                <i className="fa fa-random text-xs" />
                Reassign Cases
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isPendingTab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab(TAB_PENDING)}
            >
              Cases Pending Review
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                !isPendingTab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab(TAB_COMPLETED)}
            >
              Completed Cases
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              type="text"
              className="app-input !min-h-[42px] text-sm"
              placeholder="User ID"
              aria-label="userid"
              value={inputs.userId}
              onChange={(e) =>
                _handleOnChange({
                  field: "userId",
                  value: e.target.value,
                })
              }
            />
            <input
              type="text"
              className="app-input !min-h-[42px] text-sm"
              placeholder="Loan ID"
              aria-label="loanId"
              value={inputs.loanId}
              onChange={(e) =>
                _handleOnChange({
                  field: "loanId",
                  value: e.target.value,
                })
              }
            />
            <input
              type="text"
              className="app-input !min-h-[42px] text-sm"
              placeholder="Phone number"
              aria-label="phone"
              value={inputs.phone}
              onChange={(e) =>
                _handleOnChange({
                  field: "phone",
                  value: e.target.value,
                })
              }
            />
            <BasicSelect data={officers} title="Review Staff" />
            <CustomDateRangeInputs />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              {isPendingTab
                ? `${pendingRows.length} pending review case${pendingRows.length === 1 ? "" : "s"}`
                : `${completedRows.length} completed review case${completedRows.length === 1 ? "" : "s"}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-w-[108px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={isPendingTab ? _handleFindAssignedLoan : _handleFindCompletedLoan}
                disabled={globalLoader}
              >
                {globalLoader ? (
                  <span className="inline-flex scale-75">
                    <DefaultLoader />
                  </span>
                ) : (
                  <i className="fa fa-search text-xs" />
                )}
                Search
              </button>
              <button
                type="button"
                className="inline-flex min-w-[108px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                onClick={
                  isPendingTab ? _clearAssignedLoanSearch : _clearCompletedLoanSearch
                }
              >
                <i className="fa fa-undo text-xs" />
                Reset
              </button>
            </div>
          </div>

          <SimpleDataTable
            columns={isPendingTab ? pendingColumns : completedColumns}
            rows={currentRows}
            rowKey="id"
            dense
            pageSize={10}
            loading={globalLoader}
            loadingMessage={
              isPendingTab
                ? "Loading pending review cases..."
                : "Loading completed review cases..."
            }
            emptyMessage={
              isPendingTab
                ? "No cases pending review."
                : "No completed review cases."
            }
            onRowClick={(row) => openLoanDetails(row)}
          />
        </div>
      </section>

      {modalTitle === "assignModal" ? (
        <MyModal>
          <AssignModalContent title="re-assign" />
        </MyModal>
      ) : null}
    </div>
  );
}
