import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import BasicSelect from "../../../components/inputs/select";
import CustomDateRangeInputs from "../../../components/inputs/dateRangeSelector";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";
import { getGroupOptionsByDepartment } from "../../../libs/staffGroups";

export default function PrePaymentRecords() {
  const {
    setLoan,
    _routeToPage,
    prePayment,
    globalLoader,
    customers,
    admins,
    staffGroups,
    inputs,
    select,
    dateRange,
    setRange,
    setSelect,
    _handleOnChange,
  } = React.useContext(GlobalContext);

  const preOff = React.useMemo(
    () =>
      admins.filter(
        (admin) => admin.role === "pre-personel" || admin.role === "pre-team-lead"
      ),
    [admins]
  );
  const groupOptions = React.useMemo(
    () => getGroupOptionsByDepartment(staffGroups, "pre-collection"),
    [staffGroups]
  );

  const _calcTotalAmount = (data) => {
    let amount = 0;

    data.forEach((loan) => {
      amount =
        loan.amountPaid === undefined || loan.amountPaid === ""
          ? 0
          : (amount += parseFloat(loan.amountPaid));
    });

    return amount;
  };

  const columns = [
    { key: "orderId", label: "Order ID", cellClassName: "font-semibold text-slate-900" },
    { key: "userId", label: "User ID" },
    {
      key: "phone",
      label: "Phone Number",
    },
    {
      key: "repAmount",
      label: "Repayment Amount",
    },
    {
      key: "amountPaid",
      label: "Amount Paid",
    },
    {
      key: "amountLeft",
      label: "Amount Left",
    },
    {
      key: "preCollOfficer",
      label: "Advance Employee",
    },
  ];

  const _calcRep = (loan) => {
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
      prePayment === undefined || prePayment.length === 0
        ? []
        : prePayment.map((loan) => {
            let customer =
              customers === undefined || customers.length === 0
                ? {}
                : customers.find((person) => person.userId === loan.userId);

            let callRecord =
              loan.preCollCallRecords === undefined ||
              loan.preCollCallRecords.length === 0
                ? {}
                : loan.preCollCallRecords.slice(-1)[0];

            return {
              ...loan,
              id: loan.ID,
              orderId: loan.ID,
              phone: customer === undefined ? "" : customer.phone,
              repAmount: parseFloat(loan.repaymentAmount) + _calcRep(loan),
              amountLeft:
                parseFloat(loan.repaymentAmount) +
                _calcRep(loan) -
                parseFloat(loan.amountPaid),
              preCollOfficer: callRecord.preCollOfficer,
            };
          }),
    [customers, prePayment]
  );

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

  const filteredRows = React.useMemo(() => {
    const normalizedUserId = String(inputs.userId || "").trim().toLowerCase();
    const normalizedLoanId = String(inputs.loanId || "").trim().toLowerCase();
    const normalizedPhone = String(inputs.phone || "").trim().toLowerCase();
    const normalizedAdvanceStaff = String(select.advanceStaff || "")
      .trim()
      .toLowerCase();
    const normalizedAdvanceGroup = String(select.advanceGroup || "").trim();

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
      const matchesAdvanceStaff =
        !normalizedAdvanceStaff ||
        String(row.preCollOfficer || "")
          .trim()
          .toLowerCase()
          .includes(normalizedAdvanceStaff);
      const matchedAdmin = admins.find(
        (admin) => String(admin.userName || "") === String(row.preCollOfficer || "")
      );
      const matchesAdvanceGroup =
        !normalizedAdvanceGroup ||
        String(matchedAdmin?.staffGroupId || "") === normalizedAdvanceGroup;

      return (
        matchesUserId &&
        matchesLoanId &&
        matchesPhone &&
        matchesAdvanceStaff &&
        matchesAdvanceGroup &&
        isWithinDateRange(row.dp)
      );
    });
  }, [
    inputs.loanId,
    inputs.phone,
    inputs.userId,
    isWithinDateRange,
    rows,
    admins,
    select.advanceGroup,
    select.advanceStaff,
  ]);

  const handleExport = () => {
    if (!filteredRows.length) return;

    const header = columns.map((column) => column.label).join(",");
    const csvRows = filteredRows.map((row) =>
      [
        row.orderId,
        row.userId,
        row.phone,
        row.repAmount,
        row.amountPaid,
        row.amountLeft,
        row.preCollOfficer || "",
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([[header, ...csvRows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pre-payment-records.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Precollection Payment Records</h3>
            <p className="text-sm text-slate-500">
              Review collected repayment records and open loan details directly from the table.
            </p>
          </div>
        </div>
        <div className="app-panel-body space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
            <BasicSelect data={preOff} title="Advance Staff" />
            <BasicSelect
              data={groupOptions}
              title="Advance Group"
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
                  setSelect((current) => ({
                    ...current,
                    advanceStaff: "",
                    advanceGroup: "",
                  }));
                }}
              >
                <i className="fa fa-undo text-sm" /> Clear
              </button>
              <button
                type="button"
                className="app-btn-secondary gap-2"
                disabled={!filteredRows.length}
                onClick={handleExport}
              >
                <i className="fa fa-download text-sm" /> Export CSV
              </button>
          </div>
          <p className="text-sm text-slate-500">
            Precollection payment filters update live while you type or change the staff/date filter.
          </p>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span>Total amount collected:</span>
            <span className="ml-2 font-semibold text-slate-900">
              GHC{filteredRows.length === 0 ? 0 : _calcTotalAmount(filteredRows)}
            </span>
          </div>
          {globalLoader ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Loading payment records...
            </div>
          ) : null}
          <div className="w-full">
            <SimpleDataTable
              columns={columns}
              rows={filteredRows}
              rowKey="id"
              dense
              onRowClick={(row) => {
                localStorage.setItem("loan", JSON.stringify(row));
                setLoan(row);
                _routeToPage("/pre-loan-details");
              }}
              emptyMessage="No payment records found."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
