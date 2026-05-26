import React from "react";
import { GlobalContext } from "../../../libs/context/globalContext";
import DefaultLoader from "../../../components/loaders/defaultLoader";
import SimpleDataTable from "../../../components/tables/SimpleDataTable";
import { resolveMediaUrl } from "../../../libs/mediaUrl";
import { readSystemConfig } from "../../../libs/systemConfig";
import _updateCustomerPaymentOperator from "../../../handlers/updates/updateCustomerPaymentOperator";

const TAB_ITEMS = [
  { id: "basic", label: "Basic info" },
  { id: "auth", label: "Auth info" },
  { id: "collection", label: "Collection info" },
  { id: "loan", label: "Loan info" },
  { id: "personal", label: "Personal info" },
  { id: "work", label: "Work info" },
  { id: "emergency", label: "Emergency contacts" },
  { id: "contacts", label: "Contact list" },
];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const toUpperValue = (value) => String(value || "").toUpperCase();

function UserQuery() {
  const {
    customers,
    customer,
    setCustomer,
    inputs,
    _handleOnChange,
    _clearCustomerSearch,
    _handleCustomerActiveStatus,
    globalLoader,
    customerProfileLoading,
    isEdit,
    setIsEdit,
    _handleEditCustomer,
    _hasAccess,
    _loadCustomerDetails,
  } = React.useContext(GlobalContext);
  const [activeTab, setActiveTab] = React.useState("basic");
  const [paymentOperatorDrafts, setPaymentOperatorDrafts] = React.useState({});
  const [paymentMethodNotice, setPaymentMethodNotice] = React.useState(null);
  const [savingPaymentMethod, setSavingPaymentMethod] = React.useState("");

  const canViewCustomer = _hasAccess("action:customer:view");
  const canEditCustomer = _hasAccess("action:customer:update");
  const canToggleCustomer = _hasAccess("action:customer:toggle-active");
  const hasCustomer = Boolean(customer && Object.keys(customer).length > 0);
  const searchTermsActive = Boolean(inputs.userId || inputs.phone || inputs.idCard);

  const matchedCustomer = React.useMemo(() => {
    if (!searchTermsActive) return null;

    const normalizedUserId = String(inputs.userId || "").trim().toLowerCase();
    const normalizedPhone = String(inputs.phone || "").trim().toLowerCase();
    const normalizedIdCard = String(inputs.idCard || "").trim().toLowerCase();

    return (Array.isArray(customers) ? customers : []).find((item) => {
      const matchesUserId =
        normalizedUserId &&
        String(item?.userId || "").trim().toLowerCase() === normalizedUserId;
      const matchesPhone =
        normalizedPhone &&
        String(item?.phone || "").trim().toLowerCase() === normalizedPhone;
      const matchesIdCard =
        normalizedIdCard &&
        String(item?.IDinfo?.gCardNumber || "").trim().toLowerCase() === normalizedIdCard;

      return matchesUserId || matchesPhone || matchesIdCard;
    });
  }, [customers, inputs.idCard, inputs.phone, inputs.userId, searchTermsActive]);

  React.useEffect(() => {
    setActiveTab("basic");
  }, [customer?.userId]);

  React.useEffect(() => {
    const nextDrafts = Object.fromEntries(
      (Array.isArray(customer?.paymentMethods) ? customer.paymentMethods : []).map((method) => [
        method?.method || "",
        method?.operator || "",
      ])
    );

    setPaymentOperatorDrafts(nextDrafts);
    setPaymentMethodNotice(null);
    setSavingPaymentMethod("");
  }, [customer?.paymentMethods, customer?.userId]);

  React.useEffect(() => {
    if (!searchTermsActive) return;
    if (!matchedCustomer) {
      setCustomer({});
      return;
    }

    let isMounted = true;

    const loadCustomer = async () => {
      setIsEdit(false);
      const response = await _loadCustomerDetails(matchedCustomer, { silent: true });

      if (!isMounted || !response) return;
    };

    loadCustomer();

    return () => {
      isMounted = false;
    };
  }, [matchedCustomer, searchTermsActive, setCustomer, setIsEdit, _loadCustomerDetails]);

  const contactRows = React.useMemo(
    () =>
      Array.isArray(customer?.contacts)
        ? customer.contacts.map((contact, index) => ({
            id: index + 1,
            name: contact?.name || "-",
            phone: contact?.number || contact?.phone || "-",
            relationship: contact?.relationship || "-",
            address: contact?.address || "-",
            educationalLevel: contact?.educationalLevel || "-",
          }))
        : [],
    [customer?.contacts]
  );

  const paymentMethodRows = React.useMemo(
    () =>
      Array.isArray(customer?.paymentMethods)
        ? customer.paymentMethods.map((method, index) => ({
            id: index + 1,
            type: String(method?.method || "").includes("@") ? "Card / Email" : "Mobile money",
            operatorLabel: method?.operator || "Not set",
            operatorValue: method?.operator || "",
            method: method?.method || "-",
            email: method?.email || "-",
            bindDate: formatDate(method?.createdAt),
          }))
        : [],
    [customer?.paymentMethods]
  );
  const paymentOperatorOptions = React.useMemo(() => {
    const systemConfig = readSystemConfig();
    const countries = Array.isArray(systemConfig?.countries) ? systemConfig.countries : [];
    const preferredCountryCode = String(
      customer?.countryCode || systemConfig?.activeCountryCode || ""
    ).trim();
    const activeCountry =
      countries.find((item) => String(item?.code || "").trim() === preferredCountryCode) ||
      countries.find((item) => String(item?.code || "").trim() === String(systemConfig?.activeCountryCode || "").trim()) ||
      countries[0] ||
      {};
    const networks = Array.isArray(activeCountry?.mobileMoneyNetworks)
      ? activeCountry.mobileMoneyNetworks
      : [];

    return networks
      .map((item) => ({
        value: item?.label || item?.key || "",
        label: item?.label || item?.key || "",
      }))
      .filter((item) => item.value)
      .filter(
        (item, index, array) =>
          array.findIndex((entry) => entry.value === item.value) === index
      );
  }, [customer?.countryCode]);

  const handleSavePaymentOperator = async (row) => {
    const nextOperator = String(paymentOperatorDrafts[row.method] || "").trim();

    if (!nextOperator) {
      setPaymentMethodNotice({
        type: "error",
        text: "Select a mobile money provider before saving.",
      });
      return;
    }

    setSavingPaymentMethod(row.method);
    const response = await _updateCustomerPaymentOperator({
      userId: customer?.userId,
      method: row.method,
      operator: nextOperator,
    });
    setSavingPaymentMethod("");

    if (response.success === 1) {
      setPaymentMethodNotice({
        type: "success",
        text: response.message || "Mobile money provider updated successfully.",
      });
      await _loadCustomerDetails(customer, { silent: true });
      return;
    }

    setPaymentMethodNotice({
      type: "error",
      text: response.message || "Could not update the mobile money provider.",
    });
  };

  const loanRows = React.useMemo(
    () =>
      Array.isArray(customer?.loan?.loans)
        ? customer.loan.loans.map((loanItem, index) => ({
            id: loanItem?.ID || index + 1,
            loanId: loanItem?.ID || "-",
            repaymentAmount: loanItem?.repaymentAmount || "-",
            duration: loanItem?.duration || "-",
            amount: loanItem?.amount || "-",
            applicationDate: formatDateTime(loanItem?.doa),
            paymentDate: loanItem?.dop ? formatDateTime(loanItem.dop) : loanItem?.loanStatus || "-",
            status: loanItem?.loanStatus || "-",
          }))
        : [],
    [customer?.loan?.loans]
  );

  const basicInfoFields = [
    { label: "User ID", value: customer?.userId || "-", disabled: true },
    {
      label: "User level",
      value: customer?.level || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "customerLevel", value }),
    },
    { label: "Phone number", value: customer?.phone || "-", disabled: true },
    {
      label: "User name",
      value: [
        customer?.IDinfo?.firstName,
        customer?.IDinfo?.middleName,
        customer?.IDinfo?.lastName,
      ]
        .filter(Boolean)
        .join(" "),
      disabled: true,
    },
    { label: "Gender", value: customer?.IDinfo?.gender || "-", disabled: true },
    {
      label: "ID card number",
      value: customer?.IDinfo?.gCardNumber || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) =>
        _handleOnChange({
          field: "ghCard",
          value: toUpperValue(value),
        }),
    },
    {
      label: "Phone verification",
      value: customer?.isVerified ? "Verified" : "Not verified",
      disabled: true,
    },
    {
      label: "Loan status",
      value: customer?.loan?.isApplied ? "Applied" : "Not applied",
      disabled: true,
    },
  ];

  const personalFields = [
    { label: "Date of birth", value: formatDate(customer?.pesonalInfo?.dob), disabled: true },
    {
      label: "Area of residence",
      value: customer?.pesonalInfo?.areaName || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "aor", value: toUpperValue(value) }),
    },
    {
      label: "Digital address",
      value: customer?.pesonalInfo?.dAddress || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "dAddress", value: toUpperValue(value) }),
    },
    {
      label: "Land mark",
      value: customer?.pesonalInfo?.landMark || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "aLndMark", value: toUpperValue(value) }),
    },
    {
      label: "Residence type",
      value: customer?.pesonalInfo?.residenceType || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "resiType", value: toUpperValue(value) }),
    },
    {
      label: "Years of residence",
      value: customer?.pesonalInfo?.residenceTime || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "resiYrs", value }),
    },
    {
      label: "In school",
      value: customer?.pesonalInfo?.schoolStatus ? "Yes" : "No",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "inSchool", value: toUpperValue(value) }),
    },
    {
      label: "Educational level",
      value: customer?.pesonalInfo?.educationalLevel || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "eduLev", value: toUpperValue(value) }),
    },
    { label: "Source of income", value: customer?.pesonalInfo?.incomeSource || "-", disabled: true },
    {
      label: "Marital status",
      value: customer?.pesonalInfo?.maritalStatus || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "mStatus", value: toUpperValue(value) }),
    },
    {
      label: "Relatives in need of care",
      value: customer?.pesonalInfo?.relativesINOC || "-",
      disabled: true,
    },
    {
      label: "Backup phone number",
      value: customer?.pesonalInfo?.bUPphone || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "bupPh", value }),
    },
  ];

  const workFields = [
    {
      label: "Work unit",
      value: customer?.workInfo?.workUnit || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "wrkUni", value: toUpperValue(value) }),
    },
    {
      label: "Work content",
      value: customer?.workInfo?.workContent || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "wCont", value: toUpperValue(value) }),
    },
    {
      label: "Work hours",
      value: customer?.workInfo?.workHours || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "wkHrs", value }),
    },
    {
      label: "Industry type",
      value: customer?.workInfo?.industry || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "ind", value: toUpperValue(value) }),
    },
    {
      label: "Current income",
      value: customer?.workInfo?.currentIncome || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "inc", value }),
    },
    {
      label: "Work digital address",
      value: customer?.workInfo?.workAddress || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "wkDAddress", value: toUpperValue(value) }),
    },
    {
      label: "Work locality address",
      value: customer?.workInfo?.companyAddress || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) =>
        _handleOnChange({ field: "wrkLocality", value: toUpperValue(value) }),
    },
    {
      label: "Area land mark",
      value: customer?.workInfo?.LNDmarkCompany || "",
      disabled: !isEdit || !canEditCustomer,
      onChange: (value) => _handleOnChange({ field: "wkLandMark", value: toUpperValue(value) }),
    },
  ];

  const certificationItems = [
    "ID(s)",
    "Personal information",
    "Emergency contact",
    "Job information",
    "Facial recognition",
  ];

  const emergencyContacts = [
    {
      label: "Emergency contact 1",
      contact: customer?.emergncyContacts?.contact1 || {},
      fields: {
        name: "nameCon1",
        phone: "phoneCon1",
        relationship: "releCon1",
        education: "eduLevelCon1",
      },
    },
    {
      label: "Emergency contact 2",
      contact: customer?.emergncyContacts?.contact2 || {},
      fields: {
        name: "nameCon2",
        phone: "phoneCon2",
        relationship: "releCon2",
        education: "eduLevelCon2",
      },
    },
    {
      label: "Emergency contact 3",
      contact: customer?.emergncyContacts?.contact3 || {},
      fields: {
        name: "nameCon3",
        phone: "phoneCon3",
        relationship: "releCon3",
        education: "eduLevelCon3",
      },
    },
  ];

  const contactColumns = [
    { key: "id", label: "#" },
    { key: "name", label: "Name", cellClassName: "font-semibold text-slate-900" },
    { key: "phone", label: "Phone number" },
    { key: "relationship", label: "Relationship" },
    { key: "address", label: "Address" },
    { key: "educationalLevel", label: "Education" },
  ];

  const paymentColumns = [
    { key: "type", label: "Type" },
    {
      key: "operatorLabel",
      label: "Service provider",
      render: (row) =>
        row.type !== "Mobile money" ? (
          row.operatorLabel
        ) : isEdit && canEditCustomer && paymentOperatorOptions.length > 0 ? (
          <select
            className="min-h-[38px] min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={paymentOperatorDrafts[row.method] || ""}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) =>
              setPaymentOperatorDrafts((current) => ({
                ...current,
                [row.method]: event.target.value,
              }))
            }
          >
            <option value="">Select provider</option>
            {paymentOperatorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          row.operatorLabel
        ),
    },
    { key: "method", label: "Account number" },
    { key: "email", label: "User email" },
    { key: "bindDate", label: "Bind date" },
    {
      key: "action",
      label: "Action",
      render: (row) =>
        row.type !== "Mobile money" ? (
          "-"
        ) : isEdit && canEditCustomer ? (
          <button
            type="button"
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={
              savingPaymentMethod === row.method ||
              !String(paymentOperatorDrafts[row.method] || "").trim() ||
              paymentOperatorDrafts[row.method] === row.operatorValue
            }
            onClick={(event) => {
              event.stopPropagation();
              handleSavePaymentOperator(row);
            }}
          >
            {savingPaymentMethod === row.method ? "Saving..." : "Save provider"}
          </button>
        ) : (
          <span className="text-xs text-slate-500">Enable edit mode to update</span>
        ),
    },
  ];

  const loanColumns = [
    { key: "loanId", label: "Loan ID", cellClassName: "font-semibold text-slate-900" },
    { key: "repaymentAmount", label: "Repayment amount" },
    { key: "duration", label: "Loan duration" },
    { key: "amount", label: "Loan amount" },
    { key: "applicationDate", label: "Application date" },
    { key: "paymentDate", label: "Payment date" },
    { key: "status", label: "Loan status" },
  ];

  return (
    <div className="container space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-3 p-4">
          <SearchInput
            placeholder="User ID"
            value={inputs.userId}
            onChange={(value) => _handleOnChange({ field: "userId", value })}
          />
          <SearchInput
            placeholder="Phone numbers"
            value={inputs.phone}
            onChange={(value) => _handleOnChange({ field: "phone", value })}
          />
          <SearchInput
            placeholder="ID card number"
            value={inputs.idCard}
            onChange={(value) => _handleOnChange({ field: "idCard", value })}
          />
          <button
            type="button"
            onClick={_clearCustomerSearch}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <i className="fa fa-undo mr-2" />
            Clear
          </button>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          Search updates live as you type by user ID, phone, or ID card number.
        </div>
      </div>

      {customerProfileLoading && !hasCustomer ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <DefaultLoader />
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Loading customer details
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Personal info, contacts, images, and loan history are syncing now.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {!customerProfileLoading && !hasCustomer ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <i className="fa fa-user-o text-xl" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                No customer selected
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Search by user ID, phone number, or ID card, or open a customer from the list.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {!hasCustomer ? null : (
        <section key={customer?.userId} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          {!canViewCustomer ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              You do not have access to view customer details.
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {[
                        customer?.IDinfo?.firstName,
                        customer?.IDinfo?.middleName,
                        customer?.IDinfo?.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ") || customer?.userId}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {customer?.userId} · {customer?.phone || "-"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge label={`Level ${customer?.level || "-"}`} tone="info" />
                    <StatusBadge
                      label={customer?.isActive ? "Active" : "Blocked"}
                      tone={customer?.isActive ? "success" : "danger"}
                    />
                    <StatusBadge
                      label={customer?.isVerified ? "Verified" : "Unverified"}
                      tone={customer?.isVerified ? "success" : "neutral"}
                    />
                    <StatusBadge
                      label={customer?.loan?.isApplied ? "Has Loan Record" : "No Loan Record"}
                      tone={customer?.loan?.isApplied ? "info" : "neutral"}
                    />
                    {customerProfileLoading ? (
                      <StatusBadge label="Refreshing details" tone="neutral" />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={globalLoader || !canEditCustomer}
                  onClick={isEdit && canEditCustomer ? _handleEditCustomer : () => setIsEdit(true)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${
                    isEdit ? "bg-emerald-600" : "bg-blue-600"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {globalLoader ? (
                    <DefaultLoader />
                  ) : isEdit ? (
                    <>
                      <i className="fa fa-save mr-2" />
                      Save modified data
                    </>
                  ) : (
                    <>
                      <i className="fa fa-edit mr-2" />
                      Modify user info
                    </>
                  )}
                </button>
                {canToggleCustomer ? (
                  <button
                    type="button"
                    onClick={() => _handleCustomerActiveStatus(customer.userId)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold text-white ${
                      customer?.isActive ? "bg-rose-600" : "bg-emerald-600"
                    }`}
                  >
                    <i className="fa fa-power-off mr-2" />
                    {customer?.isActive ? "Block customer" : "Unblock customer"}
                  </button>
                ) : null}
              </div>

              <div className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-2">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "basic" ? (
                <div className="space-y-4">
                  <SectionCard title="Basic information">
                    <div className="grid gap-4 md:grid-cols-2">
                      {basicInfoFields.map((field) => (
                        <DetailInput
                          key={field.label}
                          label={field.label}
                          value={field.value}
                          disabled={field.disabled}
                          onChange={field.onChange}
                        />
                      ))}
                    </div>
                  </SectionCard>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <ImageCard title="ID Front" src={customer?.IDinfo?.idFront} />
                    <ImageCard title="ID Back" src={customer?.IDinfo?.idBack} />
                    <ImageCard title="Live Photo" src={customer?.userImage} />
                  </div>
                  {isEdit && canEditCustomer ? (
                    <SectionCard title="Update identity images">
                      <div className="grid gap-4 md:grid-cols-3">
                        <FileField
                          label="ID Front Image"
                          onChange={(file) =>
                            _handleOnChange({
                              field: "idFrontImage",
                              value: file,
                            })
                          }
                          helperText={inputs.idFrontImage?.name || "Upload a new front image"}
                        />
                        <FileField
                          label="ID Back Image"
                          onChange={(file) =>
                            _handleOnChange({
                              field: "idBackImage",
                              value: file,
                            })
                          }
                          helperText={inputs.idBackImage?.name || "Upload a new back image"}
                        />
                        <FileField
                          label="Live Photo"
                          onChange={(file) =>
                            _handleOnChange({
                              field: "livePhotoImage",
                              value: file,
                            })
                          }
                          helperText={inputs.livePhotoImage?.name || "Upload a new live photo"}
                        />
                      </div>
                    </SectionCard>
                  ) : null}
                  {!isEdit ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Enable edit mode to update ID number, front/back ID photos, and live photo.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeTab === "auth" ? (
                <SectionCard title="Certification timeline">
                  <div className="space-y-3">
                    {certificationItems.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                      >
                        <i className="fa fa-check-circle" />
                        <span>
                          {item} - certified - {formatDateTime(customer?.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              ) : null}

              {activeTab === "collection" ? (
                <SectionCard title="Collection method information">
                  <SectionHint text={`${paymentMethodRows.length} payment method${paymentMethodRows.length === 1 ? "" : "s"} linked`} />
                  {paymentMethodNotice ? (
                    <div
                      className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
                        paymentMethodNotice.type === "success"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {paymentMethodNotice.text}
                    </div>
                  ) : null}
                  <SimpleDataTable
                    columns={paymentColumns}
                    rows={paymentMethodRows}
                    emptyMessage="No collection methods found."
                    dense
                  />
                </SectionCard>
              ) : null}

              {activeTab === "loan" ? (
                <SectionCard title="Loan information">
                  <SectionHint text={`${loanRows.length} loan record${loanRows.length === 1 ? "" : "s"} found`} />
                  <SimpleDataTable
                    columns={loanColumns}
                    rows={loanRows}
                    rowKey="loanId"
                    emptyMessage="No loan records found."
                    dense
                  />
                </SectionCard>
              ) : null}

              {activeTab === "personal" ? (
                <SectionCard title="Personal information">
                  <div className="grid gap-4 md:grid-cols-2">
                    {personalFields.map((field) => (
                      <DetailInput
                        key={field.label}
                        label={field.label}
                        value={field.value}
                        disabled={field.disabled}
                        onChange={field.onChange}
                      />
                    ))}
                  </div>
                </SectionCard>
              ) : null}

              {activeTab === "work" ? (
                <SectionCard title="Work information">
                  <div className="grid gap-4 md:grid-cols-2">
                    {workFields.map((field) => (
                      <DetailInput
                        key={field.label}
                        label={field.label}
                        value={field.value}
                        disabled={field.disabled}
                        onChange={field.onChange}
                      />
                    ))}
                  </div>
                </SectionCard>
              ) : null}

              {activeTab === "emergency" ? (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {emergencyContacts.map((item) => (
                    <SectionCard key={item.label} title={item.label}>
                      <div className="grid gap-4">
                        <DetailInput
                          label="Name"
                          value={item.contact?.name || ""}
                          disabled={!isEdit || !canEditCustomer}
                          onChange={(value) =>
                            _handleOnChange({
                              field: item.fields.name,
                              value: toUpperValue(value),
                            })
                          }
                        />
                        <DetailInput
                          label="Phone number"
                          value={item.contact?.phone || ""}
                          disabled={!isEdit || !canEditCustomer}
                          onChange={(value) =>
                            _handleOnChange({ field: item.fields.phone, value })
                          }
                        />
                        <DetailInput
                          label="Relationship"
                          value={item.contact?.relationship || ""}
                          disabled={!isEdit || !canEditCustomer}
                          onChange={(value) =>
                            _handleOnChange({
                              field: item.fields.relationship,
                              value: toUpperValue(value),
                            })
                          }
                        />
                        <DetailInput
                          label="Educational level"
                          value={item.contact?.educationalLevel || ""}
                          disabled={!isEdit || !canEditCustomer}
                          onChange={(value) =>
                            _handleOnChange({
                              field: item.fields.education,
                              value: toUpperValue(value),
                            })
                          }
                        />
                      </div>
                    </SectionCard>
                  ))}
                </div>
              ) : null}

              {activeTab === "contacts" ? (
                <SectionCard title="Contact list">
                  <SectionHint text={`${contactRows.length} contact${contactRows.length === 1 ? "" : "s"} found`} />
                  <SimpleDataTable
                    columns={contactColumns}
                    rows={contactRows}
                    emptyMessage="No contact records found."
                    dense
                  />
                </SectionCard>
              ) : null}
            </>
          )}
        </section>
      )}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-[42px] min-w-[180px] flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DetailInput({ label, value, onChange, disabled }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-600">{label}</span>
      <input
        value={value || ""}
        disabled={disabled}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="min-h-[42px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function ImageCard({ title, src }) {
  const resolvedSrc = resolveMediaUrl(src);
  const [imageLoadFailed, setImageLoadFailed] = React.useState(false);

  React.useEffect(() => {
    setImageLoadFailed(false);
  }, [resolvedSrc]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      {resolvedSrc && !imageLoadFailed ? (
        <img
          src={resolvedSrc}
          alt={title}
          className="h-64 w-full rounded-2xl object-cover"
          onError={() => setImageLoadFailed(true)}
        />
      ) : (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
          {imageLoadFailed ? "Image failed to load" : "No image available"}
        </div>
      )}
    </div>
  );
}

function SectionHint({ text }) {
  return (
    <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      {text}
    </div>
  );
}

function StatusBadge({ label, tone = "neutral" }) {
  const toneClassName =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "danger"
      ? "bg-rose-100 text-rose-700"
      : tone === "info"
      ? "bg-blue-100 text-blue-700"
      : "bg-slate-200 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClassName}`}>
      {label}
    </span>
  );
}

function FileField({ label, helperText, onChange }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        className="block w-full text-sm text-slate-600"
      />
      <span className="mt-2 block text-xs text-slate-500">{helperText}</span>
    </label>
  );
}

export default UserQuery;
