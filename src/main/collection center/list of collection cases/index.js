import React from "react";
import BasicSelect from "../../../components/inputs/select";
import { GlobalContext } from "../../../libs/context/globalContext";
import MyModal from "../../../components/modals";
import ColModalContent from "../../../components/modals/col-modal-content";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";
import DefaultLoader from "../../../components/loaders/defaultLoader";
import { _unassignColCases } from "../../../handlers";
import { formatMoney, getCollectionMetrics } from "../../../libs/collectionMetrics";
import { getAdminsByGroupIds, getManagedGroupIdsForUser } from "../../../libs/staffGroups";

const TAB_ITEMS = [
  { id: "unassigned", label: "Unassigned Cases" },
  { id: "assigned", label: "Assigned Cases" },
  { id: "completed", label: "Completed Cases" },
];

export default function ListOfCollectionCases() {
  const {
    _routeToPage,
    collectionCases,
    customers,
    setLoan,
    globalLoader,
    setmodalTitle,
    modalTitle,
    selectedCases,
    setSelectedCases,
    _handleOnChange,
    _handleSelect,
    inputs,
    select,
    dateRange,
    preCaseStatus,
    loanTypes,
    assignedColCases,
    admins,
    completedColCases,
    user,
    _hasAccess,
    staffGroups,
  } = React.useContext(GlobalContext);

  const [ttl, setTtl] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("unassigned");
  const [actionLoading, setActionLoading] = React.useState("");
  const canAssignCollection = _hasAccess("action:collection:assign");
  const canViewUnassigned = _hasAccess("action:collection:cases:unassigned:view");
  const selectedCaseSet = React.useMemo(() => new Set(selectedCases), [selectedCases]);
  const collectionAssignedScope = _hasAccess("action:collection:cases:assigned:all")
    ? "all"
    : _hasAccess("action:collection:cases:assigned:group")
      ? "group"
      : _hasAccess("action:collection:cases:assigned:own")
        ? "own"
        : "none";
  const collectionCompletedScope = _hasAccess("action:collection:cases:completed:all")
    ? "all"
    : _hasAccess("action:collection:cases:completed:group")
      ? "group"
      : _hasAccess("action:collection:cases:completed:own")
        ? "own"
        : "none";
  const managedGroupIds = React.useMemo(
    () => getManagedGroupIdsForUser(user, staffGroups, "collection"),
    [staffGroups, user]
  );
  const scopedOfficerNames = React.useMemo(
    () =>
      new Set(
        getAdminsByGroupIds(admins, managedGroupIds)
          .map((admin) => String(admin.userName || "").trim())
          .filter(Boolean)
      ),
    [admins, managedGroupIds]
  );
  const currentOfficerName = String(user?.userName || "").trim();
  const visibleTabs = React.useMemo(
    () =>
      TAB_ITEMS.filter((tab) => {
        if (tab.id === "unassigned") return canViewUnassigned;
        if (tab.id === "assigned") return collectionAssignedScope !== "none";
        if (tab.id === "completed") return collectionCompletedScope !== "none";
        return true;
      }),
    [canViewUnassigned, collectionAssignedScope, collectionCompletedScope]
  );

  React.useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || "assigned");
    }
  }, [activeTab, visibleTabs]);

  const officers = React.useMemo(
    () =>
      admins
        .filter((item) => item.role === "col-team-lead" || item.role === "col-personel")
        .filter((item) => {
          if (collectionAssignedScope === "all" || collectionCompletedScope === "all") return true;
          if (scopedOfficerNames.size === 0) {
            return String(item.userName || "").trim() === currentOfficerName;
          }
          return scopedOfficerNames.has(String(item.userName || "").trim());
        })
        .map((off) => ({ label: off.userName, value: off.userName })),
    [admins, collectionAssignedScope, collectionCompletedScope, currentOfficerName, scopedOfficerNames]
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
        loan.collCallRecords === undefined || loan.collCallRecords.length === 0
          ? {}
          : loan.collCallRecords.slice(-1)[0];
      const loanType = customer?.loan?.loans?.length === 1 ? "First-Loan" : "Re-loan";
      const metrics = getCollectionMetrics(loan, customer);
      const overdueDays =
        mode === "completed" ? metrics.overdueDays : Math.max(0, -Number(loan.dur || 0));

      return {
        ...loan,
        id: `${mode}-${loan.ID}`,
        loanID: loan.ID,
        userID: loan.userId,
        phone: customer?.phone || "",
        name: `${customer?.IDinfo?.firstName || ""} ${customer?.IDinfo?.middleName || ""} ${customer?.IDinfo?.lastName || ""}`
          .replace(/\s+/g, " ")
          .trim(),
        timeZone: customer?.timeZone || "",
        loanType,
        paymentTerm: loan.duration || "-",
        loanAmount: formatMoney(metrics.repaymentAmount),
        repaymentAmount: metrics.repaymentAmount,
        dueDate: loan.dop ? new Date(loan.dop).toLocaleDateString() : "-",
        overdueDays,
        amountPaid: formatMoney(metrics.amountPaid),
        amountLeft: formatMoney(metrics.amountLeft),
        overduePenalty: formatMoney(metrics.overduePenalty),
        amountPayable: formatMoney(metrics.amountPayable),
        datePaid: loan.dp ? new Date(loan.dp).toLocaleDateString() : "-",
        lastCallDate: callRecord.callDate ? new Date(callRecord.callDate).toLocaleDateString() : "-",
        collOfficer: loan.collofficer || "-",
        callResult: callRecord.callResult || "-",
        paymentStatus: loan.paymentStatus || "-",
        remarks: callRecord.remarks || "-",
        recordedState:
          callRecord && Object.keys(callRecord).length > 0 ? "Recorded Cases" : "Cases not recorded",
      };
    },
    [getCustomer]
  );

  const unassignedRows = React.useMemo(
    () =>
      collectionCases
        .filter((loan) => loan.collofficer === undefined || loan.collofficer === "")
        .map((loan) => buildRow(loan, "unassigned")),
    [buildRow, collectionCases]
  );

  const assignedRows = React.useMemo(
    () => (assignedColCases || []).map((loan) => buildRow(loan, "assigned")),
    [assignedColCases, buildRow]
  );

  const completedRows = React.useMemo(
    () => (completedColCases || []).map((loan) => buildRow(loan, "completed")),
    [buildRow, completedColCases]
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

  const matchesDaysRange = React.useCallback((overdueDays) => {
    const value = String(inputs.daysToFrom || "").trim();
    if (!value) return true;

    if (value.includes("-")) {
      const [minValue, maxValue] = value.split("-").map((item) => Number(item.trim()));
      if (Number.isNaN(minValue) || Number.isNaN(maxValue)) return true;
      return Number(overdueDays) >= minValue && Number(overdueDays) <= maxValue;
    }

    return Number(overdueDays) === Number(value);
  }, [inputs.daysToFrom]);

  const filterRows = React.useCallback(
    (rows, mode) => {
      const normalizedUserId = String(inputs.userId || "").trim().toLowerCase();
      const normalizedLoanId = String(inputs.loanId || "").trim().toLowerCase();
      const normalizedPhone = String(inputs.phone || "").trim().toLowerCase();
      const normalizedLoanType = String(select.loanType || "").trim();
      const normalizedOfficer = String(select.collectionStaff || "").trim().toLowerCase();
      const normalizedCaseStatus = String(select.caseStatus || "").trim();

      const scopedRows = rows.filter((row) => {
        if (mode === "unassigned") return canViewUnassigned;

        const officerName = String(row.collOfficer || "").trim();
        const scope = mode === "assigned" ? collectionAssignedScope : collectionCompletedScope;

        if (scope === "all") return true;
        if (scope === "group") {
          if (scopedOfficerNames.size === 0) {
            return officerName === currentOfficerName;
          }
          return scopedOfficerNames.has(officerName);
        }
        if (scope === "own") {
          return officerName === currentOfficerName;
        }

        return false;
      });

      return scopedRows.filter((row) => {
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
        const matchesOfficer =
          !normalizedOfficer ||
          String(row.collOfficer || "").trim().toLowerCase().includes(normalizedOfficer);
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
          matchesDaysRange(row.overdueDays) &&
          (mode === "unassigned" ? true : matchesOfficer) &&
          (mode === "assigned" ? matchesCaseStatus : true) &&
          isWithinDateRange(row.dop || row.dp)
        );
      });
    },
    [
      canViewUnassigned,
      collectionAssignedScope,
      collectionCompletedScope,
      currentOfficerName,
      inputs.loanId,
      inputs.phone,
      inputs.userId,
      isWithinDateRange,
      matchesDaysRange,
      scopedOfficerNames,
      select.caseStatus,
      select.collectionStaff,
      select.loanType,
    ]
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
    const response = await _unassignColCases(selectedCases);
    setActionLoading("");
    if (response.success === 0) return;

    window.location.reload();
  };

  const baseColumns = [
    { key: "loanID", label: "Loan ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userID", label: "User ID" },
    { key: "phone", label: "Phone" },
    { key: "name", label: "Customer" },
    { key: "loanType", label: "Loan Type" },
    { key: "paymentTerm", label: "Term" },
    { key: "loanAmount", label: "Repayment" },
    { key: "dueDate", label: "Due Date" },
  ];

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
          _routeToPage("/collection-loan-details");
        }}
      >
        <i className="fa fa-eye text-xs" />
      </button>
    ),
  };

  const unassignedColumns = [
    ...(user.role === "col-personel" || !canAssignCollection ? [] : [selectionColumn]),
    ...baseColumns,
    { key: "overdueDays", label: "Overdue Days" },
    { key: "amountPaid", label: "Amount Paid" },
    { key: "overduePenalty", label: "Penalty" },
    { key: "amountPayable", label: "Amount Payable" },
    detailsColumn,
  ];

  const assignedColumns = [
    ...(user.role === "col-personel" || !canAssignCollection ? [] : [selectionColumn]),
    ...baseColumns,
    { key: "overdueDays", label: "Overdue Days" },
    { key: "amountPaid", label: "Amount Paid" },
    { key: "overduePenalty", label: "Penalty" },
    { key: "amountPayable", label: "Amount Payable" },
    { key: "amountLeft", label: "Amount Left" },
    { key: "lastCallDate", label: "Last Call" },
    { key: "collOfficer", label: "Collection Staff" },
    detailsColumn,
  ];

  const completedColumns = [
    ...baseColumns,
    { key: "overdueDays", label: "Overdue Days" },
    { key: "amountPaid", label: "Amount Paid" },
    { key: "overduePenalty", label: "Penalty" },
    { key: "amountPayable", label: "Amount Payable" },
    { key: "amountLeft", label: "Amount Left" },
    { key: "datePaid", label: "Date Completed" },
    { key: "collOfficer", label: "Collection Staff" },
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
            <h3 className="text-lg font-semibold text-slate-900">Collection Cases</h3>
            <p className="text-sm text-slate-500">
              Dense collection queues with live filters and cleaner case actions.
            </p>
          </div>
          <div className="app-chip">{activeRows.length} cases</div>
        </div>

        <div className="app-panel-body space-y-4">
          <div className="flex flex-wrap gap-3 border-b border-slate-200">
            {visibleTabs.map((tab) => (
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
              <label className="app-label">Overdue Days</label>
              <input
                type="text"
                className="app-input"
                value={inputs.daysToFrom}
                onChange={(e) => _handleOnChange({ field: "daysToFrom", value: e.target.value })}
                placeholder="e.g. 1-7"
              />
            </div>
            <div>
              <label className="app-label">Date Range</label>
              <CustomDateRangeInputs />
            </div>
            {activeTab !== "unassigned" && collectionAssignedScope !== "own" ? (
              <div>
                <label className="app-label">Collection Staff</label>
                <BasicSelect data={officers} title="Collection Staff" />
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
                _handleOnChange({ field: "daysToFrom", value: "" });
                _handleOnChange({ field: "dateRange", value: null });
                _handleSelect({ field: "Loan type", value: "" });
                _handleSelect({ field: "Collection Staff", value: "" });
                _handleSelect({ field: "Case Status", value: "" });
                setSelectedCases([]);
              }}
            >
              <i className="fa fa-undo text-xs" />
              Clear
            </button>

            {activeTab === "unassigned" &&
            user.role !== "col-personel" &&
            canAssignCollection ? (
              <button
                type="button"
                className="app-btn-primary gap-2"
                disabled={selectedCases.length === 0}
                onClick={() => {
                  setTtl("");
                  setmodalTitle("colContent");
                }}
              >
                <i className="fa fa-share text-xs" />
                Assign
              </button>
            ) : null}

            {activeTab === "assigned" &&
            user.role !== "col-personel" &&
            canAssignCollection ? (
              <>
                <button
                  type="button"
                  className="app-btn-primary gap-2"
                  disabled={selectedCases.length === 0}
                  onClick={() => {
                    setTtl("re-assign");
                    setmodalTitle("colContent");
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
            emptyMessage="No collection cases found."
          />
        </div>

        {modalTitle === "colContent" ? (
          <MyModal>
            <ColModalContent title={ttl} />
          </MyModal>
        ) : null}
      </section>
    </div>
  );
}
