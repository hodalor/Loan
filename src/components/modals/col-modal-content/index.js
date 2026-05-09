import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import SimpleDataTable from "../../tables/SimpleDataTable";
import DefaultLoader from "../../loaders/defaultLoader";

export default function ColModalContent(props) {
  const {
    admins,
    personnelLoading,
    isActionLoading,
    _handleColAssignCase,
    _handleReAssignColCase,
  } = React.useContext(GlobalContext);
  const assignLoading = isActionLoading("collection-assign");
  const reassignLoading = isActionLoading("collection-reassign");
  const [searchField, setSearchField] = React.useState("");
  const [selectedPersonnel, setSelectedPersonnel] = React.useState([]);
  const [pendingUserId, setPendingUserId] = React.useState("");
  const [isSubmittingAssign, setIsSubmittingAssign] = React.useState(false);
  const isReassignMode = props.title === "re-assign";

  const rows = React.useMemo(
    () =>
      admins
        .filter((item) => item.role === "col-team-lead" || item.role === "col-personel")
        .map((col) => {
          const assigned =
            col.casesAssigned === undefined || col.casesAssigned.length === 0
              ? []
              : col.casesAssigned.filter((item) => item.isProcessed !== true);
          const processed =
            col.casesAssigned === undefined || col.casesAssigned.length === 0
              ? []
              : col.casesAssigned.filter((item) => item.isProcessed === true);
          const recentProcessed =
            processed.length === 0
              ? []
              : processed.filter((loan) => {
                  const loanDate = new Date(loan.updatedAt);
                  const tda = new Date();
                  const timeDiff = tda.getTime() - loanDate.getTime();
                  const diff = Math.floor(timeDiff / 1000 / 60 / 60);
                  return diff < 12;
                });

          return {
            ...col,
            id: col.userId,
            processedCases: recentProcessed.length,
            assignedCases: assigned.length,
            personel: col.userName,
          };
        }),
    [admins]
  );

  const filteredRows = React.useMemo(() => {
    const normalizedSearch = String(searchField || "").trim().toLowerCase();

    return rows.filter((row) => {
      if (!normalizedSearch) return true;

      return (
        String(row.personel || "").toLowerCase().includes(normalizedSearch) ||
        String(row.role || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [rows, searchField]);

  const togglePersonnel = (userId) => {
    setSelectedPersonnel((current) =>
      current.includes(userId)
        ? current.filter((item) => item !== userId)
        : [...current, userId]
    );
  };

  const columns = [
    !isReassignMode
      ? {
          key: "select",
          label: "",
          render: (row) => (
            <input
              type="checkbox"
              checked={selectedPersonnel.includes(row.userId)}
              onClick={(event) => event.stopPropagation()}
              onChange={() => togglePersonnel(row.userId)}
            />
          ),
        }
      : null,
    { key: "personel", label: "Personnel", cellClassName: "font-semibold text-slate-900" },
    { key: "assignedCases", label: "Assigned" },
    { key: "processedCases", label: "Processed" },
    isReassignMode
      ? {
          key: "action",
          label: "",
          render: (row) => (
            <button
              type="button"
              disabled={reassignLoading}
              className="inline-flex min-w-[86px] items-center justify-center rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              onClick={async (event) => {
                event.stopPropagation();
                setPendingUserId(row.userId);
                try {
                  await _handleReAssignColCase(row);
                } finally {
                  setPendingUserId("");
                }
              }}
            >
              {reassignLoading && pendingUserId === row.userId ? (
                <span className="inline-flex scale-75">
                  <DefaultLoader />
                </span>
              ) : (
                "Reassign"
              )}
            </button>
          ),
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="flex w-full max-w-[680px] flex-col p-3 sm:p-3.5">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-900">Select Personnel</h3>
        <p className="mt-1 text-xs text-slate-500">
          {isReassignMode
            ? "Choose one staff member to receive the selected cases."
            : "Pick one or more staff members for round-robin assignment."}
        </p>
      </div>

      <div className="mb-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <input
          type="text"
          className="app-input !min-h-[40px] !py-2 text-sm"
          placeholder="Search personnel"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          aria-label="userName"
        />
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={() => setSearchField("")}
        >
          <i className="fa fa-undo text-[11px]" /> Clear
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span>{filteredRows.length} personnel</span>
        <span>{isReassignMode ? "Single destination" : `${selectedPersonnel.length} selected`}</span>
      </div>

      {personnelLoading ? (
        <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <DefaultLoader />
            <span>Loading collection personnel...</span>
          </div>
        </div>
      ) : null}

      <div className="max-h-[68vh] overflow-auto">
        <SimpleDataTable
          columns={columns}
          rows={filteredRows}
          rowKey="id"
          dense
          pagination={false}
          loading={personnelLoading}
          loadingMessage="Loading collection personnel..."
          emptyMessage="No collection personnel found."
          onRowClick={
            isReassignMode
              ? undefined
              : (row) => togglePersonnel(row.userId)
          }
        />
      </div>

      {!isReassignMode ? (
        <div className="mt-2 flex items-center justify-end border-t border-slate-200 pt-2">
          <button
            type="button"
            className="inline-flex min-w-[128px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={selectedPersonnel.length === 0 || assignLoading}
            onClick={async () => {
              setIsSubmittingAssign(true);
              try {
                await _handleColAssignCase(
                  filteredRows.filter((row) => selectedPersonnel.includes(row.userId))
                );
              } finally {
                setIsSubmittingAssign(false);
              }
            }}
          >
            {assignLoading && isSubmittingAssign ? (
              <span className="inline-flex scale-75">
                <DefaultLoader />
              </span>
            ) : (
              <i className="fa fa-share text-[11px]" />
            )}
            Assign Selected
          </button>
        </div>
      ) : null}
    </div>
  );
}
