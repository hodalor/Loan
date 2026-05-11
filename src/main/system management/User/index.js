import React from "react";
import MyModal from "../../../components/modals";
import { GlobalContext } from "../../../libs/context/globalContext";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";
import EditUserDetial from "../../../components/modals/editUserMcontent";
import AddUserDetial from "../../../components/modals/addUserMcontent";
import {
  getDepartmentLabel,
  getGroupOptionsByDepartment,
  normalizeGroupCollection,
} from "../../../libs/staffGroups";

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
    staffGroups,
    _handleOnChange,
    _handleSelect,
    _handleCreateStaffGroup,
    _handleUpdateStaffGroup,
    _handleDeleteStaffGroup,
    _handleAssignUsersToGroup,
    globalLoader,
    select,
    _hasAccess,
  } = React.useContext(GlobalContext);
  const canCreateUser = _hasAccess("action:user:create");
  const canToggleActive = _hasAccess("action:user:toggle-active");
  const canEditUser = _hasAccess("action:user:update");
  const canDeleteUser = _hasAccess("action:user:delete");
  const [pendingUserId, setPendingUserId] = React.useState("");
  const [selectedUserIds, setSelectedUserIds] = React.useState([]);
  const [bulkGroupId, setBulkGroupId] = React.useState("");
  const [groupForm, setGroupForm] = React.useState({
    groupId: "",
    name: "",
    department: "",
    description: "",
  });
  const normalizedGroups = React.useMemo(
    () => normalizeGroupCollection(staffGroups),
    [staffGroups]
  );

  const rows = React.useMemo(
    () =>
      (Array.isArray(admins) ? admins : []).map((admin, index) => ({
        ...admin,
        id: admin._id || admin.userId || index + 1,
        name: `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || "-",
        groupName: admin.staffGroupName || "-",
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
  const selectedUsers = React.useMemo(
    () => rows.filter((row) => selectedUserIds.includes(row.userId)),
    [rows, selectedUserIds]
  );
  const selectedDepartments = React.useMemo(
    () =>
      Array.from(
        new Set(
          selectedUsers
            .map((row) => String(row.department || "").trim())
            .filter(Boolean)
        )
      ),
    [selectedUsers]
  );
  const selectedDepartment = selectedDepartments.length === 1 ? selectedDepartments[0] : "";
  const canBulkAssign =
    selectedUsers.length > 0 && selectedDepartments.length === 1 && Boolean(bulkGroupId);
  const bulkGroupOptions = React.useMemo(
    () => getGroupOptionsByDepartment(staffGroups, selectedDepartment),
    [selectedDepartment, staffGroups]
  );

  React.useEffect(() => {
    if (
      bulkGroupId &&
      !bulkGroupOptions.some((group) => String(group.value) === String(bulkGroupId))
    ) {
      setBulkGroupId("");
    }
  }, [bulkGroupId, bulkGroupOptions]);

  const allFilteredSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedUserIds.includes(row.userId));

  const columns = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={(event) => {
            if (event.target.checked) {
              setSelectedUserIds(filteredRows.map((row) => row.userId));
              return;
            }

            setSelectedUserIds([]);
          }}
          aria-label="Select all users"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedUserIds.includes(row.userId)}
          onClick={(event) => event.stopPropagation()}
          onChange={() =>
            setSelectedUserIds((current) =>
              current.includes(row.userId)
                ? current.filter((item) => item !== row.userId)
                : [...current, row.userId]
            )
          }
          aria-label={`Select ${row.userName}`}
        />
      ),
    },
    { key: "userId", label: "User ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userName", label: "Username" },
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "groupName", label: "Group" },
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
          className="inline-flex min-w-[88px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={(event) => {
            event.stopPropagation();
            setmodalTitle("userDetailsM");
            setModal(true);
            setUserDetails(row);
          }}
          aria-label={`Open ${row.userName}`}
        >
          Manage
        </button>
      ),
    },
  ];

  const groupRows = React.useMemo(
    () =>
      normalizedGroups.map((group) => {
        const members = rows.filter((row) => row.staffGroupId === group.id);
        return {
          ...group,
          id: group.id,
          departmentLabel: getDepartmentLabel(group.department),
          memberCount: members.length,
          members:
            members
              .map((member) => member.userName)
              .filter(Boolean)
              .join(", ") || "-",
        };
      }),
    [normalizedGroups, rows]
  );

  const handleGroupEdit = (group) => {
    setGroupForm({
      groupId: group.id,
      name: group.name || "",
      department: group.department || "",
      description: group.description || "",
    });
  };

  const resetGroupForm = () => {
    setGroupForm({
      groupId: "",
      name: "",
      department: "",
      description: "",
    });
  };

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
                setSelectedUserIds([]);
                setBulkGroupId("");
              }}
            >
              <i className="fa fa-undo text-xs" />
              Clear
            </button>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <div>
              <p className="text-sm font-semibold text-slate-900">Bulk Group Assignment</p>
              <p className="mt-1 text-xs text-slate-500">
                Select users from one department only, then choose a group from that same department.
              </p>
              <p className="mt-2 text-xs text-slate-600">
                {selectedUsers.length} selected
                {selectedUsers.length > 0 && selectedDepartment
                  ? `, department: ${getDepartmentLabel(selectedDepartment)}`
                  : selectedDepartments.length > 1
                  ? ", mixed departments selected"
                  : ""}
              </p>
            </div>
            <div>
              <label className="app-label">Target Group</label>
              <select
                className="app-select"
                value={bulkGroupId}
                onChange={(event) => setBulkGroupId(event.target.value)}
                disabled={!selectedDepartment}
              >
                <option value="">
                  {selectedDepartment ? "Select group" : "Select one department only"}
                </option>
                {bulkGroupOptions.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="app-btn-primary gap-2"
                disabled={!canBulkAssign}
                onClick={async () => {
                  const response = await _handleAssignUsersToGroup({
                    userIds: selectedUsers.map((row) => row.userId),
                    staffGroupId: bulkGroupId,
                  });

                  if (response) {
                    setSelectedUserIds([]);
                    setBulkGroupId("");
                  }
                }}
              >
                Assign To Group
              </button>
            </div>
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

      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Staff Groups</h3>
            <p className="text-sm text-slate-500">
              Create department groups, assign staff to them, and keep delete protected until members are removed.
            </p>
          </div>
          <div className="app-chip">{groupRows.length} groups</div>
        </div>

        <div className="app-panel-body space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="app-label">Group Name</label>
              <input
                type="text"
                className="app-input"
                value={groupForm.name}
                onChange={(event) =>
                  setGroupForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="e.g. Group 1"
              />
            </div>
            <div>
              <label className="app-label">Department</label>
              <select
                className="app-select"
                value={groupForm.department}
                onChange={(event) =>
                  setGroupForm((current) => ({
                    ...current,
                    department: event.target.value,
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
            <div className="xl:col-span-2">
              <label className="app-label">Description</label>
              <input
                type="text"
                className="app-input"
                value={groupForm.description}
                onChange={(event) =>
                  setGroupForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional note about what this group handles"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {canCreateUser || canEditUser ? (
              <button
                type="button"
                className="app-btn-primary gap-2"
                onClick={async () => {
                  const response = groupForm.groupId
                    ? await _handleUpdateStaffGroup(groupForm)
                    : await _handleCreateStaffGroup(groupForm);

                  if (response) resetGroupForm();
                }}
              >
                <i className={`fa ${groupForm.groupId ? "fa-save" : "fa-plus"} text-xs`} />
                {groupForm.groupId ? "Save Group" : "Create Group"}
              </button>
            ) : null}
            <button
              type="button"
              className="app-btn-secondary gap-2"
              onClick={resetGroupForm}
            >
              <i className="fa fa-undo text-xs" />
              Clear
            </button>
          </div>

          <SimpleDataTable
            columns={[
              { key: "name", label: "Group", cellClassName: "font-semibold text-slate-900" },
              { key: "departmentLabel", label: "Department" },
              { key: "description", label: "Description" },
              { key: "memberCount", label: "Members" },
              { key: "members", label: "Assigned Users" },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <div className="flex items-center gap-2">
                    {canEditUser ? (
                      <button
                        type="button"
                        className="inline-flex min-w-[70px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleGroupEdit(row);
                        }}
                        aria-label={`Edit ${row.name}`}
                      >
                        Edit
                      </button>
                    ) : null}
                    {canDeleteUser ? (
                      <button
                        type="button"
                        className="inline-flex min-w-[78px] items-center justify-center rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                        onClick={async (event) => {
                          event.stopPropagation();
                          const response = await _handleDeleteStaffGroup(row.id);
                          if (response) resetGroupForm();
                        }}
                        aria-label={`Delete ${row.name}`}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                ),
              },
            ]}
            rows={groupRows}
            rowKey="id"
            dense
            pageSize={8}
            emptyMessage="No staff groups created yet."
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
