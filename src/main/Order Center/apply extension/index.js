import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import { AuthContext } from "../../../libs/context/authContext";
import { _getSystemConfig } from "../../../handlers";
import { dataBaseUrl } from "../../../libs/endpoints";
import { resolveMediaUrl } from "../../../libs/mediaUrl";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

const normalizeStatus = (record = {}) =>
  String(
    record?.requestStatus ||
      record?.extStatus ||
      record?.status ||
      record?.approvalStatus ||
      "Approved"
  ).trim();

const normalizeSource = (record = {}) => {
  const rawSource = String(record?.source || "").trim().toLowerCase();

  if (rawSource === "manual" || rawSource === "admin") return "manual";
  if (rawSource === "self" || rawSource === "customer") return "self";

  const requestedBy = String(record?.requestedBy || "").trim().toLowerCase();
  if (requestedBy === "admin") return "manual";
  if (requestedBy === "customer") return "self";

  return "self";
};

const TAB_ITEMS = [
  { id: "extended", label: "Extended" },
  { id: "extend", label: "Extend" },
  { id: "approvals", label: "Approvals" },
];

const startOfDay = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getDayDifference = (futureDateValue) => {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(futureDateValue);
  if (!today || !targetDate) return null;
  return Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export default function ApplyExtension() {
  const { loans, globalLoader, _refreshAllData, _hasAccess } = React.useContext(GlobalContext);
  const { user } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = React.useState("extended");
  const [extensionOptions, setExtensionOptions] = React.useState([]);
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [searchDraft, setSearchDraft] = React.useState({
    userId: "",
    loanId: "",
    extensionKey: "",
    proof: null,
  });
  const [matchedLoan, setMatchedLoan] = React.useState(null);
  const [pageLoading, setPageLoading] = React.useState(false);

  const canApproveExtensions = _hasAccess("action:payment:review");

  React.useEffect(() => {
    const loadConfig = async () => {
      const response = await _getSystemConfig();
      if (response.success === 1) {
        setExtensionOptions(
          (response.data?.extensionPeriods || []).filter((item) => item?.isEnabled !== false)
        );
      }
    };

    loadConfig();
  }, []);

  const extensionRows = React.useMemo(
    () =>
      (Array.isArray(loans) ? loans : []).flatMap((loan) =>
        Array.isArray(loan.extRecords)
          ? loan.extRecords.map((rec, index) => ({
              ...rec,
              id: `${loan.ID || loan._id || "loan"}-${rec._id || index}`,
              recordId: rec._id,
              orderId: rec.loanId || loan.ID || "-",
              userId: loan.userId,
              exAppDate: rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : "-",
              repaymentDate: rec.extExpDate ? new Date(rec.extExpDate).toLocaleDateString() : "-",
              fee: rec.extHandlingFee || "-",
              source: normalizeSource(rec),
              approvalStatus: normalizeStatus(rec),
              requestedBy:
                rec.requestedBy || (normalizeSource(rec) === "manual" ? "Admin" : "Customer"),
              approvedBy:
                rec.approvedBy || (normalizeSource(rec) === "manual" ? "-" : "System"),
              proofUrl: resolveMediaUrl(rec.proofUrl || ""),
            }))
          : []
      ).sort((left, right) => {
        const leftTime = new Date(left.createdAt || left.exAppDate || 0).getTime();
        const rightTime = new Date(right.createdAt || right.exAppDate || 0).getTime();
        return rightTime - leftTime;
      }),
    [loans]
  );

  const extendedRows = extensionRows.filter((row) => {
    const matchesSource = sourceFilter === "all" ? true : row.source === sourceFilter;
    return matchesSource;
  });

  const approvalRows = extensionRows.filter(
    (row) => row.source === "manual" && (row.approvalStatus || "").toLowerCase() === "pending"
  );

  const findLoanEligibility = React.useCallback(
    (loan) => {
      const daysRemaining = loan?.dop ? getDayDifference(loan.dop) : null;
      const isEligible =
        loan?.loanStatus === "Granted" &&
        loan?.paymentStatus !== "Paid" &&
        loan?.isDisbursed === true &&
        daysRemaining !== null &&
        daysRemaining >= 0;

      return {
        daysRemaining,
        isEligible,
        isOverdue: daysRemaining !== null && daysRemaining < 0,
      };
    },
    []
  );

  const handleSearchLoan = () => {
    const loan = (Array.isArray(loans) ? loans : []).find(
      (item) =>
        String(item.ID || "").trim() === searchDraft.loanId.trim() &&
        String(item.userId || "").trim() === searchDraft.userId.trim()
    );
    setMatchedLoan(loan || null);
  };

  const handleSubmitRequest = async () => {
    if (!matchedLoan || !searchDraft.extensionKey || !(searchDraft.proof instanceof File)) {
      return;
    }

    setPageLoading(true);
    const formData = new FormData();
    formData.append("proof", searchDraft.proof);
    formData.append(
      "data",
      JSON.stringify({
        userId: matchedLoan.userId,
        loanId: matchedLoan.ID,
        extensionKey: searchDraft.extensionKey,
        requestedBy: user?.userName || "Admin",
      })
    );

    const response = await fetch(`${dataBaseUrl}admin-extension/request`, {
      method: "POST",
      body: formData,
    }).then((res) => res.json());

    if (response.success === 1) {
      await _refreshAllData();
      setSearchDraft({
        userId: "",
        loanId: "",
        extensionKey: "",
        proof: null,
      });
      setMatchedLoan(null);
      setActiveTab("approvals");
    } else {
      window.alert(response.message);
    }
    setPageLoading(false);
  };

  const handleApproveRequest = async (row) => {
    setPageLoading(true);
    const response = await fetch(
      `${dataBaseUrl}admin-extension/approve/${row.orderId}/${row.recordId}`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approvedBy: user?.userName || "Admin",
        }),
      }
    ).then((res) => res.json());

    if (response.success === 1) {
      await _refreshAllData();
    } else {
      window.alert(response.message);
    }
    setPageLoading(false);
  };

  const eligibility = matchedLoan ? findLoanEligibility(matchedLoan) : null;
  const selectedExtension = extensionOptions.find((item) => item.key === searchDraft.extensionKey);

  const extendedColumns = [
    { key: "orderId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "exAppDate", label: "Applied Date" },
    { key: "repaymentDate", label: "Extended Due Date" },
    { key: "fee", label: "Fee" },
    { key: "source", label: "Source" },
    { key: "approvalStatus", label: "Status" },
  ];

  const approvalColumns = [
    { key: "orderId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "requestedBy", label: "Requested By" },
    { key: "exAppDate", label: "Requested Date" },
    { key: "repaymentDate", label: "New Due Date" },
    { key: "fee", label: "Fee" },
    {
      key: "proof",
      label: "POP",
      render: (row) =>
        row.proofUrl ? (
          <a
            href={row.proofUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-blue-600"
            onClick={(event) => event.stopPropagation()}
          >
            View POP
          </a>
        ) : (
          <span className="text-slate-400">No POP</span>
        ),
    },
    {
      key: "actions",
      label: "Action",
      render: (row) => (
        <button
          type="button"
          className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canApproveExtensions || pageLoading}
          onClick={(event) => {
            event.stopPropagation();
            handleApproveRequest(row);
          }}
        >
          Approve
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Apply Extension</h3>
            <p className="text-sm text-slate-500">
              Track completed extensions, create manual extension requests, and approve them.
            </p>
          </div>
        </div>

        <div className="border-b border-slate-200 px-6">
          <div className="flex flex-wrap gap-6 overflow-x-auto">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-0 py-4 text-lg font-semibold transition ${
                  activeTab === tab.id
                    ? "border-blue-600 text-slate-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="app-panel-body space-y-5">
          {activeTab === "extended" ? (
            <>
              <div className="flex flex-wrap gap-3">
                {["all", "self", "manual"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSourceFilter(item)}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                      sourceFilter === item
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {item === "all" ? "All" : item === "self" ? "Self Extension" : "Manual"}
                  </button>
                ))}
              </div>
              {globalLoader ? <div className="text-sm text-slate-500">Loading extension records...</div> : null}
              <SimpleDataTable
                columns={extendedColumns}
                rows={extendedRows}
                rowKey="id"
                dense
                emptyMessage="No extension records found."
              />
            </>
          ) : null}

          {activeTab === "extend" ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <input
                  type="text"
                  className="app-input"
                  placeholder="User ID"
                  value={searchDraft.userId}
                  onChange={(event) =>
                    setSearchDraft((current) => ({ ...current, userId: event.target.value }))
                  }
                />
                <input
                  type="text"
                  className="app-input"
                  placeholder="Loan ID"
                  value={searchDraft.loanId}
                  onChange={(event) =>
                    setSearchDraft((current) => ({ ...current, loanId: event.target.value }))
                  }
                />
                <div className="flex flex-wrap gap-3 xl:col-span-2">
                  <button type="button" className="app-btn-primary gap-2" onClick={handleSearchLoan}>
                    <i className="fa fa-search text-sm" />
                    Search
                  </button>
                </div>
              </div>

              {matchedLoan ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Summary label="Loan ID" value={matchedLoan.ID} />
                    <Summary label="User ID" value={matchedLoan.userId} />
                    <Summary label="Due Date" value={matchedLoan.dop ? new Date(matchedLoan.dop).toLocaleDateString() : "-"} />
                    <Summary
                      label="Status"
                      value={
                        eligibility?.isOverdue
                          ? "Overdue"
                          : eligibility?.isEligible
                          ? "Eligible"
                          : "Not eligible"
                      }
                    />
                  </div>
                  {eligibility?.isOverdue ? (
                    <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      This loan is already overdue. Extension selection and submit are disabled.
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="field">
                  <span>Extension Days</span>
                  <select
                    value={searchDraft.extensionKey}
                    disabled={!matchedLoan || !eligibility?.isEligible || pageLoading}
                    onChange={(event) =>
                      setSearchDraft((current) => ({
                        ...current,
                        extensionKey: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select extension</option>
                    {extensionOptions.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Upload POP</span>
                  <input
                    type="file"
                    className="app-input"
                    accept="image/*"
                    disabled={!matchedLoan || !eligibility?.isEligible || pageLoading}
                    onChange={(event) =>
                      setSearchDraft((current) => ({
                        ...current,
                        proof: event.target.files?.[0] || null,
                      }))
                    }
                  />
                </label>
              </div>

              {selectedExtension ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Selected extension: {selectedExtension.label} with {selectedExtension.feeRate}% fee.
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="app-btn-primary gap-2"
                  disabled={
                    !matchedLoan ||
                    !eligibility?.isEligible ||
                    !searchDraft.extensionKey ||
                    !(searchDraft.proof instanceof File) ||
                    pageLoading
                  }
                  onClick={handleSubmitRequest}
                >
                  <i className="fa fa-paper-plane text-sm" />
                  Submit Extension
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === "approvals" ? (
            <>
              {globalLoader ? <div className="text-sm text-slate-500">Loading extension approvals...</div> : null}
              <SimpleDataTable
                columns={approvalColumns}
                rows={approvalRows}
                rowKey="id"
                dense
                emptyMessage="No extension approvals are waiting."
              />
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
