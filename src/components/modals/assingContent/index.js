import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import DefaultLoader from "../../loaders/defaultLoader";

export default function AssignModalContent(props) {
  const {
    admins,
    personnelLoading,
    isActionLoading,
    _handleAssignCase,
    _handleReAssignCase,
    _hasAccess,
  } = React.useContext(GlobalContext);
  const canAssignCases = _hasAccess("action:credit:assign");
  const canReassignCases = _hasAccess("action:credit:reassign");
  const assignLoading = isActionLoading("credit-assign");
  const reassignLoading = isActionLoading("credit-reassign");

  let reviewPersonel = admins.filter(
    (item) => item.role === "rv-team-lead" || item.role === "rev-personel"
  );

  const [searchField, setSearchField] = React.useState("");
  const [selectedPersonel, setSelectedPersonel] = React.useState([]);
  const [isSubmittingAssign, setIsSubmittingAssign] = React.useState(false);

  const isReassignMode = props.title && props.title === "re-assign";

  const rows = reviewPersonel.map((review) => {
    let assigned =
      review.casesAssigned === undefined || review.casesAssigned.length === 0
        ? []
        : review.casesAssigned.filter((item) => item.isProcessed !== true);

    let processed =
      review.casesAssigned === undefined || review.casesAssigned.length === 0
        ? []
        : review.casesAssigned.filter((item) => item.isProcessed === true);

    let dataToShow =
      processed.length === 0
        ? []
        : processed.filter((loan) => {
            let loanDate = new Date(loan.updatedAt);
            let tda = new Date();

            let timeDiff = tda.getTime() - loanDate.getTime();

            let diff = Math.floor(timeDiff / 1000 / 60 / 60);

            return diff < 12;
          });

    return {
      ...review,
      id: review.userId,
      processedCases: dataToShow.length,
      assignedCases: assigned.length,
      personel: review.userName,
    };
  });

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
    setSelectedPersonel((current) =>
      current.includes(userId)
        ? current.filter((item) => item !== userId)
        : [...current, userId]
    );
  };

  return (
    <div className="flex w-full max-w-[680px] flex-col p-3 sm:p-3.5">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-900">Select Personnel</h3>
        <p className="mt-1 text-xs text-slate-500">
          {isReassignMode
            ? "Choose the staff member who should receive the selected cases."
            : "Select one or more staff members for round-robin assignment."}
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
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          onClick={() => setSearchField("")}
        >
          <i className="fa fa-undo text-[11px]" />
          Clear
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span>
          {filteredRows.length} staff member{filteredRows.length === 1 ? "" : "s"} found
        </span>
        <span>
          {selectedPersonel.length > 0
            ? `${selectedPersonel.length} selected`
            : isReassignMode
            ? "Pick one or more destinations"
            : "Select one or more staff"}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="max-h-[68vh] overflow-auto">
          <table className="min-w-full table-fixed">
            <thead className="sticky top-0 bg-slate-100">
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <th className="w-14 px-3 py-2.5">Pick</th>
                <th className="px-3 py-2.5">Personnel</th>
                <th className="px-3 py-2.5">Assigned</th>
                <th className="px-3 py-2.5">Processed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredRows.map((row) => {
                const isSelected = selectedPersonel.includes(row.userId);

                return (
                  <tr
                    key={row.userId}
                    className={`align-top cursor-pointer hover:bg-slate-50 ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                    onClick={() => togglePersonnel(row.userId)}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          if (event.target.checked) {
                            togglePersonnel(row.userId);
                            return;
                          }

                          setSelectedPersonel((current) => current.filter((item) => item !== row.userId));
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{row.personel}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{row.role}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm font-semibold text-slate-700">
                      {row.assignedCases}
                    </td>
                    <td className="px-3 py-2 text-sm font-semibold text-slate-700">
                      {row.processedCases}
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    {personnelLoading ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <DefaultLoader />
                        <span>Loading personnel...</span>
                      </div>
                    ) : (
                      "No personnel found."
                    )}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {isReassignMode && canReassignCases ? (
        <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 sm:max-w-[60%]">
            Select one or more review staff to redistribute the chosen cases round-robin.
          </p>
          <button
            type="button"
            className="self-end inline-flex min-w-[128px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={selectedPersonel.length === 0 || reassignLoading}
            onClick={async () => {
              setIsSubmittingAssign(true);
              try {
                await _handleReAssignCase(
                  filteredRows.filter((item) => selectedPersonel.includes(item.userId))
                );
              } finally {
                setIsSubmittingAssign(false);
              }
            }}
          >
            {reassignLoading && isSubmittingAssign ? (
              <span className="inline-flex scale-75">
                <DefaultLoader />
              </span>
            ) : (
              <i className="fa fa-random text-[11px]" />
            )}
            Reassign Selected
          </button>
        </div>
      ) : null}

      {!isReassignMode && canAssignCases ? (
        <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 sm:max-w-[60%]">
            Select one or more review staff to distribute the chosen cases round-robin.
          </p>
          <button
            type="button"
            className="self-end inline-flex min-w-[128px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={selectedPersonel.length === 0 || assignLoading}
            onClick={async () => {
              setIsSubmittingAssign(true);
              try {
                await _handleAssignCase(
                  filteredRows.filter((item) => selectedPersonel.includes(item.userId))
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
