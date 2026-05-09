import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";

export default function UserList() {
  const {
    customers,
    globalLoader,
    _handleCustomerActiveStatus,
    _hasAccess,
    _routeToPage,
    inputs,
    _handleOnChange,
    setCustomer,
    setIsEdit,
    _loadCustomerDetails,
  } = React.useContext(GlobalContext);
  const canViewCustomer = _hasAccess("action:customer:view");
  const canEditCustomer = _hasAccess("action:customer:update");
  const canToggleCustomer = _hasAccess("action:customer:toggle-active");

  const rows = React.useMemo(
    () =>
      (Array.isArray(customers) ? customers : []).map((customer, index) => ({
        ...customer,
        id: index,
        rawCustomer: customer,
        loanTimes: customer.loan?.loans?.length || 0,
        fullName: `${customer.IDinfo?.firstName || ""} ${customer.IDinfo?.lastName || ""}`.trim(),
        createdAt: new Date(customer.createdAt).toLocaleDateString(),
      })),
    [customers]
  );
  const filteredRows = React.useMemo(() => {
    const normalizedUserId = String(inputs.userId || "").trim().toLowerCase();
    const normalizedPhone = String(inputs.phone || "").trim().toLowerCase();
    const normalizedDate = String(inputs.date || "").trim();

    return rows.filter((row) => {
      const matchesUserId =
        !normalizedUserId ||
        String(row.userId || "").trim().toLowerCase().includes(normalizedUserId);
      const matchesPhone =
        !normalizedPhone ||
        String(row.phone || "").trim().toLowerCase().includes(normalizedPhone);
      const matchesDate =
        !normalizedDate ||
        new Date(row.rawCustomer?.createdAt).toISOString().slice(0, 10) === normalizedDate;

      return matchesUserId && matchesPhone && matchesDate;
    });
  }, [inputs.date, inputs.phone, inputs.userId, rows]);
  const totalCustomers = filteredRows.length;
  const activeCustomers = filteredRows.filter((row) => row.isActive).length;
  const blockedCustomers = totalCustomers - activeCustomers;

  const columns = [
    { key: "userId", label: "User ID", cellClassName: "font-semibold text-slate-900" },
    { key: "level", label: "Level" },
    { key: "loanTimes", label: "Loan Times" },
    { key: "fullName", label: "Full Name" },
    { key: "phone", label: "Phone Number" },
    { key: "createdAt", label: "Registration Date" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <button
          type="button"
          disabled={!canToggleCustomer}
          onClick={(event) => {
            event.stopPropagation();
            _handleCustomerActiveStatus(row.userId);
          }}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            row.isActive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {row.isActive ? "Active" : "Blocked"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) =>
        canViewCustomer ? (
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            onClick={(event) => {
              event.stopPropagation();
              setIsEdit(false);
              _routeToPage("/user-query");
              _loadCustomerDetails(row.rawCustomer, { silent: true });
            }}
          >
            {canEditCustomer ? "Open & Edit" : "Open Details"}
          </button>
        ) : (
          <span className="text-slate-400">No access</span>
        ),
    },
  ];

  const openCustomerDetails = (row) => {
    if (!canViewCustomer) return;
    setCustomer({});
    setIsEdit(false);
    _routeToPage("/user-query");
    _loadCustomerDetails(row.rawCustomer, { silent: true });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Total Customers" value={totalCustomers} />
          <SummaryTile label="Active Customers" value={activeCustomers} tone="success" />
          <SummaryTile label="Blocked Customers" value={blockedCustomers} tone="danger" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            type="text"
            className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="User ID"
            value={inputs.userId}
            onChange={(e) =>
              _handleOnChange({
                field: "userId",
                value: e.target.value,
              })
            }
            aria-label="userId"
          />
          <input
            type="text"
            className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Phone Numbers"
            aria-label="phone"
            value={inputs.phone}
            onChange={(e) =>
              _handleOnChange({
                field: "phone",
                value: e.target.value,
              })
            }
          />
          <input
            type="date"
            className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={inputs.date}
            onChange={(e) =>
              _handleOnChange({
                field: "date",
                value: e.target.value,
              })
            }
            aria-label="date"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                _handleOnChange({ field: "userId", value: "" });
                _handleOnChange({ field: "phone", value: "" });
                _handleOnChange({ field: "date", value: "" });
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Clear
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Customer search updates live while you type.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>
            Showing {filteredRows.length} customer{filteredRows.length === 1 ? "" : "s"}
          </span>
          <span>Click any row to open full customer details</span>
        </div>
        {globalLoader ? <div className="pb-4 text-sm text-slate-500">Loading customers...</div> : null}
        <SimpleDataTable
          columns={columns}
          rows={filteredRows}
          emptyMessage="No customers found."
          rowKey="userId"
          onRowClick={openCustomerDetails}
          dense
        />
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone = "default" }) {
  const toneClassName =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "danger"
      ? "bg-rose-50 text-rose-700"
      : "bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-2xl border border-slate-200 px-4 py-3 ${toneClassName}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
