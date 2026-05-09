import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

export default function ManualPaymentPool() {
  const {
    clearedCases,
    customers,
    globalLoader,
    _handleOnChange,
    inputs,
    dateRange,
    setRange,
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

  const _calcPen = (loan) => {
    let dp = new Date(loan.dp);
    let dop = new Date(loan.dop);

    let timeDiff = dp.getTime() - dop.getTime();

    let diffDate = timeDiff / (1000 * 3600 * 24);

    let dur = parseInt(diffDate);

    let pen = (2 / 100) * parseInt(loan.amount) * dur;

    return pen;
  };

  const rows = React.useMemo(
    () =>
      clearedCases === undefined || clearedCases.length === 0
        ? []
        : clearedCases.map((loan) => {
            let customer =
              customers === undefined || customers.length === 0
                ? {}
                : customers.find((person) => person.userId === loan.userId) || {};

            return {
              ...loan,
              id: loan.ID,
              orderId: loan.ID,
              phone: customer?.phone || "-",
              userName: customer?.IDinfo
                ? `${customer.IDinfo.firstName || ""} ${customer.IDinfo.middleName || ""} ${customer.IDinfo.lastName || ""}`
                    .replace(/\s+/g, " ")
                    .trim()
                : "-",
              clearedBy: loan.clearanceRecord?.confirmedBy || "-",
              paymentAmount: parseInt(loan.repaymentAmount, 10) + _calcPen(loan),
              staff: loan.clearanceRecord?.reviewedBy || "-",
              clearedDate: loan.clearanceRecord?.clearanceDate
                ? new Date(loan.clearanceRecord.clearanceDate).toLocaleDateString()
                : "-",
            };
          }),
    [clearedCases, customers]
  );

  const columns = [
    { key: "orderId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    { key: "userName", label: "User Name" },
    { key: "phone", label: "Phone Number" },
    { key: "clearedDate", label: "Date Cleared" },
    { key: "paymentAmount", label: "Repayment Amount" },
    { key: "amountPaid", label: "Amount Paid" },
    { key: "clearedBy", label: "Cleared By" },
    { key: "staff", label: "Staff" },
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
        String(row.orderId || "").trim().toLowerCase().includes(normalizedLoanId);
      const matchesPhone =
        !normalizedPhone ||
        String(row.phone || "").trim().toLowerCase().includes(normalizedPhone);

      return matchesUserId && matchesLoanId && matchesPhone && isWithinDateRange(row.dp);
    });
  }, [inputs.loanId, inputs.phone, inputs.userId, isWithinDateRange, rows]);

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Manual Payment Pool</h3>
            <p className="text-sm text-slate-500">Review manually cleared repayment cases</p>
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
              value={inputs.loanId}
              onChange={(e) =>
                _handleOnChange({
                  field: "loanId",
                  value: e.target.value,
                })
              }
              placeholder="Order ID"
              aria-label="loanId"
            />
            <input
              type="text"
              className="app-input"
              placeholder="Phone Number"
              value={inputs.phone}
              onChange={(e) =>
                _handleOnChange({
                  field: "phone",
                  value: e.target.value,
                })
              }
              aria-label="phone"
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

          <p className="text-sm text-slate-500">Manual payment filters update live while you type.</p>

          {globalLoader ? <div className="text-sm text-slate-500">Loading manual payments...</div> : null}

          <SimpleDataTable
            columns={columns}
            rows={filteredRows}
            rowKey="id"
            dense
            emptyMessage="No manual payment records found."
          />
        </div>
      </section>
    </div>
  );
}
