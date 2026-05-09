import React from "react";
import BasicSelect from "../../../components/inputs/select";
import { GlobalContext } from "../../../libs/context/globalContext";
import MyModal from "../../../components/modals";
import PreModalContent from "../../../components/modals/pre-col-content";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";
import DefaultLoader from "../../../components/loaders/defaultLoader";
import { _unassignPreColCases } from "../../../handlers";

const TAB_ITEMS = [
  { id: "unassigned", label: "Unassigned Cases" },
  { id: "assigned", label: "Assigned Cases" },
  { id: "completed", label: "Completed Cases" },
];

export default function AdvanceCaseList() {
  const {
    _routeToPage,
    preCollectionCases,
    customers,
    globalLoader,
    setLoan,
    setSelectedCases,
    assignedPreColCases,
    setmodalTitle,
    selectedCases,
    modalTitle,
    _handleOnChange,
    _handleSelect,
    inputs,
    select,
    dateRange,
    loanTypes,
    preColDays,
    admins,
    preCaseStatus,
    preCompCases,
    user,
    _hasAccess,
  } = React.useContext(GlobalContext);

  const [ttl, setTtl] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("unassigned");
  const [actionLoading, setActionLoading] = React.useState("");
  const canAssignPreCollection = _hasAccess("action:precollection:assign");
  const selectedCaseSet = React.useMemo(() => new Set(selectedCases), [selectedCases]);

  const officers = React.useMemo(
    () =>
      admins
        .filter((admin) => admin.role === "pre-personel" || admin.role === "pre-team-lead")
        .map((off) => ({ label: off.userName, value: off.userName })),
    [admins]
  );

  const calcOverdueDays = React.useCallback((loan) => {
    const dp = new Date(loan.dp);
    const dop = new Date(loan.dop);
    const timeDiff = dp.getTime() - dop.getTime();
    return parseInt(timeDiff / (1000 * 3600 * 24), 10);
  }, []);

  const calcPenalty = React.useCallback(
    (loan) => {
      const dur = calcOverdueDays(loan);
      return (2 / 100) * parseInt(loan.amount, 10) * dur;
    },
    [calcOverdueDays]
  );

  const getCustomer = React.useCallback(
    (userId) =>
      customers === undefined || customers.length === 0
        ? {}
        : customers.find((person) => person.userId === userId) || {},
    [customers]
  );

  const buildRow = React.useCallback(
    (loan, mode) => {
      const customer = getCustomer(loan.userId);
      const callRecord =
        loan.preCollCallRecords === undefined || loan.preCollCallRecords.length === 0
          ? {}
          : loan.preCollCallRecords.slice(-1)[0];
      const loanType = customer?.loan?.loans?.length === 1 ? "First-Loan" : "Re-loan";
      const amountLeftBase =
        loan.amountPaid === undefined || loan.amountPaid === ""
          ? parseFloat(loan.repaymentAmount || 0)
          : parseFloat(loan.repaymentAmount || 0) - parseFloat(loan.amountPaid || 0);
      const completedAmountLeft =
        loan.amountPaid === undefined || loan.amountPaid === ""
          ? parseFloat(loan.repaymentAmount || 0) + calcPenalty(loan)
          : parseFloat(loan.repaymentAmount || 0) +
            calcPenalty(loan) -
            parseFloat(loan.amountPaid || 0);

      const rawDays = mode === "completed" ? calcOverdueDays(loan) : Number(loan.dur || 0);
      const daysTag = `T${Math.max(0, Math.min(2, Number(rawDays || 0)))}`;

      return {
        ...loan,
        id: `${mode}-${loan.ID}`,
        loanID: loan.ID,
        userID: loan.userId,
        phone: customer?.phone || "",
        name: `${customer?.IDinfo?.firstName || ""} ${customer?.IDinfo?.middleName || ""} ${customer?.IDinfo?.lastName || ""}`
          .replace(/\s+/g, " ")
          .trim(),
        loanType,
        paymentTerm: loan.duration || "-",
        loanAmount:
          mode === "completed"
            ? (parseFloat(loan.repaymentAmount || 0) + calcPenalty(loan)).toFixed(2)
            : loan.repaymentAmount || "0",
        days: rawDays,
        daysTag,
        amountLeft: (mode === "completed" ? completedAmountLeft : amountLeftBase).toFixed(2),
        repaymentDate: loan.dp ? new Date(loan.dp).toLocaleDateString() : "-",
        dueDate: loan.dop ? new Date(loan.dop).toLocaleDateString() : "-",
        callDate: callRecord.callDate ? new Date(callRecord.callDate).toLocaleDateString() : "-",
        callResult: callRecord.callResult || "-",
        remarks: callRecord.remarks || "-",
        recordedState:
          callRecord && Object.keys(callRecord).length > 0 ? "Recorded Cases" : "Cases not recorded",
        advanceEmployee: loan.preCollOfficer || "-",
      };
    },
    [calcOverdueDays, calcPenalty, getCustomer]
  );

  const unassignedRows = React.useMemo(
    () =>
      preCollectionCases
        .filter((loan) => !loan.preCollOfficer)
        .map((loan) => buildRow(loan, "unassigned")),
    [buildRow, preCollectionCases]
  );

  const assignedRows = React.useMemo(
    () => (assignedPreColCases || []).map((loan) => buildRow(loan, "assigned")),
    [assignedPreColCases, buildRow]
  );

  const completedRows = React.useMemo(
    () => (preCompCases || []).map((loan) => buildRow(loan, "completed")),
    [buildRow, preCompCases]
  );

  const isWithinDateRange = React.useCallback(
    (value) => {
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
    },
    [dateRange]
  );

  const filterRows = React.useCallback(
    (rows, mode) => {
      const normalizedUserId = String(inputs.userId || "").trim().toLowerCase();
      const normalizedLoanId = String(inputs.loanId || "").trim().toLowerCase();
      const normalizedPhone = String(inputs.phone || "").trim().toLowerCase();
      const normalizedLoanType = String(select.loanType || "").trim();
      const normalizedDays = String(select.days || "").trim();
      const normalizedAdvanceStaff = String(select.advanceStaff || "").trim().toLowerCase();
      const normalizedCaseStatus = String(select.caseStatus || "").trim();

      return rows.filter((row) => {
        const matchesUserId =
          !normalizedUserId ||
          String(row.userID || "").trim().toLowerCase().includes(normalizedUserId);
        const matchesLoanId =
          !normalizedLoanId ||
          String(row.loanID || "").trim().toLowerCase().includes(normalizedLoanId);
        const matchesPhone =
          !normalizedPhone ||
          String(row.phone || "").trim().toLowerCase().includes(normalizedPhone);
        const matchesLoanType =
          !normalizedLoanType ||
          (normalizedLoanType === "firstLoan" ? row.loanType === "First-Loan" : row.loanType === "Re-loan");
        const matchesDays = !normalizedDays || row.daysTag === normalizedDays;
        const matchesAdvanceStaff =
          !normalizedAdvanceStaff ||
          String(row.advanceEmployee || "").trim().toLowerCase().includes(normalizedAdvanceStaff);
        const matchesCaseStatus =
          !normalizedCaseStatus ||
          (normalizedCaseStatus === "recordedCase"
            ? row.recordedState === "Recorded Cases"
            : row.recordedState === "Cases not recorded");

        return (
          matchesUserId &&
          matchesLoanId &&
          matchesPhone &&
          matchesLoanType &&
          matchesDays &&
          (mode === "unassigned" ? true : matchesAdvanceStaff) &&
          (mode === "assigned" ? matchesCaseStatus : true) &&
          isWithinDateRange(row.dop || row.dp)
        );
      });
    },
    [inputs.loanId, inputs.phone, inputs.userId, isWithinDateRange, select.advanceStaff, select.caseStatus, select.days, select.loanType]
  );

  const filteredUnassignedRows = React.useMemo(
    () => filterRows(unassignedRows, "unassigned"),
    [filterRows, unassignedRows]
  );
  const filteredAssignedRows = React.useMemo(
    () => filterRows(assignedRows, "assigned"),
    [assignedRows, filterRows]
  );
  const filteredCompletedRows = React.useMemo(
    () => filterRows(completedRows, "completed"),
    [completedRows, filterRows]
  );

  const activeRows =
    activeTab === "unassigned"
      ? filteredUnassignedRows
      : activeTab === "assigned"
      ? filteredAssignedRows
      : filteredCompletedRows;

  const toggleSelection = (loanId) => {
    setSelectedCases(
      selectedCaseSet.has(loanId)
        ? selectedCases.filter((item) => item !== loanId)
        : [...selectedCases, loanId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedCases(activeRows.map((row) => row.loanID));
      return;
    }

    setSelectedCases([]);
  };

  const handleUnassign = async () => {
    if (selectedCases.length === 0) return;

    setActionLoading("unassign");
    const response = await _unassignPreColCases(selectedCases);
    setActionLoading("");
    if (response.success === 0) return;

    window.location.reload();
  };

  const baseColumns = [
    {
      key: "loanID",
      label: "Loan ID",
      cellClassName: "font-semibold text-slate-900",
    },
    { key: "userID", label: "User ID" },
    { key: "phone", label: "Phone" },
    { key: "name", label: "Customer" },
    { key: "loanType", label: "Loan Type" },
    { key: "paymentTerm", label: "Term" },
    { key: "loanAmount", label: "Repayment" },
    { key: "days", label: "Days" },
    { key: "amountLeft", label: "Amount Left" },
  ];

  const detailsColumn = {
    key: "actions",
    label: "",
    render: (row) => (
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        onClick={(event) => {
          event.stopPropagation();
          localStorage.setItem("loan", JSON.stringify(row));
          setLoan(row);
          _routeToPage("/pre-loan-details");
        }}
      >
        <i className="fa fa-eye text-xs" />
      </button>
    ),
  };

  const selectionColumn = {
    key: "select",
    label:
      activeTab !== "completed" ? (
        <input
          type="checkbox"
          checked={activeRows.length > 0 && activeRows.every((row) => selectedCaseSet.has(row.loanID))}
          onChange={(event) => handleSelectAll(event.target.checked)}
        />
      ) : (
        ""
      ),
    render: (row) => (
      <input
        type="checkbox"
        checked={selectedCaseSet.has(row.loanID)}
        onClick={(event) => event.stopPropagation()}
        onChange={() => toggleSelection(row.loanID)}
      />
    ),
  };

  const unassignedColumns = [
    ...(user.role === "pre-personel" || !canAssignPreCollection ? [] : [selectionColumn]),
    ...baseColumns,
    { key: "remarks", label: "Remarks" },
    detailsColumn,
  ];

  const assignedColumns = [
    ...(user.role === "pre-personel" || !canAssignPreCollection ? [] : [selectionColumn]),
    ...baseColumns,
    { key: "dueDate", label: "Due Date" },
    { key: "callDate", label: "Last Call" },
    { key: "advanceEmployee", label: "Advance Staff" },
    { key: "callResult", label: "Call Result" },
    detailsColumn,
  ];

  const completedColumns = [
    ...baseColumns,
    { key: "repaymentDate", label: "Paid Date" },
    { key: "callDate", label: "Last Call" },
    { key: "advanceEmployee", label: "Advance Staff" },
    { key: "callResult", label: "Call Result" },
    detailsColumn,
  ];

  const activeColumns =
    activeTab === "unassigned"
      ? unassignedColumns
      : activeTab === "assigned"
      ? assignedColumns
      : completedColumns;

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Advance Cases List</h3>
            <p className="text-sm text-slate-500">
              Compact live filters, dense tables, and cleaner assignment controls.
            </p>
          </div>
          <div className="app-chip">{activeRows.length} cases</div>
        </div>

        <div className="app-panel-body space-y-4">
          <div className="flex flex-wrap gap-3 border-b border-slate-200">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-1 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-blue-600 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div>
              <label className="app-label">User ID</label>
              <input
                type="text"
                className="app-input"
                value={inputs.userId}
                onChange={(e) => _handleOnChange({ field: "userId", value: e.target.value })}
                placeholder="User ID"
              />
            </div>
            <div>
              <label className="app-label">Loan ID</label>
              <input
                type="text"
                className="app-input"
                value={inputs.loanId}
                onChange={(e) => _handleOnChange({ field: "loanId", value: e.target.value })}
                placeholder="Loan ID"
              />
            </div>
            <div>
              <label className="app-label">Phone</label>
              <input
                type="text"
                className="app-input"
                value={inputs.phone}
                onChange={(e) => _handleOnChange({ field: "phone", value: e.target.value })}
                placeholder="Phone Number"
              />
            </div>
            <div>
              <label className="app-label">Loan Type</label>
              <BasicSelect data={loanTypes} title="Loan type" />
            </div>
            <div>
              <label className="app-label">Day Bucket</label>
              <BasicSelect data={preColDays} title="Days" />
            </div>
            <div>
              <label className="app-label">Date Range</label>
              <CustomDateRangeInputs />
            </div>
            {activeTab !== "unassigned" ? (
              <div>
                <label className="app-label">Advance Staff</label>
                <BasicSelect data={officers} title="Advance Staff" />
              </div>
            ) : null}
            {activeTab === "assigned" ? (
              <div>
                <label className="app-label">Case Status</label>
                <BasicSelect data={preCaseStatus} title="Case Status" />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="app-btn-secondary gap-2"
              onClick={() => {
                _handleOnChange({ field: "userId", value: "" });
                _handleOnChange({ field: "loanId", value: "" });
                _handleOnChange({ field: "phone", value: "" });
                _handleOnChange({ field: "dateRange", value: null });
                _handleSelect({ field: "Loan type", value: "" });
                _handleSelect({ field: "Days", value: "" });
                _handleSelect({ field: "Advance Staff", value: "" });
                _handleSelect({ field: "Case Status", value: "" });
                setSelectedCases([]);
              }}
            >
              <i className="fa fa-undo text-xs" />
              Clear
            </button>

            {activeTab === "unassigned" &&
            user.role !== "pre-personel" &&
            canAssignPreCollection ? (
              <button
                type="button"
                className="app-btn-primary gap-2"
                disabled={selectedCases.length === 0}
                onClick={() => {
                  setTtl("");
                  setmodalTitle("preColContent");
                }}
              >
                <i className="fa fa-share text-xs" />
                Assign
              </button>
            ) : null}

            {activeTab === "assigned" &&
            user.role !== "pre-personel" &&
            canAssignPreCollection ? (
              <>
                <button
                  type="button"
                  className="app-btn-primary gap-2"
                  disabled={selectedCases.length === 0}
                  onClick={() => {
                    setTtl("re-assign");
                    setmodalTitle("preColContent");
                  }}
                >
                  <i className="fa fa-random text-xs" />
                  Reassign
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={selectedCases.length === 0 || actionLoading === "unassign"}
                  onClick={handleUnassign}
                >
                  <i className="fa fa-times text-xs" />
                  {actionLoading === "unassign" ? "Unassigning..." : "Unassign"}
                </button>
              </>
            ) : null}
          </div>

          {globalLoader ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
              <DefaultLoader />
              Loading cases...
            </div>
          ) : null}

          <SimpleDataTable
            columns={activeColumns}
            rows={activeRows}
            rowKey="id"
            dense
            pageSize={10}
            emptyMessage="No advance cases found."
          />
        </div>

        {modalTitle === "preColContent" ? (
          <MyModal>
            <PreModalContent title={ttl} />
          </MyModal>
        ) : null}
      </section>
    </div>
  );
}
