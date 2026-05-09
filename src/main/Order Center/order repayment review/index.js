import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

const TAB_ITEMS = [
  { id: "public-transfer", label: "Public Transfer" },
  { id: "balance", label: "Balance" },
];

export default function OrderRepaymentReview() {
  const {
    _routeToPage,
    clearanceRecords,
    balClearanceRecords,
    globalLoader,
    setLoan,
    _hasAccess,
  } = React.useContext(GlobalContext);
  const canReviewPayments = _hasAccess("action:payment:review");
  const [activeTab, setActiveTab] = React.useState("public-transfer");

  const [searchParam, setSearchParam] = React.useState({
    userId: "",
    loanId: "",
  });

  const [searchParam2, setSearchParam2] = React.useState({
    userId: "",
    loanId: "",
  });

  const columns = [
    { key: "orderId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "clearAmount", label: "Clearing Amount" },
    { key: "clearanceDate", label: "Clearance Date" },
    { key: "recordedTime", label: "Recorded Time" },
    { key: "auditTime", label: "Audit Time" },
    { key: "loanAmount", label: "Loan Amount" },
  ];

  const columns2 = [
    { key: "orderId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "repaymentAmount", label: "Repayment Amount" },
    { key: "clearanceDate", label: "Clearance Date" },
    { key: "recordedTime", label: "Recorded Time" },
    { key: "auditTime", label: "Audit Time" },
    { key: "loanAmount", label: "Loan Amount" },
  ];

  const rows = React.useMemo(
    () =>
      clearanceRecords === undefined || clearanceRecords.length === 0
        ? []
        : clearanceRecords.map((loan) => ({
            ...loan,
            id: loan.ID,
            orderId: loan.ID,
            clearAmount: loan.clearanceRecord?.amountPaid || "-",
            clearanceDate: loan.clearanceRecord?.clearanceDate
              ? new Date(loan.clearanceRecord.clearanceDate).toLocaleDateString()
              : "-",
            auditTime: loan.dod ? new Date(loan.dod).toLocaleDateString() : "-",
            recordedTime: loan.recordedTime || "-",
            loanAmount: loan.repaymentAmount || "-",
          })),
    [clearanceRecords]
  );

  const rows2 = React.useMemo(
    () =>
      balClearanceRecords === undefined || balClearanceRecords.length === 0
        ? []
        : balClearanceRecords.map((loan) => ({
            ...loan,
            id: loan.ID,
            orderId: loan.ID,
            repaymentAmount: loan.clearanceRecord?.amountPaid || "-",
            clearanceDate: loan.clearanceRecord?.clearanceDate
              ? new Date(loan.clearanceRecord.clearanceDate).toLocaleDateString()
              : "-",
            auditTime: loan.dod ? new Date(loan.dod).toLocaleDateString() : "-",
            recordedTime: loan.recordedTime || "-",
            loanAmount: loan.repaymentAmount || "-",
          })),
    [balClearanceRecords]
  );

  const filteredRows = React.useMemo(() => {
    const normalizedUserId = String(searchParam.userId || "").trim().toLowerCase();
    const normalizedLoanId = String(searchParam.loanId || "").trim().toLowerCase();

    return rows.filter((row) => {
      const matchesUserId =
        !normalizedUserId ||
        String(row.userId || "").trim().toLowerCase().includes(normalizedUserId);
      const matchesLoanId =
        !normalizedLoanId ||
        String(row.orderId || "").trim().toLowerCase().includes(normalizedLoanId);

      return matchesUserId && matchesLoanId;
    });
  }, [rows, searchParam.loanId, searchParam.userId]);

  const filteredRows2 = React.useMemo(() => {
    const normalizedUserId = String(searchParam2.userId || "").trim().toLowerCase();
    const normalizedLoanId = String(searchParam2.loanId || "").trim().toLowerCase();

    return rows2.filter((row) => {
      const matchesUserId =
        !normalizedUserId ||
        String(row.userId || "").trim().toLowerCase().includes(normalizedUserId);
      const matchesLoanId =
        !normalizedLoanId ||
        String(row.orderId || "").trim().toLowerCase().includes(normalizedLoanId);

      return matchesUserId && matchesLoanId;
    });
  }, [rows2, searchParam2.loanId, searchParam2.userId]);

  const handleOpenReview = (row, path) => {
    if (!canReviewPayments) return;
    setLoan(row);
    localStorage.setItem("loan", JSON.stringify(row));
    _routeToPage(path);
  };

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Order Repayment Review</h3>
            <p className="text-sm text-slate-500">
              Review public transfer and balance repayment records
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
          {activeTab === "public-transfer" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <input
                  type="text"
                  className="app-input"
                  placeholder="User ID"
                  aria-label="userId"
                  value={searchParam.userId}
                  onChange={(e) =>
                    setSearchParam({
                      ...searchParam,
                      userId: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  className="app-input"
                  placeholder="Loan ID"
                  aria-label="loanId"
                  value={searchParam.loanId}
                  onChange={(e) =>
                    setSearchParam({
                      ...searchParam,
                      loanId: e.target.value,
                    })
                  }
                />
                <div className="flex flex-wrap gap-3 xl:col-span-2">
                  <button
                    type="button"
                    className="app-btn-secondary gap-2"
                    onClick={() =>
                      setSearchParam({
                        userId: "",
                        loanId: "",
                      })
                    }
                  >
                    <i className="fa fa-undo text-sm" />
                    Clear
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-500">Repayment review search updates live while you type.</p>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Click any repayment row to open the payment review page.
              </div>

              {globalLoader ? (
                <div className="text-sm text-slate-500">Loading public transfer records...</div>
              ) : null}

              <SimpleDataTable
                columns={columns}
                rows={filteredRows}
                rowKey="id"
                dense
                emptyMessage="No public transfer records found."
                onRowClick={(row) =>
                  handleOpenReview(row, "/order-repayment-review/public-transfare/")
                }
              />
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <input
                  type="text"
                  className="app-input"
                  placeholder="User ID"
                  aria-label="userId"
                  value={searchParam2.userId}
                  onChange={(e) =>
                    setSearchParam2({
                      ...searchParam2,
                      userId: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  className="app-input"
                  placeholder="Loan ID"
                  aria-label="loanId"
                  value={searchParam2.loanId}
                  onChange={(e) =>
                    setSearchParam2({
                      ...searchParam2,
                      loanId: e.target.value,
                    })
                  }
                />
                <div className="flex flex-wrap gap-3 xl:col-span-2">
                  <button
                    type="button"
                    className="app-btn-secondary gap-2"
                    onClick={() =>
                      setSearchParam2({
                        userId: "",
                        loanId: "",
                      })
                    }
                  >
                    <i className="fa fa-undo text-sm" />
                    Clear
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-500">Balance review search updates live while you type.</p>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Click any balance row to open the repayment review screen.
              </div>

              {globalLoader ? (
                <div className="text-sm text-slate-500">Loading balance records...</div>
              ) : null}

              <SimpleDataTable
                columns={columns2}
                rows={filteredRows2}
                rowKey="id"
                dense
                emptyMessage="No balance repayment records found."
                onRowClick={(row) =>
                  handleOpenReview(row, "/order-repayment-review/balance")
                }
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
