import React from "react";
import MyModal from "../../../components/modals";
import { GlobalContext } from "../../../libs/context/globalContext";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";
import EditUserDetial from "../../../components/modals/editUserMcontent";
import AddUserDetial from "../../../components/modals/addUserMcontent";

export default function CreateUsers() {
  const {
    setModal,
    setaddUserModal,
    setmodalTitle,
    modalTitle,
    admins,
    _handleChangeActiveStatus,
    setUserDetails,
    inputs,
    departments,
    _handleOnChange,
    _handleSelect,
    globalLoader,
    select,
    _hasAccess,
  } = React.useContext(GlobalContext);
  const canCreateUser = _hasAccess("action:user:create");
  const canToggleActive = _hasAccess("action:user:toggle-active");
  const [pendingUserId, setPendingUserId] = React.useState("");

  const rows = React.useMemo(
    () =>
      (Array.isArray(admins) ? admins : []).map((admin, index) => ({
        ...admin,
        id: admin._id || admin.userId || index + 1,
        name: `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || "-",
        onlineState: admin.isOnline ? "Online" : "Offline",
        activeState: admin.isActive ? "Active" : "Disabled",
      })),
    [admins]
  );

  const filteredRows = React.useMemo(() => {
    const normalizedUserName = String(inputs.userName || "").trim().toLowerCase();
    const normalizedPhone = String(inputs.phone || "").trim().toLowerCase();
    const normalizedDate = String(inputs.date || "").trim();
    const normalizedDepartment = String(select.department || "").trim().toLowerCase();

    return rows.filter((row) => {
      const matchesUserName =
        !normalizedUserName ||
        String(row.userName || "").trim().toLowerCase().includes(normalizedUserName);
      const matchesPhone =
        !normalizedPhone ||
        String(row.phone || "").trim().toLowerCase().includes(normalizedPhone);
      const matchesDate =
        !normalizedDate ||
        String(row.createdAt || "").slice(0, 10) === normalizedDate;
      const matchesDepartment =
        !normalizedDepartment ||
        String(row.department || "").trim().toLowerCase() === normalizedDepartment;

      return matchesUserName && matchesPhone && matchesDate && matchesDepartment;
    });
  }, [inputs.date, inputs.phone, inputs.userName, rows, select.department]);

  const columns = [
    { key: "userId", label: "User ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userName", label: "Username" },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "role", label: "Role" },
    {
      key: "onlineState",
      label: "Online",
      render: (row) => (
        <span
          className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
            row.isOnline
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              row.isOnline ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
          {row.onlineState}
        </span>
      ),
    },
    {
      key: "activeState",
      label: "Active",
      render: (row) => (
        <button
          type="button"
          disabled={!canToggleActive || (globalLoader && pendingUserId === row.userId)}
          onClick={async (event) => {
            event.stopPropagation();
            setPendingUserId(row.userId);
            await _handleChangeActiveStatus(row.userId);
            setPendingUserId("");
          }}
          className={`inline-flex min-w-[92px] items-center justify-between gap-2 rounded-full px-2 py-1 text-xs font-semibold transition ${
            row.isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-600"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {globalLoader && pendingUserId === row.userId ? (
            <>
              <span>{row.isActive ? "Disabling" : "Enabling"}</span>
              <span className="inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            </>
          ) : (
            <>
              <span>{row.activeState}</span>
              <span className="h-4 w-4 rounded-full bg-white shadow" />
            </>
          )}
        </button>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          onClick={(event) => {
            event.stopPropagation();
            setmodalTitle("userDetailsM");
            setModal(true);
            setUserDetails(row);
          }}
          aria-label={`Open ${row.userName}`}
        >
          <i className="fa fa-ellipsis-h text-xs" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">User Administration</h3>
            <p className="text-sm text-slate-500">
              Live staff search with compact actions and reduced page spacing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="app-chip">{filteredRows.length} staff</div>
            {canCreateUser ? (
              <button
                type="button"
                className="app-btn-primary gap-2"
                onClick={() => {
                  setmodalTitle("addUserModal");
                  setaddUserModal(true);
                }}
              >
                <i className="fa fa-plus text-xs" />
                Add
              </button>
            ) : null}
          </div>
        </div>

        <div className="app-panel-body space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="app-label">Username</label>
              <input
                type="text"
                value={inputs.userName}
                onChange={(e) =>
                  _handleOnChange({
                    field: "userName",
                    value: e.target.value.toUpperCase(),
                  })
                }
                className="app-input"
                placeholder="Search username"
                aria-label="username"
              />
            </div>
            <div>
              <label className="app-label">Phone</label>
              <input
                type="text"
                value={inputs.phone}
                onChange={(e) =>
                  _handleOnChange({
                    field: "phone",
                    value: e.target.value,
                  })
                }
                className="app-input"
                placeholder="Search phone"
                aria-label="phone"
              />
            </div>
            <div>
              <label className="app-label">Department</label>
              <select
                className="app-select"
                value={select.department}
                onChange={(e) =>
                  _handleSelect({
                    field: "Departments",
                    value: e.target.value,
                  })
                }
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="app-label">Created Date</label>
              <input
                type="date"
                value={inputs.date}
                onChange={(e) =>
                  _handleOnChange({
                    field: "date",
                    value: e.target.value,
                  })
                }
                className="app-input"
                aria-label="date"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="app-btn-secondary gap-2"
              onClick={() => {
                _handleOnChange({ field: "userName", value: "" });
                _handleOnChange({ field: "phone", value: "" });
                _handleOnChange({ field: "date", value: "" });
                _handleSelect({ field: "Departments", value: "" });
              }}
            >
              <i className="fa fa-undo text-xs" />
              Clear
            </button>
          </div>

          {globalLoader ? (
            <div className="text-sm text-slate-500">Loading users...</div>
          ) : null}

          <SimpleDataTable
            columns={columns}
            rows={filteredRows}
            rowKey="id"
            dense
            pageSize={10}
            emptyMessage="No staff records found."
          />
        </div>
      </section>

      {modalTitle === "userDetailsM" ? (
        <MyModal>
          <EditUserDetial />
        </MyModal>
      ) : null}

      {modalTitle === "addUserModal" ? (
        <MyModal>
          <AddUserDetial />
        </MyModal>
      ) : null}
    </div>
  );
}
