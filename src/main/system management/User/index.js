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
    _handleSyncStaffGroupMembers,
    globalLoader,
    select,
    _hasAccess,
  } = React.useContext(GlobalContext);
  const canCreateUser = _hasAccess("action:user:create");
  const canToggleActive = _hasAccess("action:user:toggle-active");
  const canEditUser = _hasAccess("action:user:update");
  const canDeleteUser = _hasAccess("action:user:delete");
  const [activeTab, setActiveTab] = React.useState("users");
  const [pendingUserId, setPendingUserId] = React.useState("");
  const [selectedUserIds, setSelectedUserIds] = React.useState([]);
  const [bulkGroupId, setBulkGroupId] = React.useState("");
  const [selectedGroupId, setSelectedGroupId] = React.useState("");
  const [isGroupEditing, setIsGroupEditing] = React.useState(false);
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = React.useState([]);
  const [groupForm, setGroupForm] = React.useState({
    groupId: "",
    name: "",
    department: "",
    description: "",
  });
  const [groupEditor, setGroupEditor] = React.useState({
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
  const departmentUsersMap = React.useMemo(
    () =>
      rows.reduce((accumulator, row) => {
        const key = String(row.department || "").trim().toLowerCase();
        accumulator[key] = [...(accumulator[key] || []), row];
        return accumulator;
      }, {}),
    [rows]
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
        const memberNames = members
          .map((member) => member.userName)
          .filter(Boolean);
        return {
          ...group,
          id: group.id,
          departmentLabel: getDepartmentLabel(group.department),
          memberCount: members.length,
          memberNames,
          membersPreview:
            memberNames.length === 0
              ? "-"
              : memberNames.length <= 3
              ? memberNames.join(", ")
              : `${memberNames.slice(0, 3).join(", ")} ...`,
        };
      }),
    [normalizedGroups, rows]
  );
  const selectedGroup = React.useMemo(
    () => groupRows.find((group) => group.id === selectedGroupId) || null,
    [groupRows, selectedGroupId]
  );
  const selectedGroupDepartmentUsers = React.useMemo(() => {
    if (!selectedGroup) return [];

    const departmentKey = String(selectedGroup.department || "").trim().toLowerCase();
    const departmentUsers = departmentUsersMap[departmentKey] || [];

    return departmentUsers
      .filter(
        (userRow) =>
          !String(userRow.staffGroupId || "").trim() ||
          String(userRow.staffGroupId || "") === String(selectedGroup.id || "")
      )
      .sort((left, right) => {
        const leftChecked = selectedGroupMemberIds.includes(left.userId) ? 0 : 1;
        const rightChecked = selectedGroupMemberIds.includes(right.userId) ? 0 : 1;
        if (leftChecked !== rightChecked) return leftChecked - rightChecked;
        return String(left.userName || "").localeCompare(String(right.userName || ""));
      });
  }, [departmentUsersMap, selectedGroup, selectedGroupMemberIds]);

  React.useEffect(() => {
    if (!selectedGroup && groupRows.length > 0) {
      setSelectedGroupId(groupRows[0].id);
    }
  }, [groupRows, selectedGroup]);

  React.useEffect(() => {
    if (!selectedGroup) {
      setIsGroupEditing(false);
      setSelectedGroupMemberIds([]);
      setGroupEditor({
        groupId: "",
        name: "",
        department: "",
        description: "",
      });
      return;
    }

    setGroupEditor({
      groupId: selectedGroup.id,
      name: selectedGroup.name || "",
      department: selectedGroup.department || "",
      description: selectedGroup.description || "",
    });
    setSelectedGroupMemberIds(
      (selectedGroup.memberNames || [])
        .map((userName) =>
          rows.find((row) => String(row.userName || "") === String(userName || ""))?.userId
        )
        .filter(Boolean)
    );
    setIsGroupEditing(false);
  }, [selectedGroup, rows]);

  const handleGroupEdit = (group) => {
    setActiveTab("groups");
    setSelectedGroupId(group.id);
    setGroupEditor({
      groupId: group.id,
      name: group.name || "",
      department: group.department || "",
      description: group.description || "",
    });
    setSelectedGroupMemberIds(
      rows
        .filter((row) => row.staffGroupId === group.id)
        .map((row) => row.userId)
        .filter(Boolean)
    );
    setIsGroupEditing(true);
  };

  const resetGroupForm = () => {
    setGroupForm({
      groupId: "",
      name: "",
      department: "",
      description: "",
    });
  };

  const handleSaveGroupDetail = async () => {
    if (!selectedGroup) return;

    const updateResponse = await _handleUpdateStaffGroup({
      groupId: selectedGroup.id,
      name: groupEditor.name,
      department: selectedGroup.department,
      description: groupEditor.description,
    });

    if (!updateResponse) return;

    const syncResponse = await _handleSyncStaffGroupMembers({
      groupId: selectedGroup.id,
      memberUserIds: selectedGroupMemberIds,
    });

    if (syncResponse) {
      setIsGroupEditing(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
            <p className="text-sm text-slate-500">
              Manage staff accounts and department groups in separate tabs.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "users"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "groups"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("groups")}
            >
              Groups
            </button>
          </div>
        </div>

        {activeTab === "users" ? (
          <div className="app-panel-body space-y-4">
            <div className="flex items-center justify-between">
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
                  Add User
                </button>
              ) : null}
            </div>

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
        ) : (
          <div className="app-panel-body space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Staff Groups</h4>
                <p className="text-sm text-slate-500">
                  Click a row to open full group details and member selection.
                </p>
              </div>
              <div className="app-chip">{groupRows.length} groups</div>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-slate-900">Create Group</h5>
                <p className="text-xs text-slate-500">
                  Group creation stays separate from editing the members of an existing group.
                </p>
              </div>
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
              <div className="mt-4 flex flex-wrap gap-3">
                {canCreateUser ? (
                  <button
                    type="button"
                    className="app-btn-primary gap-2"
                    onClick={async () => {
                      const response = await _handleCreateStaffGroup(groupForm);
                      if (response) resetGroupForm();
                    }}
                  >
                    <i className="fa fa-plus text-xs" />
                    Create Group
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
            </section>

            <SimpleDataTable
              columns={[
                { key: "name", label: "Group", cellClassName: "font-semibold text-slate-900" },
                { key: "departmentLabel", label: "Department" },
                { key: "description", label: "Description" },
                { key: "memberCount", label: "Members" },
                { key: "membersPreview", label: "Assigned Users" },
                {
                  key: "actions",
                  label: "",
                  render: (row) => (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex min-w-[74px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedGroupId(row.id);
                          setIsGroupEditing(false);
                        }}
                      >
                        Open
                      </button>
                      {canEditUser ? (
                        <button
                          type="button"
                          className="inline-flex min-w-[70px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleGroupEdit(row);
                          }}
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
                            if (response && row.id === selectedGroupId) {
                              setSelectedGroupId("");
                            }
                          }}
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
              onRowClick={(row) => {
                setSelectedGroupId(row.id);
                setIsGroupEditing(false);
              }}
              getRowClassName={(row) =>
                row.id === selectedGroupId ? "bg-blue-50" : ""
              }
            />

            {selectedGroup ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                      Group Details
                    </p>
                    <h4 className="text-xl font-semibold text-slate-900">
                      {selectedGroup.name}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {getDepartmentLabel(selectedGroup.department)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canEditUser ? (
                      <button
                        type="button"
                        className="app-btn-secondary gap-2"
                        onClick={() => {
                          if (isGroupEditing) {
                            setGroupEditor({
                              groupId: selectedGroup.id,
                              name: selectedGroup.name || "",
                              department: selectedGroup.department || "",
                              description: selectedGroup.description || "",
                            });
                            setSelectedGroupMemberIds(
                              rows
                                .filter((row) => row.staffGroupId === selectedGroup.id)
                                .map((row) => row.userId)
                            );
                            setIsGroupEditing(false);
                            return;
                          }
                          handleGroupEdit(selectedGroup);
                        }}
                      >
                        {isGroupEditing ? "Cancel Edit" : "Edit Group"}
                      </button>
                    ) : null}
                    {canEditUser && isGroupEditing ? (
                      <button
                        type="button"
                        className="app-btn-primary gap-2"
                        onClick={handleSaveGroupDetail}
                      >
                        Save Group
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div>
                      <label className="app-label">Group Name</label>
                      <input
                        type="text"
                        className="app-input"
                        value={groupEditor.name}
                        disabled={!isGroupEditing}
                        onChange={(event) =>
                          setGroupEditor((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="app-label">Department</label>
                      <input
                        type="text"
                        className="app-input bg-slate-100"
                        value={getDepartmentLabel(selectedGroup.department)}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="app-label">Description</label>
                      <textarea
                        rows={4}
                        className="app-input min-h-[112px] resize-none"
                        value={groupEditor.description}
                        disabled={!isGroupEditing}
                        onChange={(event) =>
                          setGroupEditor((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Checked Members
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {selectedGroupMemberIds.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Available Staff
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {selectedGroupDepartmentUsers.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-semibold text-slate-900">
                          Department Staff
                        </h5>
                        <p className="text-xs text-slate-500">
                          Checked users belong to this group and stay at the top.
                        </p>
                      </div>
                    </div>

                    <div className="max-h-[440px] space-y-2 overflow-auto">
                      {selectedGroupDepartmentUsers.map((member) => {
                        const isChecked = selectedGroupMemberIds.includes(member.userId);
                        return (
                          <label
                            key={member.userId}
                            className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 ${
                              isChecked
                                ? "border-blue-200 bg-blue-50"
                                : "border-slate-200 bg-white"
                            } ${isGroupEditing ? "cursor-pointer" : "cursor-default"}`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={!isGroupEditing}
                                onChange={(event) => {
                                  if (!isGroupEditing) return;
                                  const checked = event.target.checked;
                                  setSelectedGroupMemberIds((current) =>
                                    checked
                                      ? [...current, member.userId]
                                      : current.filter((item) => item !== member.userId)
                                  );
                                }}
                              />
                              <div>
                                <p
                                  className={`text-sm ${
                                    isChecked
                                      ? "font-semibold text-slate-900"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {member.userName}
                                </p>
                                <p className="text-xs text-slate-500">{member.role}</p>
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                isChecked
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {isChecked ? "Assigned" : "Available"}
                            </span>
                          </label>
                        );
                      })}
                      {selectedGroupDepartmentUsers.length === 0 ? (
                        <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500">
                          No department users are currently available for this group.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        )}
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
