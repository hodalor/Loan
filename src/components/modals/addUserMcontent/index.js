import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import BigLoader from "../../loaders/bigLoader";
import PermissionManager from "../../permissions/PermissionManager";
import { getDefaultPermissionsForRole } from "../../../config/navigation";
import { getGroupOptionsByDepartment } from "../../../libs/staffGroups";

const initialFields = {
  userName: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  role: "",
  department: "",
  gender: "",
  staffGroupId: "",
  managedStaffGroupIds: [],
  permissions: [],
};

export default function AddUserDetial() {
  const { roles, departments, genders, staffGroups, _handleCreateAdmin, bigLoader } =
    React.useContext(GlobalContext);
  const [fields, setFields] = React.useState(initialFields);
  const groupOptions = React.useMemo(
    () => getGroupOptionsByDepartment(staffGroups, fields.department),
    [fields.department, staffGroups]
  );

  const updateField = (field, value) => {
    setFields((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreate = async () => {
    const response = await _handleCreateAdmin(fields);

    if (response) {
      setFields(initialFields);
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Staff Setup
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Create Staff Account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Role defaults load automatically, and you can still add or remove
              grants before saving.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            {fields.permissions.length} grants selected
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-4">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Profile Details
            </h3>
            <p className="text-sm text-slate-500">
              Basic identity, login, and team placement for the new staff account.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="app-label">User Name*</label>
              <input
                type="text"
                className="app-input"
                placeholder="Username"
                value={fields.userName}
                onChange={(e) => updateField("userName", e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="app-label">First Name*</label>
              <input
                type="text"
                className="app-input"
                placeholder="First name"
                value={fields.firstName}
                onChange={(e) =>
                  updateField("firstName", e.target.value.toUpperCase())
                }
              />
            </div>
            <div>
              <label className="app-label">Last Name*</label>
              <input
                type="text"
                className="app-input"
                placeholder="Last name"
                value={fields.lastName}
                onChange={(e) => updateField("lastName", e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="app-label">Phone Number*</label>
              <input
                type="text"
                className="app-input"
                placeholder="Phone number"
                value={fields.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="app-label">Email*</label>
              <input
                type="email"
                className="app-input"
                placeholder="Email address"
                value={fields.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div>
              <label className="app-label">Password*</label>
              <input
                type="text"
                className="app-input"
                placeholder="Temporary password"
                value={fields.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
            </div>
            <div>
              <label className="app-label">Role*</label>
              <select
                className="app-select"
                value={fields.role}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  setFields((current) => ({
                    ...current,
                    role: nextRole,
                    permissions: nextRole
                      ? getDefaultPermissionsForRole(nextRole)
                      : [],
                  }));
                }}
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
              <label className="app-label">Department*</label>
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
                <option value="">{fields.department ? "No group" : "Select department first"}</option>
                {groupOptions.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="xl:col-span-2">
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
                Optional. Use this for team leads or managers who should see more than one group.
              </p>
            </div>
            <div>
              <label className="app-label">Gender*</label>
              <select
                className="app-select"
                value={fields.gender}
                onChange={(e) => updateField("gender", e.target.value)}
              >
                <option value="">Select gender</option>
                {genders.map((gender) => (
                  <option key={gender.value} value={gender.value}>
                    {gender.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <PermissionManager
          role={fields.role}
          selectedPermissions={fields.permissions}
          onChange={(permissions) => updateField("permissions", permissions)}
          title="Access Grants"
          subtitle="Group menu access, operational actions, and feature rights for this staff account."
        />

        <div className="flex justify-end">
          <button
            type="button"
            className="app-btn-primary gap-2"
            onClick={handleCreate}
          >
            <i className="fa fa-user-plus text-sm" />
            Create Admin
          </button>
        </div>
      </div>
    </div>
  );
}
