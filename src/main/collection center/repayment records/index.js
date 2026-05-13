import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import BasicSelect from "../../../components/inputs/select";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";
import {
  getAdminsByGroupIds,
  getGroupOptionsByDepartment,
  getManagedGroupIdsForUser,
} from "../../../libs/staffGroups";

export default function CollectionPaymentRecords() {
  const {
    setLoan,
    _routeToPage,
    colPayRecs,
    globalLoader,
    customers,
    admins,
    staffGroups,
    inputs,
    select,
    dateRange,
    _handleOnChange,
    _handleSelect,
    user,
    _hasAccess,
  } = React.useContext(GlobalContext);
  const paymentScope = _hasAccess("action:collection:payments:all")
    ? "all"
    : _hasAccess("action:collection:payments:group")
      ? "group"
      : _hasAccess("action:collection:payments:own")
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

  const officers = React.useMemo(
    () =>
      admins
        .filter((item) => item.role === "col-team-lead" || item.role === "col-personel")
        .filter((item) => {
          if (paymentScope === "all") return true;
          if (paymentScope === "group") {
            if (scopedOfficerNames.size === 0) {
              return String(item.userName || "").trim() === currentOfficerName;
            }
            return scopedOfficerNames.has(String(item.userName || "").trim());
          }
          return String(item.userName || "").trim() === currentOfficerName;
        })
        .map((off) => ({ label: off.userName, value: off.userName })),
    [admins, currentOfficerName, paymentScope, scopedOfficerNames]
  );
  const groupOptions = React.useMemo(
    () => {
      const options = getGroupOptionsByDepartment(staffGroups, "collection");
      if (paymentScope === "all") return options;
      const allowedIds = new Set(managedGroupIds);
      return options.filter((group) => allowedIds.has(String(group.value || "")));
    },
    [managedGroupIds, paymentScope, staffGroups]
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

  const calcPenalty = (loan) => {
    const dp = new Date(loan.dp);
    const dop = new Date(loan.dop);
    const timeDiff = dp.getTime() - dop.getTime();
    const diffDate = timeDiff / (1000 * 3600 * 24);
    const dur = parseInt(diffDate, 10);
    return (2 / 100) * parseInt(loan.amount, 10) * dur;
  };

  const rows = React.useMemo(
    () =>
      (Array.isArray(colPayRecs) ? colPayRecs : []).map((loan) => {
        const customer =
          customers === undefined || customers.length === 0
            ? {}
            : customers.find((person) => person.userId === loan.userId);
        const callRecord =
          loan.collCallRecords === undefined || loan.collCallRecords.length === 0
            ? {}
            : loan.collCallRecords.slice(-1)[0];
        const repaymentAmount = parseFloat(loan.repaymentAmount || 0) + calcPenalty(loan);
        const overallAmountPaid = parseFloat(loan.overallAmountPaid || loan.amountPaid || 0);

        return {
          ...loan,
          id: loan.ID,
          orderId: loan.ID,
          phone: customer?.phone || "",
          repAmount: repaymentAmount.toFixed(2),
          amountLeft: `GHC${Math.max(repaymentAmount - overallAmountPaid, 0).toFixed(2)}`,
          dateApplied: loan.doa ? new Date(loan.doa).toLocaleDateString() : "-",
          datePaid: loan.dp ? new Date(loan.dp).toLocaleDateString() : "-",
          collOfficer: loan.collofficer || callRecord.collOfficer || "-",
        };
      }),
    [colPayRecs, customers]
  );

  const filteredRows = React.useMemo(() => {
    const normalizedUserId = String(inputs.userId || "").trim().toLowerCase();
    const normalizedLoanId = String(inputs.loanId || "").trim().toLowerCase();
    const normalizedPhone = String(inputs.phone || "").trim().toLowerCase();
    const normalizedOfficer = String(select.collectionStaff || "").trim().toLowerCase();
    const normalizedGroup = String(select.collectionGroup || "").trim();

    const scopedRows = rows.filter((row) => {
      const officerName = String(row.collOfficer || "").trim();

      if (paymentScope === "all") return true;
      if (paymentScope === "group") {
        if (scopedOfficerNames.size === 0) {
          return officerName === currentOfficerName;
        }
        return scopedOfficerNames.has(officerName);
      }
      if (paymentScope === "own") {
        return officerName === currentOfficerName;
      }

      return false;
    });

    return scopedRows.filter((row) => {
      const matchesUserId =
        !normalizedUserId ||
        String(row.userId || "").trim().toLowerCase().includes(normalizedUserId);
      const matchesLoanId =
        !normalizedLoanId ||
        String(row.orderId || "").trim().toLowerCase().includes(normalizedLoanId);
      const matchesPhone =
        !normalizedPhone ||
        String(row.phone || "").trim().toLowerCase().includes(normalizedPhone);
      const matchesOfficer =
        !normalizedOfficer ||
        String(row.collOfficer || "").trim().toLowerCase().includes(normalizedOfficer);
      const matchedAdmin = admins.find(
        (admin) => String(admin.userName || "") === String(row.collOfficer || "")
      );
      const matchesGroup =
        !normalizedGroup || String(matchedAdmin?.staffGroupId || "") === normalizedGroup;

      return (
        matchesUserId &&
        matchesLoanId &&
        matchesPhone &&
        matchesOfficer &&
        matchesGroup &&
        isWithinDateRange(row.dp)
      );
    });
  }, [
    admins,
    currentOfficerName,
    inputs.loanId,
    inputs.phone,
    inputs.userId,
    isWithinDateRange,
    paymentScope,
    rows,
    scopedOfficerNames,
    select.collectionGroup,
    select.collectionStaff,
  ]);

  const totalAmount = filteredRows.reduce(
    (sum, row) => sum + parseFloat(row.amountPaid || 0),
    0
  );

  const handleExport = () => {
    if (!filteredRows.length) return;

    const header = ["Order ID", "User ID", "Phone", "Date Applied", "Date Paid", "Repayment Amount", "Amount Paid", "Amount Left", "Collection Staff"].join(",");
    const csvRows = filteredRows.map((row) =>
      [
        row.orderId,
        row.userId,
        row.phone,
        row.dateApplied,
        row.datePaid,
        row.repAmount,
        row.amountPaid,
        row.amountLeft,
        row.collOfficer,
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([[header, ...csvRows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "collection-payment-records.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: "orderId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "phone", label: "Phone" },
    { key: "dateApplied", label: "Applied" },
    { key: "datePaid", label: "Paid" },
    { key: "repAmount", label: "Repayment" },
    { key: "amountPaid", label: "Amount Paid" },
    { key: "amountLeft", label: "Amount Left" },
    { key: "collOfficer", label: "Collection Staff" },
  ];

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Collection Payment Records</h3>
            <p className="text-sm text-slate-500">
              Live filters, compact layout, and quick export for repayment records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="app-chip">{filteredRows.length} records</div>
            <button type="button" className="app-btn-secondary gap-2" onClick={handleExport}>
              <i className="fa fa-download text-xs" />
              Export
            </button>
          </div>
        </div>

        <div className="app-panel-body space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="app-label">User ID</label>
              <input
                type="text"
                className="app-input"
                placeholder="User ID"
                value={inputs.userId}
                onChange={(e) => _handleOnChange({ field: "userId", value: e.target.value })}
              />
            </div>
            <div>
              <label className="app-label">Order ID</label>
              <input
                type="text"
                className="app-input"
                placeholder="Order ID"
                value={inputs.loanId}
                onChange={(e) => _handleOnChange({ field: "loanId", value: e.target.value })}
              />
            </div>
            <div>
              <label className="app-label">Phone</label>
              <input
                type="text"
                className="app-input"
                placeholder="Phone Number"
                value={inputs.phone}
                onChange={(e) => _handleOnChange({ field: "phone", value: e.target.value })}
              />
            </div>
            {paymentScope !== "own" ? (
              <div>
                <label className="app-label">Collection Staff</label>
                <BasicSelect data={officers} title="Collection Staff" />
              </div>
            ) : null}
            {paymentScope === "group" || paymentScope === "all" ? (
              <div>
                <label className="app-label">Collection Group</label>
                <BasicSelect data={groupOptions} title="Collection Group" />
              </div>
            ) : null}
            <div>
              <label className="app-label">Date Range</label>
              <CustomDateRangeInputs />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="app-btn-secondary gap-2"
              onClick={() => {
                _handleOnChange({ field: "userId", value: "" });
                _handleOnChange({ field: "loanId", value: "" });
                _handleOnChange({ field: "phone", value: "" });
                _handleSelect({ field: "Collection Staff", value: "" });
                _handleSelect({ field: "Collection Group", value: "" });
                _handleOnChange({ field: "dateRange", value: null });
              }}
            >
              <i className="fa fa-undo text-xs" />
              Clear
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Total amount collected: <span className="font-semibold text-slate-900">GHC{totalAmount.toFixed(2)}</span>
          </div>

          {globalLoader ? <div className="text-sm text-slate-500">Loading repayment records...</div> : null}

          <SimpleDataTable
            columns={columns}
            rows={filteredRows}
            rowKey="id"
            dense
            pageSize={10}
            emptyMessage="No collection payment records found."
            onRowClick={(row) => {
              localStorage.setItem("loan", JSON.stringify(row));
              setLoan(row);
              _routeToPage("/collection-loan-details");
            }}
          />
        </div>
      </section>
    </div>
  );
}
