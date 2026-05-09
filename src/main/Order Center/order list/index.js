import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

export default function OrderList() {
  const {
    customers,
    globalLoader,
    loans,
    _handleOrderlistDetails,
    inputs,
    dateRange,
    setRange,
    _handleOnChange,
  } = React.useContext(GlobalContext);

  const isWithinDateRange = React.useCallback((value) => {
    if (!dateRange || !Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) {
      return true;
    }

    const targetDate = new Date(value);
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);

    if (
      Number.isNaN(targetDate.getTime()) ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return true;
    }

    targetDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return targetDate >= startDate && targetDate <= endDate;
  }, [dateRange]);

  const rows = React.useMemo(
    () =>
      !Array.isArray(loans) || loans.length === 0
        ? []
        : loans.map((loan, index) => {
            const customer =
              !Array.isArray(customers) || customers.length === 0
                ? {}
                : customers.find((person) => person.userId === loan.userId);

            return {
              ...loan,
              id: loan._id || loan.ID || index + 1,
              loanId: loan.ID,
              phone: customer?.phone || "",
              createdAt: customer?.createdAt
                ? new Date(customer.createdAt).toLocaleDateString()
                : "",
              name: customer?.IDinfo
                ? `${customer.IDinfo.firstName} ${customer.IDinfo.middleName} ${customer.IDinfo.lastName}`
                : "",
              ghCard: customer?.IDinfo?.gCardNumber || "",
            };
          }),
    [customers, loans]
  );

  const columns = [
    { key: "loanId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "name", label: "User Name" },
    { key: "phone", label: "Phone Number" },
    { key: "createdAt", label: "Registration Date" },
    { key: "ghCard", label: "ID Number" },
    {
      key: "loanStatus",
      label: "Loan Status",
      render: (row) => (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {row.loanStatus || "-"}
        </span>
      ),
    },
    { key: "amount", label: "Loan Amount" },
    { key: "repaymentAmount", label: "Repayment Amount" },
  ];

  const filteredRows = React.useMemo(() => {
    const normalizedUserId = String(inputs.userId || "").trim().toLowerCase();
    const normalizedLoanId = String(inputs.loanId || "").trim().toLowerCase();
    const normalizedPhone = String(inputs.phone || "").trim().toLowerCase();

    return rows.filter((row) => {
      const matchesUserId =
        !normalizedUserId ||
        String(row.userId || "").trim().toLowerCase().includes(normalizedUserId);
      const matchesLoanId =
        !normalizedLoanId ||
        String(row.loanId || "").trim().toLowerCase().includes(normalizedLoanId);
      const matchesPhone =
        !normalizedPhone ||
        String(row.phone || "").trim().toLowerCase().includes(normalizedPhone);

      return (
        matchesUserId &&
        matchesLoanId &&
        matchesPhone &&
        isWithinDateRange(row.createdAt ? new Date(row.createdAt) : row.doa)
      );
    });
  }, [inputs.loanId, inputs.phone, inputs.userId, isWithinDateRange, rows]);

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Order List</h3>
            <p className="text-sm text-slate-500">Track customer loan orders</p>
          </div>
          <div className="app-chip">{filteredRows.length} records</div>
        </div>
        <div className="app-panel-body space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="text"
              className="app-input"
              placeholder="User ID"
              aria-label="userid"
              value={inputs.userId}
              onChange={(e) =>
                _handleOnChange({
                  field: "userId",
                  value: e.target.value,
                })
              }
            />
            <input
              type="text"
              className="app-input"
              placeholder="Order ID"
              aria-label="loanId"
              value={inputs.loanId}
              onChange={(e) =>
                _handleOnChange({
                  field: "loanId",
                  value: e.target.value,
                })
              }
            />
            <input
              type="text"
              className="app-input"
              placeholder="Phone Number"
              aria-label="phone"
              value={inputs.phone}
              onChange={(e) =>
                _handleOnChange({
                  field: "phone",
                  value: e.target.value,
                })
              }
            />
            <CustomDateRangeInputs />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="app-btn-secondary gap-2"
              onClick={() => {
                _handleOnChange({ field: "userId", value: "" });
                _handleOnChange({ field: "loanId", value: "" });
                _handleOnChange({ field: "phone", value: "" });
                setRange(null);
              }}
            >
              <i className="fa fa-undo text-sm" />
              Clear
            </button>
          </div>

          <p className="text-sm text-slate-500">Order filters update live while you type.</p>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Click any order row to open the full loan details.
          </div>

          {globalLoader ? <div className="text-sm text-slate-500">Loading orders...</div> : null}

          <SimpleDataTable
            columns={columns}
            rows={filteredRows}
            rowKey="id"
            dense
            emptyMessage="No orders found."
            onRowClick={(row) => _handleOrderlistDetails(row)}
          />
        </div>
      </section>
    </div>
  );
}
