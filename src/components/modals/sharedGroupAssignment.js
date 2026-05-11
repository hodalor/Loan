import React from "react";
import { GlobalContext } from "../../libs/context/globalContext";
import DefaultLoader from "../loaders/defaultLoader";

export default function SharedGroupAssignment({
  department,
  roles,
  title,
  assignAction,
  reassignAction,
  actionKeys,
  actionLabel,
  singleReassignLabel,
}) {
  const { admins, _getGroupMembers, personnelLoading, isActionLoading } =
    React.useContext(GlobalContext);
  const [searchField, setSearchField] = React.useState("");
  const [expandedGroups, setExpandedGroups] = React.useState({});
  const [selectedPersonnel, setSelectedPersonnel] = React.useState([]);
  const [pendingUserId, setPendingUserId] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isReassignMode = title === "re-assign";

  const groups = React.useMemo(
    () => _getGroupMembers(department, roles),
    [_getGroupMembers, department, roles]
  );

  const ungroupedMembers = React.useMemo(() => {
    const allowedRoles = new Set(Array.isArray(roles) ? roles : []);

    return (Array.isArray(admins) ? admins : []).filter(
      (admin) =>
        (!allowedRoles.size || allowedRoles.has(admin.role)) &&
        String(admin.department || "").trim().toLowerCase() ===
          String(department || "").trim().toLowerCase() &&
        !String(admin.staffGroupId || "").trim()
    );
  }, [admins, department, roles]);

  const visibleGroups = React.useMemo(() => {
    const normalizedSearch = String(searchField || "").trim().toLowerCase();
    const sourceGroups = [...groups];

    if (ungroupedMembers.length > 0) {
      sourceGroups.push({
        id: "ungrouped",
        name: "Ungrouped Staff",
        description: "",
        members: ungroupedMembers,
      });
    }

    return sourceGroups
      .map((group) => ({
        ...group,
        members: (group.members || []).filter((member) => {
          if (!normalizedSearch) return true;
          return (
            String(group.name || "").toLowerCase().includes(normalizedSearch) ||
            String(member.userName || "").toLowerCase().includes(normalizedSearch) ||
            String(member.role || "").toLowerCase().includes(normalizedSearch)
          );
        }),
      }))
      .filter((group) => {
        if (!normalizedSearch) return true;
        return (
          String(group.name || "").toLowerCase().includes(normalizedSearch) ||
          group.members.length > 0
        );
      });
  }, [groups, searchField, ungroupedMembers]);

  const selectedMembers = React.useMemo(
    () =>
      visibleGroups
        .flatMap((group) => group.members || [])
        .filter((member) => selectedPersonnel.includes(member.userId)),
    [selectedPersonnel, visibleGroups]
  );

  const assignLoading = isActionLoading(actionKeys.assign);
  const reassignLoading = isActionLoading(actionKeys.reassign);

  const togglePersonnel = (userId) => {
    setSelectedPersonnel((current) =>
      current.includes(userId)
        ? current.filter((item) => item !== userId)
        : [...current, userId]
    );
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  };

  const toggleGroupMembers = (group, checked) => {
    const memberIds = (group.members || []).map((member) => member.userId);
    if (checked) {
      setSelectedPersonnel((current) => Array.from(new Set([...current, ...memberIds])));
      return;
    }

    setSelectedPersonnel((current) => current.filter((item) => !memberIds.includes(item)));
  };

  return (
    <div className="flex w-full max-w-[760px] flex-col p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Select Groups And Staff</h3>
        <p className="mt-1 text-xs text-slate-500">
          {isReassignMode
            ? "Open a group, choose one or more staff, and the selected cases will be redistributed round-robin."
            : "Open a group and pick all members or only some members for round-robin assignment."}
        </p>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <input
          type="text"
          className="app-input !min-h-[40px] !py-2 text-sm"
          placeholder="Search group or staff"
          value={searchField}
          onChange={(event) => setSearchField(event.target.value)}
        />
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={() => setSearchField("")}
        >
          <i className="fa fa-undo text-[11px]" />
          Clear
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span>{visibleGroups.length} group{visibleGroups.length === 1 ? "" : "s"} found</span>
        <span>{selectedPersonnel.length} staff selected</span>
      </div>

      <div className="max-h-[68vh] space-y-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {visibleGroups.map((group) => {
          const members = group.members || [];
          const allSelected =
            members.length > 0 && members.every((member) => selectedPersonnel.includes(member.userId));
          const expanded = Boolean(expandedGroups[group.id]);

          return (
            <div key={group.id} className="rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => toggleGroup(group.id)}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {members.length} member{members.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => toggleGroupMembers(group, event.target.checked)}
                    />
                    Select all
                  </label>
                  <i className={`fa ${expanded ? "fa-chevron-up" : "fa-chevron-down"} text-xs`} />
                </div>
              </button>

              {expanded ? (
                <div className="border-t border-slate-200 px-4 py-3">
                  {members.length === 0 ? (
                    <p className="text-xs text-slate-500">No staff in this group yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member) => {
                        const isSelected = selectedPersonnel.includes(member.userId);
                        return (
                          <div
                            key={member.userId}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                              isSelected
                                ? "border-blue-200 bg-blue-50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <label className="flex items-center gap-3 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePersonnel(member.userId)}
                              />
                              <span className="font-semibold text-slate-900">{member.userName}</span>
                            </label>
                            {isReassignMode ? (
                              <button
                                type="button"
                                disabled={reassignLoading}
                                className="inline-flex min-w-[96px] items-center justify-center rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={async () => {
                                  setPendingUserId(member.userId);
                                  try {
                                    await reassignAction([member]);
                                  } finally {
                                    setPendingUserId("");
                                  }
                                }}
                              >
                                {reassignLoading && pendingUserId === member.userId ? (
                                  <span className="inline-flex scale-75">
                                    <DefaultLoader />
                                  </span>
                                ) : (
                                  singleReassignLabel
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">{member.role}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}

        {visibleGroups.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500">
            {personnelLoading ? (
              <div className="flex flex-col items-center gap-3">
                <DefaultLoader />
                <span>Loading grouped staff...</span>
              </div>
            ) : (
              "No groups found."
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
        <p className="text-xs text-slate-500">
          {isReassignMode
            ? "Use the group list to reassign all selected cases to chosen staff only."
            : "Selected cases stay single-owner and are spread across the chosen staff round-robin."}
        </p>
        <button
          type="button"
          className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={selectedMembers.length === 0 || (isReassignMode ? reassignLoading : assignLoading)}
          onClick={async () => {
            setIsSubmitting(true);
            try {
              if (isReassignMode) {
                await reassignAction(selectedMembers);
                return;
              }

              await assignAction(selectedMembers);
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {(isReassignMode ? reassignLoading : assignLoading) && isSubmitting ? (
            <span className="inline-flex scale-75">
              <DefaultLoader />
            </span>
          ) : (
            <i className={`fa ${isReassignMode ? "fa-random" : "fa-share"} text-[11px]`} />
          )}
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
