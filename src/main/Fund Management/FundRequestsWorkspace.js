import React from "react";
import * as XLSX from "xlsx";
import SimpleDataTable from "../../components/tables/SimpleDataTable";
import { GlobalContext } from "../../libs/context/globalContext";
import {
  createFundBatch,
  createFundRequest,
  decideFundRequests,
  getFundRequests,
  resendFundRequest,
} from "../../handlers/funds";
import { getGroupOptionsByDepartment } from "../../libs/staffGroups";

const payoutOperatorOptions = [
  { value: "MTN", label: "MTN" },
  { value: "AIRTEL", label: "Airtel" },
  { value: "ZAMTEL", label: "Zamtel" },
  { value: "TELECEL", label: "Telecel" },
  { value: "VODAFONE", label: "Vodafone" },
  { value: "AIRTELTIGO", label: "AirtelTigo" },
];

const getPermissionBase = ({ requestType, requestMode }) =>
  requestMode === "batch"
    ? requestType === "payment"
      ? "action:fund:batch-payment"
      : "action:fund:batch-airtime"
    : requestType === "payment"
    ? "action:fund:payment"
    : "action:fund:airtime";

const buildInitialSingleForm = (requestType) => ({
  department: "",
  staffGroupId: "",
  employeeUserId: "",
  amount: "",
  reason: "",
  remark: "",
  destinationNumber: "",
  destinationOperator: requestType === "payment" ? "" : "",
});

const buildTabs = ({ requestType, failedOnly }) => {
  if (failedOnly) {
    return [{ id: "failed", label: "Failed" }];
  }

  if (requestType === "payment") {
    return [
      { id: "pending_first_approval", label: "Pending First Approval" },
      { id: "pending_second_approval", label: "Pending Second Approval" },
      { id: "all_records", label: "All Records" },
    ];
  }

  return [
    { id: "pending_first_approval", label: "Pending Review" },
    { id: "all_records", label: "Completed / Rejected" },
  ];
};

const formatMoney = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
};

const statusLabelMap = {
  pending_first_approval: "Pending First Approval",
  pending_second_approval: "Pending Second Approval",
  completed: "Completed",
  rejected: "Rejected",
  failed: "Failed",
};

const badgeTone = {
  pending_first_approval: "bg-amber-50 text-amber-700",
  pending_second_approval: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  failed: "bg-rose-100 text-rose-800",
};

export default function FundRequestsWorkspace({
  title,
  description,
  requestType,
  requestMode = "single",
  failedOnly = false,
  requestModeFilter = requestMode,
}) {
  const { admins, staffGroups, departments, user, _hasAccess, setAlerts, alerts } =
    React.useContext(GlobalContext);
  const permissionBase = React.useMemo(
    () => getPermissionBase({ requestType, requestMode }),
    [requestMode, requestType]
  );
  const tabs = React.useMemo(() => buildTabs({ requestType, failedOnly }), [failedOnly, requestType]);
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.id || "pending_first_approval");
  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [bulkRemark, setBulkRemark] = React.useState("");
  const [decisionRemark, setDecisionRemark] = React.useState("");
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [batchModalOpen, setBatchModalOpen] = React.useState(false);
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const [singleForm, setSingleForm] = React.useState(buildInitialSingleForm(requestType));
  const [batchRows, setBatchRows] = React.useState([]);
  const [batchRemark, setBatchRemark] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const canInitiate = _hasAccess(`${permissionBase}:initiate`);
  const canFirstApprove = _hasAccess(`${permissionBase}:approve:first`);
  const canSecondApprove =
    requestType === "payment" ? _hasAccess(`${permissionBase}:approve:second`) : false;
  const canResendRow = React.useCallback(
    (row = {}) =>
      _hasAccess(
        `${getPermissionBase({
          requestType: row.requestType || requestType,
          requestMode: row.requestMode || requestMode,
        })}:resend`
      ),
    [_hasAccess, requestMode, requestType]
  );

  const loadRequests = React.useCallback(async () => {
    setLoading(true);
    const response = await getFundRequests({
      requestType,
      requestMode: requestModeFilter,
    });
    setLoading(false);

    if (response.success === 0) {
      setAlerts({
        ...alerts,
        open: true,
        type: "error",
        msg: response.message,
      });
      return;
    }

    setRequests(Array.isArray(response.data) ? response.data : []);
  }, [alerts, requestModeFilter, requestType, setAlerts]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const currentGroupOptions = React.useMemo(
    () => getGroupOptionsByDepartment(staffGroups, singleForm.department),
    [singleForm.department, staffGroups]
  );

  const employeeBuckets = React.useMemo(() => {
    const departmentKey = String(singleForm.department || "").trim().toLowerCase();
    const candidates = admins.filter(
      (admin) => String(admin.department || "").trim().toLowerCase() === departmentKey
    );

    if (!singleForm.staffGroupId) {
      return {
        groupMembers: [],
        otherMembers: candidates,
      };
    }

    return {
      groupMembers: candidates.filter(
        (admin) => String(admin.staffGroupId || "") === String(singleForm.staffGroupId || "")
      ),
      otherMembers: candidates.filter(
        (admin) => String(admin.staffGroupId || "") !== String(singleForm.staffGroupId || "")
      ),
    };
  }, [admins, singleForm.department, singleForm.staffGroupId]);

  const visibleRows = React.useMemo(() => {
    const query = String(search || "").trim().toLowerCase();

    return requests
      .filter((row) => {
        if (failedOnly) return row.status === "failed";
        if (activeTab === "all_records") return ["completed", "rejected"].includes(row.status);
        return row.status === activeTab;
      })
      .filter((row) => {
        const matchesDepartment =
          !departmentFilter ||
          String(row.department || "").trim().toLowerCase() ===
            String(departmentFilter || "").trim().toLowerCase();
        const matchesGroup =
          !groupFilter || String(row.staffGroupId || "") === String(groupFilter || "");
        const matchesQuery =
          !query ||
          [
            row.requestCode,
            row.batchReference,
            row.employeeUserName,
            row.employeeName,
            row.reason,
            row.destinationNumber,
            row.initiatedBy?.userName,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchesDepartment && matchesGroup && matchesQuery;
      });
  }, [activeTab, departmentFilter, failedOnly, groupFilter, requests, search]);

  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id));

  React.useEffect(() => {
    setSelectedIds([]);
    setBulkRemark("");
  }, [activeTab, failedOnly, requestMode, requestModeFilter, requestType]);

  const columns = React.useMemo(
    () => [
      {
        key: "select",
        label:
          !failedOnly && activeTab !== "all_records" ? (
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(event) => {
                if (event.target.checked) {
                  setSelectedIds(visibleRows.map((row) => row.id));
                  return;
                }

                setSelectedIds([]);
              }}
            />
          ) : (
            ""
          ),
        render: (row) =>
          !failedOnly && activeTab !== "all_records" ? (
            <input
              type="checkbox"
              checked={selectedIds.includes(row.id)}
              onClick={(event) => event.stopPropagation()}
              onChange={() =>
                setSelectedIds((current) =>
                  current.includes(row.id)
                    ? current.filter((item) => item !== row.id)
                    : [...current, row.id]
                )
              }
            />
          ) : (
            "-"
          ),
      },
      { key: "requestCode", label: "Request Code", cellClassName: "font-semibold text-slate-900" },
      {
        key: "requestMode",
        label: "Mode",
        render: (row) =>
          String(row.requestMode || "")
            .replace(/^./, (value) => value.toUpperCase()) || "-",
      },
      { key: "employeeUserName", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "staffGroupName", label: "Group" },
      {
        key: "amount",
        label: "Amount",
        render: (row) => formatMoney(row.amount),
      },
      { key: "destinationNumber", label: requestType === "payment" ? "Salary Number" : "Phone Number" },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              badgeTone[row.status] || "bg-slate-100 text-slate-700"
            }`}
          >
            {statusLabelMap[row.status] || row.status}
          </span>
        ),
      },
      { key: "initiator", label: "Initiator", render: (row) => row.initiatedBy?.userName || "-" },
      {
        key: "approvers",
        label: "Approvers",
        render: (row) =>
          [row.firstApproval?.actor?.userName, row.secondApproval?.actor?.userName]
            .filter(Boolean)
            .join(" / ") || "-",
      },
      {
        key: "createdAt",
        label: "Created",
        render: (row) =>
          row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-",
      },
    ],
    [activeTab, allVisibleSelected, failedOnly, requestType, selectedIds, visibleRows]
  );

  const updateSingleForm = (field, value) => {
    setSingleForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEmployeeChange = (employeeUserId) => {
    const employee = admins.find((admin) => admin.userId === employeeUserId);

    if (!employee) {
      updateSingleForm("employeeUserId", "");
      return;
    }

    setSingleForm((current) => ({
      ...current,
      employeeUserId,
      destinationNumber:
        requestType === "payment" ? employee.salaryNumber || "" : employee.phone || "",
      destinationOperator:
        requestType === "payment" ? employee.salaryOperator || "" : current.destinationOperator,
    }));
  };

  const openReview = (row) => {
    setSelectedRequest(row);
    setDecisionRemark("");
    setReviewModalOpen(true);
  };

  const handleCreateSingle = async () => {
    if (!singleForm.employeeUserId || !singleForm.amount || !singleForm.reason) {
      return setAlerts({
        ...alerts,
        open: true,
        type: "warning",
        msg: "Please complete all required request fields.",
      });
    }

    if (!String(singleForm.destinationNumber || "").trim()) {
      return setAlerts({
        ...alerts,
        open: true,
        type: "warning",
        msg:
          requestType === "payment"
            ? "Salary number is required before a payment request can be submitted."
            : "Phone number is required before an airtime request can be submitted.",
      });
    }

    if (requestType === "payment" && !String(singleForm.destinationOperator || "").trim()) {
      return setAlerts({
        ...alerts,
        open: true,
        type: "warning",
        msg: "Salary operator is required before a payment request can be submitted.",
      });
    }

    setSubmitting(true);
    const response = await createFundRequest({
      requestType,
      requestMode,
      employeeUserId: singleForm.employeeUserId,
      amount: Number(singleForm.amount || 0),
      reason: singleForm.reason,
      remark: singleForm.remark,
      destinationNumber: singleForm.destinationNumber,
      destinationOperator: singleForm.destinationOperator,
      actorUserId: user?.userId || "",
      actorUserName: user?.userName || "",
    });
    setSubmitting(false);

    if (response.success === 0) {
      return setAlerts({
        ...alerts,
        open: true,
        type: "error",
        msg: response.message,
      });
    }

    setCreateModalOpen(false);
    setSingleForm(buildInitialSingleForm(requestType));
    await loadRequests();
    setAlerts({
      ...alerts,
      open: true,
      type: "success",
      msg: response.message,
    });
  };

  const handleDecision = async ({ ids, decision, remark }) => {
    setSubmitting(true);
    const response = await decideFundRequests({
      ids,
      decision,
      remark,
      actorUserId: user?.userId || "",
      actorUserName: user?.userName || "",
    });
    setSubmitting(false);

    if (response.success === 0) {
      return setAlerts({
        ...alerts,
        open: true,
        type: "error",
        msg: response.message,
      });
    }

    setSelectedIds([]);
    setReviewModalOpen(false);
    setSelectedRequest(null);
    setDecisionRemark("");
    setBulkRemark("");
    await loadRequests();
    setAlerts({
      ...alerts,
      open: true,
      type: "success",
      msg: response.message,
    });
  };

  const handleResend = async (row) => {
    setSubmitting(true);
    const response = await resendFundRequest(row.id, {
      actorUserId: user?.userId || "",
      actorUserName: user?.userName || "",
    });
    setSubmitting(false);

    if (response.success === 0) {
      return setAlerts({
        ...alerts,
        open: true,
        type: "error",
        msg: response.message,
      });
    }

    await loadRequests();
    setAlerts({
      ...alerts,
      open: true,
      type: "success",
      msg: response.message,
    });
  };

  const downloadTemplate = () => {
    const rows = [
      { userName: "EXAMPLEUSER1", amount: 150, reason: "April allowance" },
      { userName: "EXAMPLEUSER2", amount: 75, reason: "Transport support" },
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(
      workbook,
      `${requestMode}-${requestType}-template.xlsx`.replace(/\s+/g, "-").toLowerCase()
    );
  };

  const handleBatchFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonRows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });

    setBatchRows(
      jsonRows
        .map((row) => ({
          userName: String(row.userName || row.UserName || row.username || "").trim().toUpperCase(),
          amount: Number(row.amount || row.Amount || 0),
          reason: String(row.reason || row.Reason || "").trim(),
        }))
        .filter((row) => row.userName && row.amount > 0 && row.reason)
    );
  };

  const handleBatchSubmit = async () => {
    if (batchRows.length === 0) {
      return setAlerts({
        ...alerts,
        open: true,
        type: "warning",
        msg: "Import a valid xlsx file first.",
      });
    }

    setSubmitting(true);
    const response = await createFundBatch({
      requestType,
      requestMode: "batch",
      items: batchRows,
      remark: batchRemark,
      actorUserId: user?.userId || "",
      actorUserName: user?.userName || "",
    });
    setSubmitting(false);

    if (response.success === 0) {
      return setAlerts({
        ...alerts,
        open: true,
        type: "error",
        msg: response.message,
      });
    }

    setBatchModalOpen(false);
    setBatchRows([]);
    setBatchRemark("");
    await loadRequests();
    setAlerts({
      ...alerts,
      open: true,
      type: "success",
      msg: response.message,
    });
  };

  const singleActionAllowed =
    activeTab === "pending_first_approval"
      ? canFirstApprove
      : activeTab === "pending_second_approval"
      ? canSecondApprove
      : false;

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!failedOnly && requestMode === "single" && canInitiate ? (
              <button
                type="button"
                className="app-btn-primary gap-2"
                onClick={() => setCreateModalOpen(true)}
              >
                {requestType === "payment" ? "Make Payment" : "Apply Airtime"}
              </button>
            ) : null}
            {!failedOnly && requestMode === "batch" && canInitiate ? (
              <>
                <button type="button" className="app-btn-secondary" onClick={downloadTemplate}>
                  Download Import Template
                </button>
                <button
                  type="button"
                  className="app-btn-primary"
                  onClick={() => setBatchModalOpen(true)}
                >
                  Import {requestType === "payment" ? "Payment" : "Talktime"} List
                </button>
              </>
            ) : null}
            <button type="button" className="app-btn-secondary" onClick={loadRequests}>
              Refresh
            </button>
          </div>
        </div>

        <div className="app-panel-body space-y-5">
          {!failedOnly ? (
            <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="text"
              className="app-input"
              placeholder="Search request, employee, reason"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="app-select"
              value={departmentFilter}
              onChange={(event) => {
                setDepartmentFilter(event.target.value);
                setGroupFilter("");
              }}
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.value} value={department.value}>
                  {department.label}
                </option>
              ))}
            </select>
            <select
              className="app-select"
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
              disabled={!departmentFilter}
            >
              <option value="">{departmentFilter ? "All groups" : "Select department first"}</option>
              {getGroupOptionsByDepartment(staffGroups, departmentFilter).map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{visibleRows.length}</span> record(s)
            </div>
          </div>

          {!failedOnly && activeTab !== "all_records" && selectedIds.length > 0 ? (
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
              <div>
                <label className="app-label">Bulk Remark</label>
                <input
                  type="text"
                  className="app-input"
                  value={bulkRemark}
                  onChange={(event) => setBulkRemark(event.target.value)}
                  placeholder="Optional remark for selected requests"
                />
              </div>
              <button
                type="button"
                className="app-btn-primary"
                disabled={!singleActionAllowed || submitting}
                onClick={() =>
                  handleDecision({ ids: selectedIds, decision: "approve", remark: bulkRemark })
                }
              >
                Bulk Approve
              </button>
              <button
                type="button"
                className="app-btn-secondary"
                disabled={!singleActionAllowed || submitting}
                onClick={() =>
                  handleDecision({ ids: selectedIds, decision: "reject", remark: bulkRemark })
                }
              >
                Bulk Reject
              </button>
            </div>
          ) : null}

          <SimpleDataTable
            columns={columns}
            rows={visibleRows}
            rowKey="id"
            dense
            pageSize={10}
            loading={loading}
            loadingMessage="Loading fund requests..."
            emptyMessage="No matching fund requests found."
            onRowClick={openReview}
          />
        </div>
      </section>

      {createModalOpen ? (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-900/55 p-4"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h4 className="text-xl font-semibold text-slate-900">
                {requestType === "payment" ? "Apply for Payment" : "Apply for Airtime"}
              </h4>
              <button type="button" className="text-slate-500" onClick={() => setCreateModalOpen(false)}>
                <i className="fa fa-times text-xl" />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
              <div>
                <label className="app-label">Department</label>
                <select
                  className="app-select"
                  value={singleForm.department}
                  onChange={(event) =>
                    setSingleForm((current) => ({
                      ...current,
                      department: event.target.value,
                      staffGroupId: "",
                      employeeUserId: "",
                      destinationNumber: "",
                      destinationOperator: "",
                    }))
                  }
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.value} value={department.value}>
                      {department.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="app-label">Group</label>
                <select
                  className="app-select"
                  value={singleForm.staffGroupId}
                  onChange={(event) =>
                    setSingleForm((current) => ({
                      ...current,
                      staffGroupId: event.target.value,
                      employeeUserId: "",
                      destinationNumber: "",
                      destinationOperator: "",
                    }))
                  }
                  disabled={!singleForm.department}
                >
                  <option value="">{singleForm.department ? "All group staff" : "Select department first"}</option>
                  {currentGroupOptions.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="app-label">Employee</label>
                <select
                  className="app-select"
                  value={singleForm.employeeUserId}
                  onChange={(event) => handleEmployeeChange(event.target.value)}
                  disabled={!singleForm.department}
                >
                  <option value="">Select employee</option>
                  {employeeBuckets.groupMembers.length > 0 ? (
                    <optgroup label="Selected group employees">
                      {employeeBuckets.groupMembers.map((employee) => (
                        <option key={employee.userId} value={employee.userId}>
                          {employee.userName}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {employeeBuckets.otherMembers.length > 0 ? (
                    <optgroup label="Other department employees">
                      {employeeBuckets.otherMembers.map((employee) => (
                        <option key={employee.userId} value={employee.userId}>
                          {employee.userName}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </div>
              <div>
                <label className="app-label">Amount</label>
                <input
                  type="number"
                  min="0"
                  className="app-input"
                  value={singleForm.amount}
                  onChange={(event) => updateSingleForm("amount", event.target.value)}
                />
              </div>
              <div>
                <label className="app-label">
                  {requestType === "payment" ? "Salary Number" : "Phone Number"}
                </label>
                <input
                  type="text"
                  className="app-input"
                  value={singleForm.destinationNumber}
                  onChange={(event) => updateSingleForm("destinationNumber", event.target.value)}
                />
              </div>
              {requestType === "payment" ? (
                <div>
                  <label className="app-label">Salary Operator</label>
                  <select
                    className="app-select"
                    value={singleForm.destinationOperator}
                    onChange={(event) => updateSingleForm("destinationOperator", event.target.value)}
                  >
                    <option value="">Select operator</option>
                    {payoutOperatorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className={requestType === "payment" ? "" : "md:col-span-2"}>
                <label className="app-label">Reason</label>
                <input
                  type="text"
                  className="app-input"
                  value={singleForm.reason}
                  onChange={(event) => updateSingleForm("reason", event.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="app-label">Remark</label>
                <textarea
                  rows={3}
                  className="app-input"
                  value={singleForm.remark}
                  onChange={(event) => updateSingleForm("remark", event.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button type="button" className="app-btn-secondary" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="app-btn-primary" disabled={submitting} onClick={handleCreateSingle}>
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {batchModalOpen ? (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-900/55 p-4"
          onClick={() => setBatchModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h4 className="text-xl font-semibold text-slate-900">
                Import {requestType === "payment" ? "Payment" : "Talktime"} List
              </h4>
              <button type="button" className="text-slate-500" onClick={() => setBatchModalOpen(false)}>
                <i className="fa fa-times text-xl" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div>
                <label className="app-label">Batch Remark</label>
                <input
                  type="text"
                  className="app-input"
                  value={batchRemark}
                  onChange={(event) => setBatchRemark(event.target.value)}
                  placeholder="Optional batch remark"
                />
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <input type="file" accept=".xlsx,.xls" onChange={handleBatchFile} />
                <p className="mt-3 text-sm text-slate-500">
                  Template columns: `userName`, `amount`, `reason`
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {batchRows.length} valid row(s) ready for import
                </p>
                <div className="mt-3 max-h-[280px] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-3 py-2">User Name</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {batchRows.map((row, index) => (
                        <tr key={`${row.userName}-${index}`}>
                          <td className="px-3 py-2">{row.userName}</td>
                          <td className="px-3 py-2">{formatMoney(row.amount)}</td>
                          <td className="px-3 py-2">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button type="button" className="app-btn-secondary" onClick={() => setBatchModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="app-btn-primary" disabled={submitting} onClick={handleBatchSubmit}>
                Submit Batch
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewModalOpen && selectedRequest ? (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-900/55 p-4"
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="w-full max-w-5xl rounded-[28px] border border-slate-200 bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h4 className="text-xl font-semibold text-slate-900">{selectedRequest.requestCode}</h4>
                <p className="text-sm text-slate-500">
                  {selectedRequest.employeeUserName} · {statusLabelMap[selectedRequest.status] || selectedRequest.status}
                </p>
              </div>
              <button type="button" className="text-slate-500" onClick={() => setReviewModalOpen(false)}>
                <i className="fa fa-times text-xl" />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Employee</p>
                <p className="mt-2 font-semibold text-slate-900">{selectedRequest.employeeUserName}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Department</p>
                <p className="mt-2 font-semibold text-slate-900">{selectedRequest.department || "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Group</p>
                <p className="mt-2 font-semibold text-slate-900">{selectedRequest.staffGroupName || "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Amount</p>
                <p className="mt-2 font-semibold text-slate-900">{formatMoney(selectedRequest.amount)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Destination</p>
                <p className="mt-2 font-semibold text-slate-900">{selectedRequest.destinationNumber}</p>
              </div>
              {requestType === "payment" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Service Provider</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedRequest.destinationOperator || "-"}
                  </p>
                </div>
              ) : null}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Reason</p>
                <p className="mt-2 font-semibold text-slate-900">{selectedRequest.reason}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Initiator</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {selectedRequest.initiatedBy?.userName || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Gateway</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {selectedRequest.gatewayProvider || selectedRequest.gatewayStatus || "-"}
                </p>
              </div>
              <div className="md:col-span-2 xl:col-span-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Remark</p>
                <p className="mt-2 text-slate-900">
                  {selectedRequest.remark || selectedRequest.gatewayMessage || "-"}
                </p>
              </div>
              <div className="md:col-span-2 xl:col-span-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Approver Names</p>
                <p className="mt-2 text-slate-900">
                  First: {selectedRequest.firstApproval?.actor?.userName || "-"} | Second:{" "}
                  {selectedRequest.secondApproval?.actor?.userName || "-"}
                </p>
              </div>
            </div>
            {!failedOnly && ["pending_first_approval", "pending_second_approval"].includes(selectedRequest.status) ? (
              <div className="border-t border-slate-200 px-6 py-5">
                <label className="app-label">Decision Remark</label>
                <textarea
                  rows={3}
                  className="app-input"
                  value={decisionRemark}
                  onChange={(event) => setDecisionRemark(event.target.value)}
                />
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    className="app-btn-secondary"
                    onClick={() =>
                      handleDecision({
                        ids: [selectedRequest.id],
                        decision: "reject",
                        remark: decisionRemark,
                      })
                    }
                    disabled={
                      submitting ||
                      (selectedRequest.status === "pending_first_approval"
                        ? !canFirstApprove
                        : !canSecondApprove)
                    }
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="app-btn-primary"
                    onClick={() =>
                      handleDecision({
                        ids: [selectedRequest.id],
                        decision: "approve",
                        remark: decisionRemark,
                      })
                    }
                    disabled={
                      submitting ||
                      (selectedRequest.status === "pending_first_approval"
                        ? !canFirstApprove
                        : !canSecondApprove)
                    }
                  >
                    Approve
                  </button>
                </div>
              </div>
            ) : failedOnly && canResendRow(selectedRequest) ? (
              <div className="border-t border-slate-200 px-6 py-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="app-btn-primary"
                    disabled={submitting}
                    onClick={() => handleResend(selectedRequest)}
                  >
                    Resend
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
