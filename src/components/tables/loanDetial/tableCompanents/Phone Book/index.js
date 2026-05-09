import React from "react";
import { GlobalContext } from "../../../../../libs/context/globalContext";
import MyModal from "../../../../modals";
import CallRecordModal from "../../../../modals/callRecords";
import SimpleDataTable from "../../../SimpleDataTable";

export default function PhoneBook(props) {
  const { loan, customers, setmodalTitle, setCallRecordsModal, modalTitle } =
    React.useContext(GlobalContext);

  const [numberCalled, setNumberCalled] = React.useState("");
  const customer = customers.find((item) => item.userId === loan.userId);
  const contacts = customer?.contacts || [];

  const openCallRecordModal = (phone) => {
    setmodalTitle("callRecords");
    setCallRecordsModal(true);
    setNumberCalled(phone || "");
  };

  const primaryContacts = [
    {
      id: "primary",
      name: `${customer?.IDinfo?.firstName || ""} ${customer?.IDinfo?.lastName || ""}`.trim(),
      phone: customer?.phone || "-",
      tag: "Personal",
    },
    {
      id: "backup",
      name: `${customer?.IDinfo?.firstName || ""} ${customer?.IDinfo?.lastName || ""}`.trim(),
      phone: customer?.pesonalInfo?.bUPphone || "-",
      tag: "Backup",
    },
    {
      id: "emergency-1",
      name: customer?.emergncyContacts?.contact1?.name || "-",
      phone: customer?.emergncyContacts?.contact1?.phone || "-",
      tag: customer?.emergncyContacts?.contact1?.relationship || "Emergency",
    },
    {
      id: "emergency-2",
      name: customer?.emergncyContacts?.contact2?.name || "-",
      phone: customer?.emergncyContacts?.contact2?.phone || "-",
      tag: customer?.emergncyContacts?.contact2?.relationship || "Emergency",
    },
    {
      id: "emergency-3",
      name: customer?.emergncyContacts?.contact3?.name || "-",
      phone: customer?.emergncyContacts?.contact3?.phone || "-",
      tag: customer?.emergncyContacts?.contact3?.relationship || "Emergency",
    },
  ].filter((item) => item.phone && item.phone !== "-");

  const columns = [
    { key: "id", label: "#" },
    { key: "name", label: "Name", cellClassName: "font-semibold text-slate-900" },
    {
      key: "tag",
      label: "Type",
      render: (row) => (
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
          {row.tag}
        </span>
      ),
    },
    { key: "phone", label: "Phone Number" },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <div className="flex gap-2">
          <a
            href={`tel:${row.phone}`}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
          >
            Call
          </a>
          <button
            type="button"
            onClick={() => openCallRecordModal(row.phone)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Add Record
          </button>
        </div>
      ),
    },
  ];

  const rows = [
    ...primaryContacts.map((contact, index) => ({
      ...contact,
      id: index + 1,
    })),
    ...contacts.map((contact, index) => ({
      ...contact,
      id: primaryContacts.length + index + 1,
      name: contact?.name || "-",
      tag: contact?.relationship || "Phone book",
      phone: contact?.number || contact?.phone || "-",
    })),
  ];

  return (
    <div className="card">
      <div className="card-body">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-sky-500 px-4 py-3 text-sm font-semibold text-white">
            Address book
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              All customer numbers are shown in one compact list so calls and call-record updates stay fast.
            </div>
            <SimpleDataTable
              columns={columns}
              rows={rows}
              emptyMessage="No phone book contacts found."
            />
          </div>
        </div>
      </div>

      {modalTitle === "callRecords" ? (
        <MyModal>
          <CallRecordModal title={props.title} phone={numberCalled} />
        </MyModal>
      ) : null}
    </div>
  );
}
