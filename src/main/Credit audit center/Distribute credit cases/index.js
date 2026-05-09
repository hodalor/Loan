import React from "react";
import BasicSelect from "../../../components/inputs/select";
import { GlobalContext } from "../../../libs/context/globalContext";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";
import MyModal from "../../../components/modals";
import AssignModalContent from "../../../components/modals/assingContent";
import DefaultLoader from "../../../components/loaders/defaultLoader";
import { _unassignAuditCases } from "../../../handlers";

export default function DistributeCreditCases() {
  const {
    _routeToPage,
    loanTypes,
    globalLoader,
    inComingLoans,
    inputs,
    select,
    dateRange,
    setRange,
    setSelect,
    _handleOnChange,
    modalTitle,
    setmodalTitle,
    setLoan,
    selectedCases,
    setSelectedCases,
    assignedCases,
    setAssignModal,
  } = React.useContext(GlobalContext);

  const [activeView, setActiveView] = React.useState("unassigned");
  const [unassignedPage, setUnassignedPage] = React.useState(1);
  const [assignedPage, setAssignedPage] = React.useState(1);
  const [actionLoading, setActionLoading] = React.useState("");
  const PAGE_SIZE = 10;
  const isWithinDateRange = React.useCallback((value) => {
    if (!dateRange || !Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) {
      return true;
    }

    const targetDate = new Date(value);
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);

    if (
      Number.isNaN(targetDate.getTime()) ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return true;
    }

    targetDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return targetDate >= startDate && targetDate <= endDate;
  }, [dateRange]);

  const rows2 = React.useMemo(() => {
    const completedCasesToShow = assignedCases.filter((loan) => loan.loanStatus === "Review");

    return completedCasesToShow.map((loan, index) => ({
      ...loan,
      id: index,
      applyTime: new Date(loan.doa).toLocaleString(),
      rvStaffName: loan.rvOfName,
    }));
  }, [assignedCases]);

  const rows = React.useMemo(
    () =>
      (inComingLoans || []).map((loan) => ({
        ...loan,
        id: loan.ID,
        loanId: loan.ID,
        applyTime: new Date(loan.doa).toLocaleString(),
      })),
    [inComingLoans]
  );
  const filteredRows = React.useMemo(() => {
    const normalizedUserId = String(inputs.userId || "").trim().toLowerCase();
    const normalizedLoanId = String(inputs.loanId || "").trim().toLowerCase();

    return rows.filter((loan) => {
      const matchesUserId =
        !normalizedUserId ||
        String(loan.userId || "").trim().toLowerCase().includes(normalizedUserId);
      const matchesLoanId =
        !normalizedLoanId ||
        String(loan.loanId || "").trim().toLowerCase().includes(normalizedLoanId);
      const matchesLoanType =
        !select.loanType ||
        (select.loanType === "firstLoan"
          ? loan.isNewLoan === true
          : select.loanType === "reLoan"
          ? loan.isNewLoan === false
          : true);

      return (
        matchesUserId &&
        matchesLoanId &&
        matchesLoanType &&
        isWithinDateRange(loan.doa)
      );
    });
  }, [inputs.loanId, inputs.userId, isWithinDateRange, rows, select.loanType]);
  const filteredAssignedRows = React.useMemo(() => {
    const normalizedUserId = String(inputs.userId || "").trim().toLowerCase();
    const normalizedLoanId = String(inputs.loanId || "").trim().toLowerCase();

    return rows2.filter((loan) => {
      const matchesUserId =
        !normalizedUserId ||
        String(loan.userId || "").trim().toLowerCase().includes(normalizedUserId);
      const matchesLoanId =
        !normalizedLoanId ||
        String(loan.ID || "").trim().toLowerCase().includes(normalizedLoanId);

      return matchesUserId && matchesLoanId && isWithinDateRange(loan.doa);
    });
  }, [inputs.loanId, inputs.userId, isWithinDateRange, rows2]);

  const selectedCaseSet = React.useMemo(() => new Set(selectedCases), [selectedCases]);
  const totalUnassignedPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const totalAssignedPages = Math.max(1, Math.ceil(filteredAssignedRows.length / PAGE_SIZE));
  const paginatedUnassignedRows = React.useMemo(
    () =>
      filteredRows.slice((unassignedPage - 1) * PAGE_SIZE, unassignedPage * PAGE_SIZE),
    [filteredRows, unassignedPage]
  );
  const paginatedAssignedRows = React.useMemo(
    () =>
      filteredAssignedRows.slice((assignedPage - 1) * PAGE_SIZE, assignedPage * PAGE_SIZE),
    [assignedPage, filteredAssignedRows]
  );

  React.useEffect(() => {
    setUnassignedPage(1);
  }, [filteredRows.length]);

  React.useEffect(() => {
    setAssignedPage(1);
  }, [filteredAssignedRows.length]);

  const handleCaseToggle = (loanId, checked) => {
    if (checked) {
      setSelectedCases((current) => [...current, loanId]);
      return;
    }

    setSelectedCases((current) => current.filter((item) => item !== loanId));
  };

  const handleSelectAllUnassigned = (checked) => {
    if (checked) {
      setSelectedCases(filteredRows.map((loan) => loan.ID));
      return;
    }

    setSelectedCases([]);
  };

  const handleUnassignAssigned = async () => {
    if (selectedCases.length === 0) return;

    setActionLoading("unassign");
    const response = await _unassignAuditCases(selectedCases);
    if (response.success === 0) {
      setActionLoading("");
      return;
    }

    setSelectedCases([]);
    setActionLoading("");
    window.location.reload();
  };

  const openLoanDetails = (loanData) => {
    localStorage.setItem("loan", JSON.stringify(loanData));
    setLoan(loanData);
    _routeToPage("/loan-details");
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Distribute Credit Cases</h3>
            <p className="mt-1 text-xs text-slate-500">
              Search review cases, select multiple loans, and assign them faster without the heavy grid.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {selectedCases.length} selected
            </span>
            <button
              onClick={() => {
                setAssignModal(true);
                setmodalTitle("assignModal");
              }}
              type="button"
              disabled={selectedCases.length === 0}
              className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Assign Cases
            </button>
            {activeView === "assigned" ? (
              <button
                onClick={handleUnassignAssigned}
                type="button"
                disabled={selectedCases.length === 0 || actionLoading === "unassign"}
                className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === "unassign" ? "Unassigning..." : "Unassign"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <SummaryTile label="Unassigned" value={rows.length} />
          <SummaryTile label="Assigned Review" value={rows2.length} tone="info" />
          <SummaryTile label="Selected" value={selectedCases.length} tone="success" />
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.05fr)_auto] xl:items-center">
          <input
            type="text"
            className="app-input h-10 rounded-xl px-3"
            placeholder="User ID"
            value={inputs.userId}
            onChange={(e) =>
              _handleOnChange({
                field: "userId",
                value: e.target.value,
              })
            }
            aria-label="userid"
          />
          <input
            type="text"
            className="app-input h-10 rounded-xl px-3"
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
          <BasicSelect data={loanTypes} title="Loan type" />
          <CustomDateRangeInputs />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => {
              _handleOnChange({ field: "userId", value: "" });
              _handleOnChange({ field: "loanId", value: "" });
              setRange(null);
              setSelect((current) => ({
                ...current,
                loanType: "",
              }));
            }}
          >
            Clear
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Credit case filters update live while you type or change the date range.
        </p>

        <div className="mt-3 border-b border-slate-200">
          <div className="flex flex-wrap gap-5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveView("unassigned")}
              className={`border-b-2 px-0 py-2.5 text-sm font-semibold transition ${
                activeView === "unassigned"
                  ? "border-blue-600 text-slate-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Unassigned Cases
            </button>
            <button
              type="button"
              onClick={() => setActiveView("assigned")}
              className={`border-b-2 px-0 py-2.5 text-sm font-semibold transition ${
                activeView === "assigned"
                  ? "border-blue-600 text-slate-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Assigned Cases
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {activeView === "unassigned"
            ? "Open any row to inspect the loan, or tick the checkbox to include it in assignment."
            : "Assigned review rows remain clickable so staff can inspect the case quickly."}
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-auto">
            {activeView === "unassigned" ? (
              <table className="min-w-full table-fixed bg-white">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="w-14 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={
                          filteredRows.length > 0 && selectedCases.length === filteredRows.length
                        }
                        onChange={(event) => handleSelectAllUnassigned(event.target.checked)}
                      />
                    </th>
                    <th className="px-3 py-2.5">Loan ID</th>
                    <th className="px-3 py-2.5">User ID</th>
                    <th className="px-3 py-2.5">Apply Time</th>
                    <th className="px-3 py-2.5">Amount</th>
                    <th className="px-3 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedUnassignedRows.map((loan) => (
                    <tr
                      key={loan.ID}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => openLoanDetails(loan)}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedCaseSet.has(loan.ID)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => handleCaseToggle(loan.ID, event.target.checked)}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-slate-900">{loan.loanId}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-700">{loan.userId}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-700">{loan.applyTime}</td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-slate-900">
                        {loan.amount}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            openLoanDetails(loan);
                          }}
                          aria-label={`View ${loan.loanId}`}
                        >
                          <i className="fa fa-eye text-xs" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                        {globalLoader ? (
                          <span className="inline-flex items-center gap-2">
                            <DefaultLoader />
                            Loading cases...
                          </span>
                        ) : (
                          "No unassigned cases found."
                        )}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full table-fixed bg-white">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="w-14 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={
                          filteredAssignedRows.length > 0 &&
                          filteredAssignedRows.every((loan) => selectedCaseSet.has(loan.ID))
                        }
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedCases(filteredAssignedRows.map((loan) => loan.ID));
                            return;
                          }

                          setSelectedCases([]);
                        }}
                      />
                    </th>
                    <th className="px-3 py-2.5">Loan ID</th>
                    <th className="px-3 py-2.5">User ID</th>
                    <th className="px-3 py-2.5">Apply Time</th>
                    <th className="px-3 py-2.5">Amount</th>
                    <th className="px-3 py-2.5">Review Staff</th>
                    <th className="px-3 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paginatedAssignedRows.map((loan) => (
                    <tr
                      key={`${loan.ID}-${loan.id}`}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => openLoanDetails(loan)}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedCaseSet.has(loan.ID)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => handleCaseToggle(loan.ID, event.target.checked)}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-slate-900">{loan.ID}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-700">{loan.userId}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-700">{loan.applyTime}</td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-slate-900">
                        {loan.amount}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-700">{loan.rvStaffName}</td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            openLoanDetails(loan);
                          }}
                          aria-label={`View ${loan.ID}`}
                        >
                          <i className="fa fa-eye text-xs" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAssignedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                        No assigned review cases found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </div>
          {activeView === "unassigned" && filteredRows.length > PAGE_SIZE ? (
            <TablePager
              currentPage={unassignedPage}
              totalPages={totalUnassignedPages}
              totalItems={filteredRows.length}
              pageSize={PAGE_SIZE}
              onPrev={() => setUnassignedPage((page) => Math.max(1, page - 1))}
              onNext={() =>
                setUnassignedPage((page) => Math.min(totalUnassignedPages, page + 1))
              }
            />
          ) : null}
          {activeView === "assigned" && filteredAssignedRows.length > PAGE_SIZE ? (
            <TablePager
              currentPage={assignedPage}
              totalPages={totalAssignedPages}
              totalItems={filteredAssignedRows.length}
              pageSize={PAGE_SIZE}
              onPrev={() => setAssignedPage((page) => Math.max(1, page - 1))}
              onNext={() =>
                setAssignedPage((page) => Math.min(totalAssignedPages, page + 1))
              }
            />
          ) : null}
        </div>
        {modalTitle === "assignModal" ? (
          <MyModal>
            <AssignModalContent />
          </MyModal>
        ) : null}
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone = "default" }) {
  const toneClassName =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "info"
      ? "bg-blue-50 text-blue-700"
      : "bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-xl border border-slate-200 px-3 py-2.5 ${toneClassName}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function TablePager({ currentPage, totalPages, totalItems, pageSize, onPrev, onNext }) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={currentPage === 1}
          onClick={onPrev}
        >
          Prev
        </button>
        <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={currentPage === totalPages}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
