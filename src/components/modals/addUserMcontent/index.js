import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import BigLoader from "../../loaders/bigLoader";
import PermissionManager from "../../permissions/PermissionManager";
import { getDefaultPermissionsForRole } from "../../../config/navigation";

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
  permissions: [],
};

export default function AddUserDetial() {
  const { roles, departments, genders, _handleCreateAdmin, bigLoader } =
    React.useContext(GlobalContext);
  const [fields, setFields] = React.useState(initialFields);

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
    <div className="relative w-[min(980px,92vw)]">
      {bigLoader ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-slate-950/30 backdrop-blur-sm">
          <BigLoader />
        </div>
      ) : null}

      <div className="border-b border-slate-200 px-6 py-5">
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

      <div className="space-y-6 px-6 py-5">
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Profile Details
            </h3>
            <p className="text-sm text-slate-500">
              Basic identity, login, and team placement for the new staff account.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                onChange={(e) => updateField("department", e.target.value)}
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
