import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import BigLoader from "../../loaders/bigLoader";
import PermissionManager from "../../permissions/PermissionManager";
import { normalizeUserPermissions } from "../../../config/navigation";
import { getGroupOptionsByDepartment } from "../../../libs/staffGroups";

const buildEditState = (userDetails = {}) => ({
  userName: userDetails.userName || "",
  firstName: userDetails.firstName || "",
  lastName: userDetails.lastName || "",
  phone: userDetails.phone || "",
  email: userDetails.email || "",
  password: "",
  role: userDetails.role || "",
  department: userDetails.department || "",
  staffGroupId: userDetails.staffGroupId || "",
  managedStaffGroupIds: Array.isArray(userDetails.managedStaffGroupIds)
    ? userDetails.managedStaffGroupIds
    : [],
  permissions: normalizeUserPermissions(
    userDetails.role || "",
    userDetails.permissions || []
  ),
});

const infoCardClass =
  "rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-soft";

export default function EditUserDetial() {
  const {
    isEdit,
    setIsEdit,
    roles,
    departments,
    staffGroups,
    bigLoader,
    _handleEditUser,
    userDetails,
    _handleDelete,
    _hasAccess,
  } = React.useContext(GlobalContext);
  const canEditUser = _hasAccess("action:user:update");
  const canDeleteUser = _hasAccess("action:user:delete");

  const [fields, setFields] = React.useState(() => buildEditState(userDetails));
  const groupOptions = React.useMemo(
    () => getGroupOptionsByDepartment(staffGroups, fields.department),
    [fields.department, staffGroups]
  );

  React.useEffect(() => {
    setFields(buildEditState(userDetails));
  }, [userDetails]);

  const updateField = (field, value) => {
    setFields((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleToggleEdit = () => {
    if (isEdit) {
      setFields(buildEditState(userDetails));
    }

    setIsEdit(!isEdit);
  };

  const handleSave = async () => {
    const response = await _handleEditUser(fields);

    if (response) {
      setFields({
        ...buildEditState({
          ...userDetails,
          ...fields,
          permissions: fields.permissions,
        }),
        password: "",
      });
    }
  };

  return (
    <div className="relative w-[min(860px,92vw)]">
      {bigLoader ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-slate-950/30 backdrop-blur-sm">
          <BigLoader />
        </div>
      ) : null}

      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Staff Profile
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {isEdit ? "Edit User Details" : "User Details"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review account details, access grants, and team placement for this
              staff member.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canEditUser ? (
              <button
                type="button"
                onClick={handleToggleEdit}
                className="inline-flex min-w-[92px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {isEdit ? "Cancel" : "Edit"}
              </button>
            ) : null}
            {canDeleteUser ? (
              <button
                type="button"
                onClick={_handleDelete}
                className="inline-flex min-w-[92px] items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-4">
        {isEdit ? (
          <>
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Account Details
                </h3>
                <p className="text-sm text-slate-500">
                  Update profile fields and access without needing to create a new
                  role group.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="app-label">User Name</label>
                  <input
                    type="text"
                    className="app-input bg-slate-100"
                    value={fields.userName}
                    disabled
                  />
                </div>
                <div>
                  <label className="app-label">First Name</label>
                  <input
                    type="text"
                    className="app-input"
                    value={fields.firstName}
                    onChange={(e) =>
                      updateField("firstName", e.target.value.toUpperCase())
                    }
                  />
                </div>
                <div>
                  <label className="app-label">Last Name</label>
                  <input
                    type="text"
                    className="app-input"
                    value={fields.lastName}
                    onChange={(e) =>
                      updateField("lastName", e.target.value.toUpperCase())
                    }
                  />
                </div>
                <div>
                  <label className="app-label">Phone Number</label>
                  <input
                    type="text"
                    className="app-input"
                    value={fields.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className="app-label">Email</label>
                  <input
                    type="email"
                    className="app-input"
                    value={fields.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="app-label">New Password</label>
                  <input
                    type="text"
                    className="app-input"
                    value={fields.password}
                    placeholder="Leave blank to keep current password"
                    onChange={(e) => updateField("password", e.target.value)}
                  />
                </div>
                <div>
                  <label className="app-label">Role</label>
                  <select
                    className="app-select"
                    value={fields.role}
                    onChange={(e) => updateField("role", e.target.value)}
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="app-label">Department</label>
                  <select
                    className="app-select"
                    value={fields.department}
                    onChange={(e) =>
                      setFields((current) => ({
                        ...current,
                        department: e.target.value,
                        staffGroupId: "",
                        managedStaffGroupIds: [],
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
                    value={fields.staffGroupId}
                    onChange={(e) => updateField("staffGroupId", e.target.value)}
                    disabled={!fields.department}
                  >
                    <option value="">
                      {fields.department ? "No group" : "Select department first"}
                    </option>
                    {groupOptions.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 xl:col-span-3">
                  <label className="app-label">Managed Groups</label>
                  <select
                    multiple
                    className="app-select min-h-[120px]"
                    value={fields.managedStaffGroupIds}
                    onChange={(e) =>
                      updateField(
                        "managedStaffGroupIds",
                        Array.from(e.target.selectedOptions, (option) => option.value)
                      )
                    }
                    disabled={!fields.department}
                  >
                    {groupOptions.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Optional. Use this for leaders or managers who should view several groups.
                  </p>
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                    Current grants:{" "}
                    <span className="font-semibold">
                      {fields.permissions.length}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <PermissionManager
              role={fields.role}
              selectedPermissions={fields.permissions}
              onChange={(permissions) => updateField("permissions", permissions)}
              title="Access Grants"
              subtitle="Use role defaults as a starting point, then fine-tune what this staff member can open or perform."
            />

            {canEditUser ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="app-btn-primary gap-2"
                >
                  <i className="fa fa-save text-sm" />
                  Save Changes
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Username</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {userDetails.userName}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">User ID</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {userDetails.userId}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {`${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim()}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Phone Number</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {userDetails.phone}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Department</p>
                <p className="mt-2 text-base font-semibold capitalize text-slate-900">
                  {userDetails.department}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Role</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {userDetails.role}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Group</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {userDetails.staffGroupName || "-"}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Managed Groups</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {Array.isArray(userDetails.managedStaffGroupIds) &&
                  userDetails.managedStaffGroupIds.length > 0
                    ? userDetails.managedStaffGroupIds
                        .map(
                          (groupId) =>
                            staffGroups.find(
                              (group) =>
                                String(group?._id || group?.id || "") === String(groupId || "")
                            )?.name || ""
                        )
                        .filter(Boolean)
                        .join(", ")
                    : "-"}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Gender</p>
                <p className="mt-2 text-base font-semibold capitalize text-slate-900">
                  {userDetails.gender}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Created Date</p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {userDetails.createdAt
                    ? new Date(userDetails.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div className={infoCardClass}>
                <p className="text-sm text-slate-500">Online Status</p>
                <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                  <i
                    className={`fa fa-circle text-xs ${
                      userDetails.isOnline ? "text-emerald-500" : "text-slate-300"
                    }`}
                  />
                  {userDetails.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <i className="fa fa-shield text-lg" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Permission Grants</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {normalizeUserPermissions(
                        userDetails.role || "",
                        userDetails.permissions || []
                      ).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <p className="text-sm text-slate-500">Active Status</p>
                <div className="mt-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white">
                  <span
                    className={`rounded-full px-4 py-2 ${
                      userDetails.isActive ? "bg-emerald-600" : "bg-rose-600"
                    }`}
                  >
                    {userDetails.isActive ? "Active" : "Blocked"}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
