import React from "react";
import {
  getDefaultPermissionsForRoleFromGroups,
  permissionGroups,
} from "../../config/navigation";

const countSelected = (group, selected) =>
  group.items.filter((item) => selected.includes(item.key)).length;

export default function PermissionManager({
  role,
  selectedPermissions,
  onChange,
  title = "Permissions",
  subtitle = "Choose menu access and operational actions for this staff account.",
  permissionOptions = permissionGroups,
}) {
  const allSelected = React.useMemo(
    () => (Array.isArray(selectedPermissions) ? selectedPermissions : []),
    [selectedPermissions]
  );
  const availableGroups = React.useMemo(
    () => (Array.isArray(permissionOptions) ? permissionOptions : permissionGroups),
    [permissionOptions]
  );
  const visiblePermissionKeys = React.useMemo(
    () =>
      availableGroups.flatMap((group) =>
        (Array.isArray(group?.items) ? group.items : []).map((item) => item.key)
      ),
    [availableGroups]
  );
  const hiddenSelected = React.useMemo(
    () => allSelected.filter((permission) => !visiblePermissionKeys.includes(permission)),
    [allSelected, visiblePermissionKeys]
  );
  const checkboxRefs = React.useRef({});

  const handleGroupToggle = (group, checked) => {
    if (checked) {
      const next = [
        ...new Set([
          ...hiddenSelected,
          ...allSelected,
          ...group.items.map((item) => item.key),
        ]),
      ];
      onChange(next);
      return;
    }

    const next = allSelected.filter(
      (permission) => !group.items.some((item) => item.key === permission)
    );
    onChange([...new Set([...hiddenSelected, ...next])]);
  };

  const handlePermissionToggle = (permissionKey, checked) => {
    const next = checked
      ? [...new Set([...hiddenSelected, ...allSelected, permissionKey])]
      : allSelected.filter((permission) => permission !== permissionKey);

    onChange([...new Set([...hiddenSelected, ...next])]);
  };

  const applyRoleDefaults = () => {
    onChange([
      ...new Set([
        ...hiddenSelected,
        ...getDefaultPermissionsForRoleFromGroups(role, availableGroups),
      ]),
    ]);
  };

  React.useEffect(() => {
    availableGroups.forEach((group) => {
      const selectedCount = countSelected(group, allSelected);
      const input = checkboxRefs.current[group.id];

      if (input) {
        input.indeterminate =
          selectedCount > 0 && selectedCount < group.items.length;
      }
    });
  }, [allSelected, availableGroups]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-soft">
            {allSelected.length} grants selected
          </div>
          <button
            type="button"
            onClick={applyRoleDefaults}
            className="app-btn-secondary"
          >
            Load Role Default
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {availableGroups.map((group) => {
          const selectedCount = countSelected(group, allSelected);
          const isChecked = selectedCount === group.items.length && group.items.length > 0;

          return (
            <section
              key={group.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
            >
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
                <label className="flex items-start gap-3">
                  <input
                    ref={(node) => {
                      checkboxRefs.current[group.id] = node;
                    }}
                    type="checkbox"
                    checked={isChecked}
                    onChange={(event) =>
                      handleGroupToggle(group, event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    <span className="block text-base font-semibold text-slate-900">
                      {group.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {group.description}
                    </span>
                  </span>
                </label>
                <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  {selectedCount}/{group.items.length}
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => {
                  const checked = allSelected.includes(item.key);

                  return (
                    <label
                      key={item.key}
                      className={`flex min-h-[96px] cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                        checked
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          handlePermissionToggle(item.key, event.target.checked)
                        }
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-[11px] leading-4 text-slate-500">
                          {item.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
