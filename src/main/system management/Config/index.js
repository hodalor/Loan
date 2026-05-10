import React from "react";
import DefaultLoader from "../../../components/loaders/defaultLoader";
import {
  channelLabels,
  defaultSystemConfig,
  saveSystemConfig,
  readSystemConfig,
  resetSystemConfig,
} from "../../../libs/systemConfig";
import { _getSystemConfig, _updateSystemConfig } from "../../../handlers";
import { GlobalContext } from "../../../libs/context/globalContext";

const tabs = [
  { id: "disbursement", label: "Disbursement" },
  { id: "channels", label: "Channels" },
  { id: "country", label: "Country" },
  { id: "repayment", label: "Repayment" },
  { id: "gateway", label: "Gateway" },
  { id: "loan-settings", label: "Loan Settings" },
  { id: "content", label: "Content" },
];

const modeCards = [
  { value: "manual", title: "Manual" },
  { value: "automatic", title: "Automatic" },
];

const availableChannels = Object.keys(channelLabels);

const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const buildLoanTermDraft = (term = {}, sortOrder = 0) => ({
  key: term.key || "",
  label: term.label || "",
  days: String(term.days ?? ""),
  interestRate: String(term.interestRate ?? 0),
  serviceFeeRate: String(term.serviceFeeRate ?? 0),
  processingFeeRate: String(term.processingFeeRate ?? 0),
  commitmentFeeRate: String(term.commitmentFeeRate ?? 0),
  isEnabled: term.isEnabled ?? true,
  sortOrder: term.sortOrder ?? sortOrder,
});
const buildLoanLevelDraft = (item = {}) => ({
  level: String(item.level ?? ""),
  label: item.label || "",
  minAmount: String(item.minAmount ?? ""),
  maxAmount: String(item.maxAmount ?? ""),
  isEnabled: item.isEnabled ?? true,
});
const buildExtensionDraft = (item = {}) => ({
  key: item.key || "",
  label: item.label || "",
  days: String(item.days ?? ""),
  feeRate: String(item.feeRate ?? ""),
  isEnabled: item.isEnabled ?? true,
});
const buildCountryDraft = (country = {}) => ({
  code: country.code || "",
  name: country.name || "",
  locale: country.locale || "",
  currencyCode: country.currencyCode || "",
  currencySymbol: country.currencySymbol || "",
  dialCode: country.dialCode || "",
  phoneExample: country.phoneExample || "",
  isEnabled: country.isEnabled ?? true,
  paymentProviders: Array.isArray(country.paymentProviders)
    ? country.paymentProviders.map((item) => ({
        key: item.key || "",
        label: item.label || "",
        type: item.type || "gateway",
        channel: item.channel || "",
        isEnabled: item.isEnabled ?? true,
      }))
    : [],
  mobileMoneyNetworks: Array.isArray(country.mobileMoneyNetworks)
    ? country.mobileMoneyNetworks.map((item) => ({
        key: item.key || "",
        label: item.label || "",
        type: item.type || "mobile-money",
        isEnabled: item.isEnabled ?? true,
      }))
    : [],
  cardProviders: Array.isArray(country.cardProviders)
    ? country.cardProviders.map((item) => ({
        key: item.key || "",
        label: item.label || "",
        type: item.type || "card",
        channel: item.channel || "",
        isEnabled: item.isEnabled ?? true,
      }))
    : [],
});
const buildProviderDraft = (item = {}) => ({
  key: item.key || "",
  label: item.label || "",
  type: item.type || "gateway",
  channel: item.channel || "",
  isEnabled: item.isEnabled ?? true,
});
const buildNetworkDraft = (item = {}) => ({
  key: item.key || "",
  label: item.label || "",
  type: item.type || "mobile-money",
  isEnabled: item.isEnabled ?? true,
});

const listToMultiline = (items = []) => (Array.isArray(items) ? items.join("\n") : "");
const multilineToList = (value = "") =>
  String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export default function SystemConfig() {
  const { _hasAccess } = React.useContext(GlobalContext);
  const [activeTab, setActiveTab] = React.useState(() => {
    if (typeof window === "undefined") return "disbursement";

    const savedTab = window.sessionStorage.getItem("admin-system-config-tab");
    return tabs.some((tab) => tab.id === savedTab) ? savedTab : "disbursement";
  });
  const [config, setConfig] = React.useState(() => readSystemConfig());
  const [savedAt, setSavedAt] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [configReady, setConfigReady] = React.useState(false);
  const [termDraft, setTermDraft] = React.useState(() =>
    buildLoanTermDraft({}, defaultSystemConfig.loanTerms.length)
  );
  const [editingTermKey, setEditingTermKey] = React.useState("");
  const [levelDraft, setLevelDraft] = React.useState(() => buildLoanLevelDraft({}));
  const [editingLevel, setEditingLevel] = React.useState("");
  const [extensionDraft, setExtensionDraft] = React.useState(() => buildExtensionDraft({}));
  const [editingExtensionKey, setEditingExtensionKey] = React.useState("");
  const [countryDraft, setCountryDraft] = React.useState(() =>
    buildCountryDraft(defaultSystemConfig.countries?.[0] || {})
  );
  const [editingCountryCode, setEditingCountryCode] = React.useState("");
  const [loanSettingsModal, setLoanSettingsModal] = React.useState("");
  const canSaveConfig = _hasAccess("action:config:update");
  const canManageRepayment = _hasAccess("action:config:repayment");

  React.useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);

      const response = await _getSystemConfig();
      const nextConfig =
        response.success === 1 && response.data
          ? response.data
          : readSystemConfig() || defaultSystemConfig;

      setConfig(nextConfig);
      setTermDraft(buildLoanTermDraft({}, (nextConfig.loanTerms || []).length));
      setLevelDraft(buildLoanLevelDraft({}));
      setExtensionDraft(buildExtensionDraft({}));
      setCountryDraft(
        buildCountryDraft(
          (nextConfig.countries || []).find(
            (item) => item.code === nextConfig.activeCountryCode
          ) ||
            nextConfig.countries?.[0] ||
            defaultSystemConfig.countries?.[0] ||
            {}
        )
      );
      setEditingCountryCode(nextConfig.activeCountryCode || "");
      saveSystemConfig(nextConfig);
      setConfigReady(true);
      setLoading(false);
    };

    loadConfig();
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("admin-system-config-tab", activeTab);
  }, [activeTab]);

  const updateField = (field, value) => {
    setConfig((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updatePortalContentField = (field, value) => {
    setConfig((current) => ({
      ...current,
      portalContent: {
        ...(current.portalContent || {}),
        [field]: value,
      },
    }));
  };

  const updateAuthVerificationField = (field, value) => {
    setConfig((current) => ({
      ...current,
      authVerification: {
        ...(current.authVerification || {}),
        [field]: value,
      },
    }));
  };

  const updateFirebaseWebConfigField = (field, value) => {
    setConfig((current) => ({
      ...current,
      authVerification: {
        ...(current.authVerification || {}),
        firebaseWebConfig: {
          ...(current.authVerification?.firebaseWebConfig || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleChannelToggle = (channel) => {
    setConfig((current) => {
      const implemented = Array.isArray(current.implementedChannels)
        ? current.implementedChannels
        : [];
      const exists = implemented.includes(channel);
      const nextChannels = exists
        ? implemented.filter((item) => item !== channel)
        : [...implemented, channel];

      if (nextChannels.length === 0) {
        return current;
      }

      return {
        ...current,
        implementedChannels: nextChannels,
        activeChannel: nextChannels.includes(current.activeChannel)
          ? current.activeChannel
          : nextChannels[0],
        gatewayProvider: nextChannels.includes(current.gatewayProvider)
          ? current.gatewayProvider
          : nextChannels[0],
      };
    });
  };

  const resetTermEditor = React.useCallback(
    (nextSortOrder = (config.loanTerms || []).length) => {
      setEditingTermKey("");
      setTermDraft(buildLoanTermDraft({}, nextSortOrder));
    },
    [config.loanTerms]
  );
  const resetLevelEditor = React.useCallback(() => {
    setEditingLevel("");
    setLevelDraft(buildLoanLevelDraft({}));
  }, []);
  const resetExtensionEditor = React.useCallback(() => {
    setEditingExtensionKey("");
    setExtensionDraft(buildExtensionDraft({}));
  }, []);
  const resetCountryEditor = React.useCallback(
    (countryCode = "") => {
      const targetCountry =
        (config.countries || []).find((item) => item.code === countryCode) ||
        (config.countries || []).find((item) => item.code === config.activeCountryCode) ||
        config.countries?.[0] ||
        defaultSystemConfig.countries?.[0] ||
        {};

      setEditingCountryCode(targetCountry.code || "");
      setCountryDraft(buildCountryDraft(targetCountry));
    },
    [config.activeCountryCode, config.countries]
  );

  const handleEditTerm = (term) => {
    setEditingTermKey(term.key);
    setTermDraft(buildLoanTermDraft(term, term.sortOrder));
    setActiveTab("loan-settings");
    setLoanSettingsModal("term");
  };

  const handleToggleTerm = (termKey) => {
    setConfig((current) => ({
      ...current,
      loanTerms: (current.loanTerms || []).map((term) =>
        term.key === termKey ? { ...term, isEnabled: !term.isEnabled } : term
      ),
    }));
  };

  const handleEditLevel = (item) => {
    setEditingLevel(String(item.level));
    setLevelDraft(buildLoanLevelDraft(item));
    setActiveTab("loan-settings");
    setLoanSettingsModal("level");
  };

  const handleToggleLevel = (levelValue) => {
    setConfig((current) => ({
      ...current,
      loanLevels: (current.loanLevels || []).map((item) =>
        Number(item.level) === Number(levelValue)
          ? { ...item, isEnabled: !item.isEnabled }
          : item
      ),
    }));
  };

  const handleEditExtension = (item) => {
    setEditingExtensionKey(item.key);
    setExtensionDraft(buildExtensionDraft(item));
    setActiveTab("loan-settings");
    setLoanSettingsModal("extension");
  };

  const openTermModal = () => {
    resetTermEditor((config.loanTerms || []).length);
    setLoanSettingsModal("term");
  };

  const openLevelModal = () => {
    resetLevelEditor();
    setLoanSettingsModal("level");
  };

  const openExtensionModal = () => {
    resetExtensionEditor();
    setLoanSettingsModal("extension");
  };

  const closeLoanSettingsModal = () => {
    if (loanSettingsModal === "term") {
      resetTermEditor((config.loanTerms || []).length);
    }

    if (loanSettingsModal === "level") {
      resetLevelEditor();
    }

    if (loanSettingsModal === "extension") {
      resetExtensionEditor();
    }

    setLoanSettingsModal("");
  };

  const handleToggleExtension = (extensionKey) => {
    setConfig((current) => ({
      ...current,
      extensionPeriods: (current.extensionPeriods || []).map((item) =>
        item.key === extensionKey ? { ...item, isEnabled: !item.isEnabled } : item
      ),
    }));
  };
  const handleEditCountry = (country) => {
    setEditingCountryCode(country.code);
    setCountryDraft(buildCountryDraft(country));
    setActiveTab("country");
  };
  const handleToggleCountry = (countryCode) => {
    setConfig((current) => ({
      ...current,
      countries: (current.countries || []).map((item) =>
        item.code === countryCode ? { ...item, isEnabled: !item.isEnabled } : item
      ),
    }));
  };
  const updateCountryDraftField = (field, value) => {
    setCountryDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };
  const updateCountryListItem = (field, index, key, value) => {
    setCountryDraft((current) => ({
      ...current,
      [field]: (current[field] || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };
  const addCountryListItem = (field, item) => {
    setCountryDraft((current) => ({
      ...current,
      [field]: [...(current[field] || []), item],
    }));
  };
  const removeCountryListItem = (field, index) => {
    setCountryDraft((current) => ({
      ...current,
      [field]: (current[field] || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };
  const handleSaveCountry = () => {
    const code = String(countryDraft.code || "").trim().toUpperCase();
    const name = String(countryDraft.name || "").trim();

    if (!code || !name) return;

    const nextCountry = {
      ...countryDraft,
      code,
      name,
      locale: String(countryDraft.locale || "").trim() || "en-US",
      currencyCode: String(countryDraft.currencyCode || "").trim().toUpperCase(),
      currencySymbol: String(countryDraft.currencySymbol || "").trim(),
      dialCode: String(countryDraft.dialCode || "").trim(),
      phoneExample: String(countryDraft.phoneExample || "").trim(),
      paymentProviders: (countryDraft.paymentProviders || []).filter(
        (item) => item.key.trim() && item.label.trim()
      ),
      mobileMoneyNetworks: (countryDraft.mobileMoneyNetworks || []).filter(
        (item) => item.key.trim() && item.label.trim()
      ),
      cardProviders: (countryDraft.cardProviders || []).filter(
        (item) => item.key.trim() && item.label.trim()
      ),
    };

    setConfig((current) => {
      const countries = current.countries || [];
      const exists = countries.some((item) => item.code === code);
      const nextCountries = exists
        ? countries.map((item) => (item.code === code ? nextCountry : item))
        : [...countries, nextCountry];

      return {
        ...current,
        countries: nextCountries.sort((left, right) => left.name.localeCompare(right.name)),
        activeCountryCode: current.activeCountryCode || code,
      };
    });

    setEditingCountryCode(code);
  };

  const handleMoveTerm = (termKey, direction) => {
    setConfig((current) => {
      const sortedTerms = [...(current.loanTerms || [])].sort(
        (left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0)
      );
      const currentIndex = sortedTerms.findIndex((term) => term.key === termKey);
      const targetIndex = currentIndex + direction;

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= sortedTerms.length
      ) {
        return current;
      }

      const swappedTerms = [...sortedTerms];
      [swappedTerms[currentIndex], swappedTerms[targetIndex]] = [
        swappedTerms[targetIndex],
        swappedTerms[currentIndex],
      ];

      return {
        ...current,
        loanTerms: swappedTerms.map((term, index) => ({
          ...term,
          sortOrder: index,
        })),
      };
    });
  };

  const handleSaveTerm = () => {
    const label = termDraft.label.trim();
    const days = Math.max(1, Math.round(toNumber(termDraft.days, 0)));

    if (!label || !days) {
      return;
    }

    const nextKey =
      editingTermKey || slugify(termDraft.key || `${label}-${days}-days`) || `term-${Date.now()}`;
    const nextTerm = {
      key: nextKey,
      label,
      days,
      interestRate: toNumber(termDraft.interestRate, 0),
      serviceFeeRate: toNumber(termDraft.serviceFeeRate, 0),
      processingFeeRate: toNumber(termDraft.processingFeeRate, 0),
      commitmentFeeRate: toNumber(termDraft.commitmentFeeRate, 0),
      isEnabled: Boolean(termDraft.isEnabled),
      sortOrder: editingTermKey
        ? Number(termDraft.sortOrder || 0)
        : (config.loanTerms || []).length,
    };

    setConfig((current) => {
      const existingTerms = current.loanTerms || [];
      const hasExisting = existingTerms.some((term) => term.key === nextKey);
      const nextTerms = hasExisting
        ? existingTerms.map((term) => (term.key === nextKey ? nextTerm : term))
        : [...existingTerms, nextTerm];

      return {
        ...current,
        loanTerms: nextTerms.map((term, index) => ({
          ...term,
          sortOrder: index,
        })),
      };
    });

    resetTermEditor((config.loanTerms || []).length + (editingTermKey ? 0 : 1));
    setLoanSettingsModal("");
  };

  const handleSaveLevel = () => {
    const level = Math.max(1, Math.round(toNumber(levelDraft.level, 0)));
    const label = levelDraft.label.trim() || (level === 1 ? "Starter Level" : `Level ${level}`);
    const minAmount = Math.max(0, toNumber(levelDraft.minAmount, level * 50));
    const maxAmount = Math.max(minAmount, toNumber(levelDraft.maxAmount, level * 100));

    if (!level) {
      return;
    }

    const nextLevelItem = {
      level,
      label,
      minAmount,
      maxAmount,
      isEnabled: Boolean(levelDraft.isEnabled),
    };

    setConfig((current) => {
      const existingLevels = current.loanLevels || [];
      const hasExisting = existingLevels.some((item) => Number(item.level) === level);
      const nextLevels = hasExisting
        ? existingLevels.map((item) =>
            Number(item.level) === level ? nextLevelItem : item
          )
        : [...existingLevels, nextLevelItem];

      return {
        ...current,
        loanLevels: nextLevels.sort((left, right) => Number(left.level) - Number(right.level)),
      };
    });

    resetLevelEditor();
    setLoanSettingsModal("");
  };

  const handleSaveExtension = () => {
    const days = Math.max(1, Math.round(toNumber(extensionDraft.days, 0)));
    const label = extensionDraft.label.trim() || `${days} Days`;

    if (!days) return;

    const nextExtension = {
      key:
        editingExtensionKey ||
        slugify(extensionDraft.key || `${label}-${days}-extension`) ||
        `extension-${Date.now()}`,
      label,
      days,
      feeRate: toNumber(extensionDraft.feeRate, 0),
      isEnabled: Boolean(extensionDraft.isEnabled),
    };

    setConfig((current) => {
      const existingItems = current.extensionPeriods || [];
      const hasExisting = existingItems.some((item) => item.key === nextExtension.key);
      const nextItems = hasExisting
        ? existingItems.map((item) => (item.key === nextExtension.key ? nextExtension : item))
        : [...existingItems, nextExtension];

      return {
        ...current,
        extensionPeriods: nextItems.sort((left, right) => left.days - right.days),
      };
    });

    resetExtensionEditor();
    setLoanSettingsModal("");
  };

  const handleSave = async () => {
    setSaving(true);

    const response = await _updateSystemConfig(config);
    if (response.success === 1 && response.data) {
      setConfig(response.data);
      saveSystemConfig(response.data);
      setSavedAt(new Date().toLocaleString());
      resetTermEditor((response.data.loanTerms || []).length);
      resetLevelEditor();
      resetExtensionEditor();
      resetCountryEditor(response.data.activeCountryCode);
    }

    setSaving(false);
  };

  const handleReset = () => {
    const nextConfig = resetSystemConfig();
    setConfig(nextConfig);
    setSavedAt("");
    resetTermEditor(nextConfig.loanTerms.length);
    resetLevelEditor();
    resetExtensionEditor();
    resetCountryEditor(nextConfig.activeCountryCode);
  };

  const sortedLoanTerms = [...(config.loanTerms || [])].sort(
    (left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0)
  );
  const sortedLoanLevels = [...(config.loanLevels || [])].sort(
    (left, right) => Number(left.level || 0) - Number(right.level || 0)
  );
  const enabledLoanTerms = sortedLoanTerms.filter((term) => term.isEnabled);
  const enabledLoanLevels = sortedLoanLevels.filter((item) => item.isEnabled);
  const sortedExtensions = [...(config.extensionPeriods || [])].sort(
    (left, right) => Number(left.days || 0) - Number(right.days || 0)
  );
  const enabledRepaymentOptions = (config.repaymentOptions || []).filter(
    (item) => item.isEnabled
  );
  const totalFaqs = (config.portalContent?.faqs || []).length;
  const totalTutorials = (config.portalContent?.repaymentTutorials || []).length;
  const otpMode = config.authVerification?.otpMode === "real" ? "real" : "demo";
  const firebaseConfigured = Boolean(
    config.authVerification?.firebaseWebConfig?.apiKey &&
      config.authVerification?.firebaseWebConfig?.authDomain &&
      config.authVerification?.firebaseWebConfig?.projectId &&
      config.authVerification?.firebaseWebConfig?.appId
  );
  const activeCountry =
    (config.countries || []).find((item) => item.code === config.activeCountryCode) ||
    config.countries?.[0] ||
    defaultSystemConfig.countries?.[0];

  return (
    <div className="space-y-6">
      <section className="app-panel">
        <div className="app-panel-header">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Config</h3>
            <p className="text-sm text-slate-500">
              Manage operations, loan terms, and customer-facing portal content.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="app-btn-secondary" onClick={handleReset}>
              Reset
            </button>
            <button
              type="button"
              className="app-btn-primary gap-2"
              onClick={handleSave}
              disabled={saving || !canSaveConfig}
            >
              {saving ? <DefaultLoader /> : null}
              Save Config
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 px-6">
          <div className="flex flex-wrap gap-6 overflow-x-auto">
            {tabs.map((tab) => (
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

        <div className="app-panel-body">
          {loading || !configReady ? (
            <div className="flex items-center justify-center py-12">
              <span className="inline-flex h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            </div>
          ) : null}

          {!loading && activeTab === "disbursement" ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                {modeCards.map((mode) => {
                  const active = config.disbursementMode === mode.value;

                  return (
                    <button
                      key={mode.value}
                      type="button"
                      disabled={!canSaveConfig}
                      onClick={() => updateField("disbursementMode", mode.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-blue-600 bg-blue-50 shadow-soft"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-slate-900">
                            {mode.title} Disbursement
                          </h4>
                        </div>
                        {active ? (
                          <i className="fa fa-check-circle text-xl text-blue-600" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <StatCard
                  title="Current Mode"
                  value={String(config.disbursementMode || "manual")}
                  valueClassName="capitalize"
                />
                <StatCard
                  title="Primary Channel"
                  value={channelLabels[config.activeChannel] || "Not set"}
                />
                <StatCard title="Last Saved" value={savedAt || "Not saved"} compact />
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <ToggleInfoCard
                  title="Repayment Automation"
                  description="Control whether repayments post automatically after successful repayment confirmation."
                  label="Auto Repayment Posting"
                  detail={
                    config.autoRepaymentPosting
                      ? "Repayments can post automatically."
                      : "Repayments stay manual until enabled."
                  }
                  enabled={config.autoRepaymentPosting}
                  onToggle={() =>
                    updateField("autoRepaymentPosting", !config.autoRepaymentPosting)
                  }
                  disabled={!canManageRepayment}
                  enabledTone="emerald"
                />

                <ToggleInfoCard
                  title="Gateway Safety Check"
                  description="Decide whether operations must pass gateway approval before final posting."
                  label="Require Approval Check"
                  detail="Adds a stricter verification step before final settlement."
                  enabled={config.requireGatewayApprovalCheck}
                  onToggle={() =>
                    updateField(
                      "requireGatewayApprovalCheck",
                      !config.requireGatewayApprovalCheck
                    )
                  }
                  disabled={!canManageRepayment}
                  enabledTone="blue"
                />
              </div>
            </div>
          ) : null}

          {!loading && activeTab === "channels" ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {availableChannels.map((channel) => {
                  const implemented = config.implementedChannels.includes(channel);
                  const active = config.activeChannel === channel;

                  return (
                    <button
                      key={channel}
                      type="button"
                      disabled={!canSaveConfig}
                      onClick={() => handleChannelToggle(channel)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        implemented
                          ? "border-blue-600 bg-blue-50 shadow-soft"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                          <i className="fa fa-random text-lg" />
                        </div>
                        {implemented ? (
                          <i className="fa fa-check-circle text-lg text-blue-600" />
                        ) : null}
                      </div>
                      <h4 className="mt-4 text-base font-semibold text-slate-900">
                        {channelLabels[channel] || channel}
                      </h4>
                      <p className="mt-2 text-sm text-slate-500">
                        {implemented ? "Implemented and available" : "Not active"}
                      </p>
                      {active && implemented ? (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
                          Primary disbursement channel
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="app-label">Primary Disbursement Channel</label>
                  <select
                    className="app-select"
                    disabled={!canSaveConfig}
                    value={config.activeChannel}
                    onChange={(e) => updateField("activeChannel", e.target.value)}
                  >
                    {config.implementedChannels.map((channel) => (
                      <option key={channel} value={channel}>
                        {channelLabels[channel] || channel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="app-label">Fallback / Gateway Provider</label>
                  <select
                    className="app-select"
                    disabled={!canSaveConfig}
                    value={config.gatewayProvider}
                    onChange={(e) => updateField("gatewayProvider", e.target.value)}
                  >
                    {config.implementedChannels.map((channel) => (
                      <option key={channel} value={channel}>
                        {channelLabels[channel] || channel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === "country" ? (
            <div className="space-y-5">
              <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">Active Country</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          This controls the default locale, currency, and provider list used by the web app.
                        </p>
                      </div>
                      <StatusChip enabled={Boolean(activeCountry?.isEnabled)} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="app-label">Default Country</label>
                        <select
                          className="app-select"
                          disabled={!canSaveConfig}
                          value={config.activeCountryCode || ""}
                          onChange={(e) => {
                            updateField("activeCountryCode", e.target.value);
                            resetCountryEditor(e.target.value);
                          }}
                        >
                          {(config.countries || []).map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name} ({country.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="app-label">Auth / OTP Country</label>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                          {activeCountry?.name || "Not set"} · {activeCountry?.dialCode || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <MiniMetric title="Locale" value={activeCountry?.locale || "en-US"} />
                      <MiniMetric title="Currency" value={activeCountry?.currencyCode || "USD"} />
                      <MiniMetric title="Symbol" value={activeCountry?.currencySymbol || "$"} />
                      <MiniMetric title="Dial Code" value={activeCountry?.dialCode || "+1"} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">Country Profiles</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Edit country-specific payment gateways, card providers, and mobile-money networks.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="app-btn-primary"
                        disabled={!canSaveConfig}
                        onClick={() => {
                          setEditingCountryCode("");
                          setCountryDraft(buildCountryDraft({ isEnabled: true }));
                        }}
                      >
                        Add Country
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {(config.countries || []).map((country) => (
                        <div
                          key={country.code}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-base font-semibold text-slate-900">
                                  {country.name}
                                </h5>
                                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                  {country.code}
                                </span>
                                {config.activeCountryCode === country.code ? (
                                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                                    Active
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm text-slate-500">
                                {country.locale} · {country.currencyCode} ({country.currencySymbol}) ·{" "}
                                {country.dialCode}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <CompactActionButton
                                label="Edit"
                                disabled={!canSaveConfig}
                                onClick={() => handleEditCountry(country)}
                              />
                              <CompactActionButton
                                label={country.isEnabled ? "Disable" : "Enable"}
                                disabled={!canSaveConfig}
                                onClick={() => handleToggleCountry(country.code)}
                                tone={country.isEnabled ? "danger" : "success"}
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 md:grid-cols-3">
                            <MiniMetric
                              title="Providers"
                              value={String((country.paymentProviders || []).length)}
                            />
                            <MiniMetric
                              title="Networks"
                              value={String((country.mobileMoneyNetworks || []).length)}
                            />
                            <MiniMetric
                              title="Cards"
                              value={String((country.cardProviders || []).length)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900">
                        {editingCountryCode ? `Edit ${editingCountryCode}` : "Create Country"}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Save the config after editing so admin and web-app country behaviour updates together.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="app-btn-secondary"
                      onClick={() => resetCountryEditor(config.activeCountryCode)}
                    >
                      Reset Editor
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="app-label">Country Code</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={countryDraft.code}
                        onChange={(e) => updateCountryDraftField("code", e.target.value.toUpperCase())}
                        placeholder="ZM"
                      />
                    </div>
                    <div>
                      <label className="app-label">Country Name</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={countryDraft.name}
                        onChange={(e) => updateCountryDraftField("name", e.target.value)}
                        placeholder="Zambia"
                      />
                    </div>
                    <div>
                      <label className="app-label">Locale</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={countryDraft.locale}
                        onChange={(e) => updateCountryDraftField("locale", e.target.value)}
                        placeholder="en-ZM"
                      />
                    </div>
                    <div>
                      <label className="app-label">Dial Code</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={countryDraft.dialCode}
                        onChange={(e) => updateCountryDraftField("dialCode", e.target.value)}
                        placeholder="+260"
                      />
                    </div>
                    <div>
                      <label className="app-label">Currency Code</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={countryDraft.currencyCode}
                        onChange={(e) =>
                          updateCountryDraftField("currencyCode", e.target.value.toUpperCase())
                        }
                        placeholder="ZMW"
                      />
                    </div>
                    <div>
                      <label className="app-label">Currency Symbol</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={countryDraft.currencySymbol}
                        onChange={(e) => updateCountryDraftField("currencySymbol", e.target.value)}
                        placeholder="K"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="app-label">Phone Example</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={countryDraft.phoneExample}
                        onChange={(e) => updateCountryDraftField("phoneExample", e.target.value)}
                        placeholder="0970000000"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        countryDraft.isEnabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                      disabled={!canSaveConfig}
                      onClick={() =>
                        setCountryDraft((current) => ({
                          ...current,
                          isEnabled: !current.isEnabled,
                        }))
                      }
                    >
                      {countryDraft.isEnabled ? "Enabled on save" : "Disabled on save"}
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    <ConfigListEditor
                      title="Payment Providers"
                      items={countryDraft.paymentProviders || []}
                      onAdd={() => addCountryListItem("paymentProviders", buildProviderDraft({}))}
                      onRemove={(index) => removeCountryListItem("paymentProviders", index)}
                      onChange={(index, field, value) =>
                        updateCountryListItem("paymentProviders", index, field, value)
                      }
                      showChannel
                    />

                    <ConfigListEditor
                      title="Mobile Money Networks"
                      items={countryDraft.mobileMoneyNetworks || []}
                      onAdd={() =>
                        addCountryListItem("mobileMoneyNetworks", buildNetworkDraft({}))
                      }
                      onRemove={(index) => removeCountryListItem("mobileMoneyNetworks", index)}
                      onChange={(index, field, value) =>
                        updateCountryListItem("mobileMoneyNetworks", index, field, value)
                      }
                    />

                    <ConfigListEditor
                      title="Card Providers"
                      items={countryDraft.cardProviders || []}
                      onAdd={() => addCountryListItem("cardProviders", buildProviderDraft({ type: "card" }))}
                      onRemove={(index) => removeCountryListItem("cardProviders", index)}
                      onChange={(index, field, value) =>
                        updateCountryListItem("cardProviders", index, field, value)
                      }
                      showChannel
                    />
                  </div>

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      className="app-btn-secondary"
                      onClick={() => resetCountryEditor(config.activeCountryCode)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="app-btn-primary"
                      disabled={!canSaveConfig || !countryDraft.code.trim() || !countryDraft.name.trim()}
                      onClick={handleSaveCountry}
                    >
                      {editingCountryCode ? "Update Country" : "Add Country"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === "repayment" ? (
            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <h4 className="text-base font-semibold text-slate-900">
                  Repayment Controls
                </h4>
                <div className="mt-5 space-y-4">
                  <ToggleRow
                    title="Auto Repayment Posting"
                    description="Automatically post repayments once the repayment flow is confirmed."
                    enabled={config.autoRepaymentPosting}
                    onToggle={() =>
                      updateField("autoRepaymentPosting", !config.autoRepaymentPosting)
                    }
                    disabled={!canManageRepayment}
                    enabledTone="emerald"
                  />

                  <ToggleRow
                    title="Approval Check Before Posting"
                    description="Require the configured gateway approval check before final repayment posting."
                    enabled={config.requireGatewayApprovalCheck}
                    onToggle={() =>
                      updateField(
                        "requireGatewayApprovalCheck",
                        !config.requireGatewayApprovalCheck
                      )
                    }
                    disabled={!canManageRepayment}
                    enabledTone="blue"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <label className="app-label">Operational Notes</label>
                <textarea
                  className="app-input min-h-[220px]"
                  disabled={!canManageRepayment}
                  value={config.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Add notes for repayment fallback, posting rules, or manual handling procedures."
                />
              </div>
            </div>
          ) : null}

          {!loading && activeTab === "gateway" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="app-label">Gateway Provider</label>
                  <select
                    className="app-select"
                    disabled={!canSaveConfig}
                    value={config.gatewayProvider}
                    onChange={(e) => updateField("gatewayProvider", e.target.value)}
                  >
                    {config.implementedChannels.map((channel) => (
                      <option key={channel} value={channel}>
                        {channelLabels[channel] || channel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="app-label">Gateway Account Name</label>
                  <input
                    className="app-input"
                    disabled={!canSaveConfig}
                    value={config.gatewayAccountName}
                    onChange={(e) => updateField("gatewayAccountName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="app-label">Callback URL</label>
                  <input
                    className="app-input"
                    disabled={!canSaveConfig}
                    value={config.callbackUrl}
                    onChange={(e) => updateField("callbackUrl", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="app-label">Settlement Account</label>
                  <input
                    className="app-input"
                    disabled={!canSaveConfig}
                    value={config.settlementAccount}
                    onChange={(e) => updateField("settlementAccount", e.target.value)}
                  />
                </div>
                <div>
                  <label className="app-label">API Key</label>
                  <input
                    className="app-input"
                    disabled={!canSaveConfig}
                    value={config.apiKey}
                    onChange={(e) => updateField("apiKey", e.target.value)}
                  />
                </div>
                <div>
                  <label className="app-label">API Secret</label>
                  <input
                    className="app-input"
                    disabled={!canSaveConfig}
                    value={config.apiSecret}
                    onChange={(e) => updateField("apiSecret", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {!loading && configReady && activeTab === "loan-settings" ? (
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Available Loan Terms</h4>
                    <p className="text-sm text-slate-500">
                      Create, edit, enable, disable, and order the terms shown to customers.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="app-btn-primary"
                    disabled={!canSaveConfig}
                    onClick={openTermModal}
                  >
                    Add Term
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  {sortedLoanTerms.map((term, index) => {
                    const totalFee =
                      Number(term.interestRate || 0) +
                      Number(term.serviceFeeRate || 0) +
                      Number(term.processingFeeRate || 0) +
                      Number(term.commitmentFeeRate || 0);

                    return (
                      <div
                        key={term.key}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"
                      >
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-base font-semibold text-slate-900">
                                  {term.label}
                                </h5>
                                <StatusChip enabled={term.isEnabled} />
                              </div>
                              <p className="mt-1 text-sm text-slate-500">
                                {term.days} day{term.days === 1 ? "" : "s"} term
                              </p>
                            </div>
                            <p className="text-xs text-slate-400">
                              Position {index + 1} in customer apply flow
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <MiniMetric title="Interest" value={`${term.interestRate}%`} />
                            <MiniMetric title="Service" value={`${term.serviceFeeRate}%`} />
                            <MiniMetric title="Processing" value={`${term.processingFeeRate}%`} />
                            <MiniMetric title="Commitment" value={`${term.commitmentFeeRate}%`} />
                            <MiniMetric title="Total Fee" value={`${totalFee}%`} emphasis />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <CompactActionButton
                              label="Move Up"
                              disabled={!canSaveConfig}
                              onClick={() => handleMoveTerm(term.key, -1)}
                            />
                            <CompactActionButton
                              label="Move Down"
                              disabled={!canSaveConfig}
                              onClick={() => handleMoveTerm(term.key, 1)}
                            />
                            <CompactActionButton
                              label="Edit"
                              disabled={!canSaveConfig}
                              onClick={() => handleEditTerm(term)}
                            />
                            <CompactActionButton
                              label={term.isEnabled ? "Disable" : "Enable"}
                              disabled={!canSaveConfig}
                              onClick={() => handleToggleTerm(term.key)}
                              tone={term.isEnabled ? "danger" : "success"}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Loan Levels</h4>
                    <p className="text-sm text-slate-500">
                      Define the amount range for each level. Admin can still manually upgrade or downgrade a customer.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="app-btn-primary"
                    disabled={!canSaveConfig}
                    onClick={openLevelModal}
                  >
                    Add Level
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {sortedLoanLevels.map((item) => (
                    <div
                      key={`level-${item.level}`}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-base font-semibold text-slate-900">
                                {item.label}
                              </h5>
                              <StatusChip enabled={item.isEnabled} />
                            </div>
                            <p className="mt-1 text-sm text-slate-500">Level {item.level}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <MiniMetric title="Min Amount" value={`GHS ${item.minAmount}`} />
                          <MiniMetric title="Max Amount" value={`GHS ${item.maxAmount}`} emphasis />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <CompactActionButton
                            label="Edit"
                            disabled={!canSaveConfig}
                            onClick={() => handleEditLevel(item)}
                          />
                          <CompactActionButton
                            label={item.isEnabled ? "Disable" : "Enable"}
                            disabled={!canSaveConfig}
                            onClick={() => handleToggleLevel(item.level)}
                            tone={item.isEnabled ? "danger" : "success"}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">
                      Extension and Repayment Rules
                    </h4>
                    <p className="text-sm text-slate-500">
                      Control extension periods, fee percentages, overdue penalty, and the repayment methods visible to customers.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="app-btn-primary"
                    disabled={!canSaveConfig}
                    onClick={openExtensionModal}
                  >
                    Add Extension
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                    <label className="app-label">Overdue Penalty % Per Day</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="app-input"
                      disabled={!canSaveConfig}
                      value={config.overduePenaltyRate}
                      onChange={(e) => updateField("overduePenaltyRate", Number(e.target.value))}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                    <p className="app-label">Partial Repayment</p>
                    <button
                      type="button"
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        config.allowPartialRepayment
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                      disabled={!canSaveConfig}
                      onClick={() =>
                        updateField("allowPartialRepayment", !config.allowPartialRepayment)
                      }
                    >
                      {config.allowPartialRepayment ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h5 className="text-base font-semibold text-slate-900">Repayment Methods</h5>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {(config.repaymentOptions || []).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        disabled={!canSaveConfig}
                        onClick={() =>
                          updateField(
                            "repaymentOptions",
                            (config.repaymentOptions || []).map((option) =>
                              option.key === item.key
                                ? { ...option, isEnabled: !option.isEnabled }
                                : option
                            )
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          item.isEnabled
                            ? "border-blue-600 bg-blue-50 shadow-soft"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-slate-900">{item.label}</strong>
                          <StatusChip enabled={item.isEnabled} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {sortedExtensions.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft"
                    >
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-base font-semibold text-slate-900">
                                {item.label}
                              </h5>
                              <StatusChip enabled={item.isEnabled} />
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {item.days} days extension
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <MiniMetric title="Days" value={String(item.days)} />
                          <MiniMetric title="Fee %" value={`${item.feeRate}%`} emphasis />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <CompactActionButton
                            label="Edit"
                            disabled={!canSaveConfig}
                            onClick={() => handleEditExtension(item)}
                          />
                          <CompactActionButton
                            label={item.isEnabled ? "Disable" : "Enable"}
                            disabled={!canSaveConfig}
                            onClick={() => handleToggleExtension(item.key)}
                            tone={item.isEnabled ? "danger" : "success"}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {!loading && activeTab === "content" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h4 className="text-base font-semibold text-slate-900">
                    Shared Branding
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    These values are shared by the admin footer/sidebar and the customer web app.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="app-label">App Name</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.portalContent?.appName || ""}
                        onChange={(e) =>
                          updatePortalContentField("appName", e.target.value)
                        }
                        placeholder="Pathway Loans"
                      />
                    </div>
                    <div>
                      <label className="app-label">Logo URL</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.portalContent?.logoUrl || ""}
                        onChange={(e) =>
                          updatePortalContentField("logoUrl", e.target.value)
                        }
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div>
                      <label className="app-label">Tagline</label>
                      <textarea
                        className="app-input min-h-[110px]"
                        disabled={!canSaveConfig}
                        value={config.portalContent?.tagline || ""}
                        onChange={(e) =>
                          updatePortalContentField("tagline", e.target.value)
                        }
                        placeholder="Fast customer login, application tracking, and identity verification."
                      />
                    </div>
                    <div>
                      <label className="app-label">Footer Text</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.portalContent?.footerText || ""}
                        onChange={(e) =>
                          updatePortalContentField("footerText", e.target.value)
                        }
                        placeholder="All rights reserved."
                      />
                    </div>
                    <div>
                      <label className="app-label">Footer Version</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.portalContent?.footerVersion || ""}
                        onChange={(e) =>
                          updatePortalContentField("footerVersion", e.target.value)
                        }
                        placeholder="1.5.0"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h4 className="text-base font-semibold text-slate-900">
                    Support Contacts
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    These values appear in the customer app support section.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="app-label">Phone Number</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.portalContent?.supportPhone || ""}
                        onChange={(e) =>
                          updatePortalContentField("supportPhone", e.target.value)
                        }
                        placeholder="+260 000 000 000"
                      />
                    </div>
                    <div>
                      <label className="app-label">Email Address</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.portalContent?.supportEmail || ""}
                        onChange={(e) =>
                          updatePortalContentField("supportEmail", e.target.value)
                        }
                        placeholder="customer@cedilending.com"
                      />
                    </div>
                    <div>
                      <label className="app-label">WhatsApp Number</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.portalContent?.supportWhatsapp || ""}
                        onChange={(e) =>
                          updatePortalContentField("supportWhatsapp", e.target.value)
                        }
                        placeholder="+260 000 000 000"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h4 className="text-base font-semibold text-slate-900">
                    Authentication Verification
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Switch the customer app between sandbox demo OTP and real Firebase phone verification.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      disabled={!canSaveConfig}
                      onClick={() => updateAuthVerificationField("otpMode", "demo")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        otpMode === "demo"
                          ? "border-blue-500 bg-blue-50 shadow-soft"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">Demo OTP</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Keep sandbox testing active and show the OTP in the customer message banner.
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={!canSaveConfig}
                      onClick={() => updateAuthVerificationField("otpMode", "real")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        otpMode === "real"
                          ? "border-emerald-500 bg-emerald-50 shadow-soft"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">Real Firebase OTP</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Send real SMS verification through Firebase Phone Auth before PIN setup or reset.
                      </p>
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <MiniMetric
                      title="Current Mode"
                      value={otpMode === "real" ? "Real Firebase" : "Demo"}
                      emphasis={otpMode === "real"}
                    />
                    <MiniMetric
                      title="Firebase Config"
                      value={firebaseConfigured ? "Ready" : "Incomplete"}
                      emphasis={firebaseConfigured}
                    />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="app-label">Firebase API Key</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.authVerification?.firebaseWebConfig?.apiKey || ""}
                        onChange={(e) =>
                          updateFirebaseWebConfigField("apiKey", e.target.value)
                        }
                        placeholder="AIza..."
                      />
                    </div>
                    <div>
                      <label className="app-label">Auth Domain</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.authVerification?.firebaseWebConfig?.authDomain || ""}
                        onChange={(e) =>
                          updateFirebaseWebConfigField("authDomain", e.target.value)
                        }
                        placeholder="project.firebaseapp.com"
                      />
                    </div>
                    <div>
                      <label className="app-label">Project ID</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.authVerification?.firebaseWebConfig?.projectId || ""}
                        onChange={(e) =>
                          updateFirebaseWebConfigField("projectId", e.target.value)
                        }
                        placeholder="loan-d61b8"
                      />
                    </div>
                    <div>
                      <label className="app-label">App ID</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.authVerification?.firebaseWebConfig?.appId || ""}
                        onChange={(e) =>
                          updateFirebaseWebConfigField("appId", e.target.value)
                        }
                        placeholder="1:xxxx:web:xxxx"
                      />
                    </div>
                    <div>
                      <label className="app-label">Messaging Sender ID</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={
                          config.authVerification?.firebaseWebConfig?.messagingSenderId || ""
                        }
                        onChange={(e) =>
                          updateFirebaseWebConfigField("messagingSenderId", e.target.value)
                        }
                        placeholder="684116041224"
                      />
                    </div>
                    <div>
                      <label className="app-label">Storage Bucket</label>
                      <input
                        className="app-input"
                        disabled={!canSaveConfig}
                        value={config.authVerification?.firebaseWebConfig?.storageBucket || ""}
                        onChange={(e) =>
                          updateFirebaseWebConfigField("storageBucket", e.target.value)
                        }
                        placeholder="loan-d61b8.firebasestorage.app"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h4 className="text-base font-semibold text-slate-900">
                    Content Summary
                  </h4>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <MiniMetric
                      title="Brand Name"
                      value={config.portalContent?.appName || "Not set"}
                    />
                    <MiniMetric title="FAQs" value={String(totalFaqs)} />
                    <MiniMetric title="Tutorial Lines" value={String(totalTutorials)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <label className="app-label">FAQs</label>
                  <textarea
                    className="app-input min-h-[200px]"
                    disabled={!canSaveConfig}
                    value={listToMultiline(config.portalContent?.faqs)}
                    onChange={(e) =>
                      updatePortalContentField("faqs", multilineToList(e.target.value))
                    }
                    placeholder="One FAQ per line"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Enter one FAQ per line.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <label className="app-label">Repayment Tutorials</label>
                  <textarea
                    className="app-input min-h-[220px]"
                    disabled={!canSaveConfig}
                    value={listToMultiline(config.portalContent?.repaymentTutorials)}
                    onChange={(e) =>
                      updatePortalContentField(
                        "repaymentTutorials",
                        multilineToList(e.target.value)
                      )
                    }
                    placeholder="One tutorial or guide step per line"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Enter one repayment or application guide line per row.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <i className="fa fa-wallet text-2xl text-emerald-600" />
          <p className="mt-4 text-sm text-slate-500">Primary Gateway</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {channelLabels[config.gatewayProvider] || "Not set"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <i className="fa fa-random text-2xl text-blue-600" />
          <p className="mt-4 text-sm text-slate-500">Active Channel</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {channelLabels[config.activeChannel] || "Not set"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <i className="fa fa-check-circle text-2xl text-amber-500" />
          <p className="mt-4 text-sm text-slate-500">Enabled Loan Terms</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {enabledLoanTerms.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <i className="fa fa-globe text-2xl text-indigo-600" />
          <p className="mt-4 text-sm text-slate-500">Active Country</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {activeCountry?.name || "Not set"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <i className="fa fa-check-circle text-2xl text-blue-600" />
          <p className="mt-4 text-sm text-slate-500">Enabled Loan Levels</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {enabledLoanLevels.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <i className="fa fa-check-circle text-2xl text-blue-600" />
          <p className="mt-4 text-sm text-slate-500">Portal FAQs</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{totalFaqs}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
          <i className="fa fa-check-circle text-2xl text-emerald-600" />
          <p className="mt-4 text-sm text-slate-500">Repayment Methods</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {enabledRepaymentOptions.length}
          </p>
        </div>
      </section>

      <SettingsModal
        open={loanSettingsModal === "term"}
        title={editingTermKey ? "Edit Loan Term" : "Create Loan Term"}
        description="Save the draft config after updating terms so changes reflect in the customer app."
        onClose={closeLoanSettingsModal}
      >
        <div className="space-y-4">
          <div>
            <label className="app-label">Term Name</label>
            <input
              className="app-input"
              disabled={!canSaveConfig}
              value={termDraft.label}
              onChange={(e) =>
                setTermDraft((current) => ({ ...current, label: e.target.value }))
              }
              placeholder="7 Days"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="app-label">Days</label>
              <input
                type="number"
                min="1"
                className="app-input"
                disabled={!canSaveConfig}
                value={termDraft.days}
                onChange={(e) =>
                  setTermDraft((current) => ({ ...current, days: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  termDraft.isEnabled
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-700"
                }`}
                disabled={!canSaveConfig}
                onClick={() =>
                  setTermDraft((current) => ({
                    ...current,
                    isEnabled: !current.isEnabled,
                  }))
                }
              >
                {termDraft.isEnabled ? "Enabled on save" : "Disabled on save"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="app-label">Interest Rate %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="app-input"
                disabled={!canSaveConfig}
                value={termDraft.interestRate}
                onChange={(e) =>
                  setTermDraft((current) => ({
                    ...current,
                    interestRate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="app-label">Service Fee %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="app-input"
                disabled={!canSaveConfig}
                value={termDraft.serviceFeeRate}
                onChange={(e) =>
                  setTermDraft((current) => ({
                    ...current,
                    serviceFeeRate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="app-label">Processing Fee %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="app-input"
                disabled={!canSaveConfig}
                value={termDraft.processingFeeRate}
                onChange={(e) =>
                  setTermDraft((current) => ({
                    ...current,
                    processingFeeRate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="app-label">Commitment Fee %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="app-input"
                disabled={!canSaveConfig}
                value={termDraft.commitmentFeeRate}
                onChange={(e) =>
                  setTermDraft((current) => ({
                    ...current,
                    commitmentFeeRate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="app-btn-secondary" onClick={closeLoanSettingsModal}>
              Cancel
            </button>
            <button
              type="button"
              className="app-btn-primary"
              disabled={!canSaveConfig || !termDraft.label.trim() || !termDraft.days}
              onClick={handleSaveTerm}
            >
              {editingTermKey ? "Update Term" : "Add Term"}
            </button>
          </div>
        </div>
      </SettingsModal>

      <SettingsModal
        open={loanSettingsModal === "level"}
        title={editingLevel ? "Edit Loan Level" : "Create Loan Level"}
        description="Levels control the customer amount range shown in the web app."
        onClose={closeLoanSettingsModal}
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="app-label">Level Number</label>
              <input
                type="number"
                min="1"
                className="app-input"
                disabled={!canSaveConfig || Boolean(editingLevel)}
                value={levelDraft.level}
                onChange={(e) =>
                  setLevelDraft((current) => ({
                    ...current,
                    level: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  levelDraft.isEnabled
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-700"
                }`}
                disabled={!canSaveConfig}
                onClick={() =>
                  setLevelDraft((current) => ({
                    ...current,
                    isEnabled: !current.isEnabled,
                  }))
                }
              >
                {levelDraft.isEnabled ? "Enabled on save" : "Disabled on save"}
              </button>
            </div>
          </div>

          <div>
            <label className="app-label">Level Label</label>
            <input
              className="app-input"
              disabled={!canSaveConfig}
              value={levelDraft.label}
              onChange={(e) =>
                setLevelDraft((current) => ({
                  ...current,
                  label: e.target.value,
                }))
              }
              placeholder="Starter Level"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="app-label">Minimum Amount</label>
              <input
                type="number"
                min="0"
                step="1"
                className="app-input"
                disabled={!canSaveConfig}
                value={levelDraft.minAmount}
                onChange={(e) =>
                  setLevelDraft((current) => ({
                    ...current,
                    minAmount: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="app-label">Maximum Amount</label>
              <input
                type="number"
                min="0"
                step="1"
                className="app-input"
                disabled={!canSaveConfig}
                value={levelDraft.maxAmount}
                onChange={(e) =>
                  setLevelDraft((current) => ({
                    ...current,
                    maxAmount: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="app-btn-secondary" onClick={closeLoanSettingsModal}>
              Cancel
            </button>
            <button
              type="button"
              className="app-btn-primary"
              disabled={!canSaveConfig || !levelDraft.level}
              onClick={handleSaveLevel}
            >
              {editingLevel ? "Update Level" : "Add Level"}
            </button>
          </div>
        </div>
      </SettingsModal>

      <SettingsModal
        open={loanSettingsModal === "extension"}
        title={editingExtensionKey ? "Edit Extension Period" : "Create Extension Period"}
        description="Customers can only extend on or before due date, using the enabled periods below."
        onClose={closeLoanSettingsModal}
      >
        <div className="space-y-4">
          <div>
            <label className="app-label">Extension Label</label>
            <input
              className="app-input"
              disabled={!canSaveConfig}
              value={extensionDraft.label}
              onChange={(e) =>
                setExtensionDraft((current) => ({
                  ...current,
                  label: e.target.value,
                }))
              }
              placeholder="7 Days"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="app-label">Days</label>
              <input
                type="number"
                min="1"
                className="app-input"
                disabled={!canSaveConfig}
                value={extensionDraft.days}
                onChange={(e) =>
                  setExtensionDraft((current) => ({
                    ...current,
                    days: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="app-label">Fee Rate %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="app-input"
                disabled={!canSaveConfig}
                value={extensionDraft.feeRate}
                onChange={(e) =>
                  setExtensionDraft((current) => ({
                    ...current,
                    feeRate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <button
            type="button"
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              extensionDraft.isEnabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-700"
            }`}
            disabled={!canSaveConfig}
            onClick={() =>
              setExtensionDraft((current) => ({
                ...current,
                isEnabled: !current.isEnabled,
              }))
            }
          >
            {extensionDraft.isEnabled ? "Enabled on save" : "Disabled on save"}
          </button>

          <div className="flex justify-end gap-3">
            <button type="button" className="app-btn-secondary" onClick={closeLoanSettingsModal}>
              Cancel
            </button>
            <button
              type="button"
              className="app-btn-primary"
              disabled={!canSaveConfig || !extensionDraft.days}
              onClick={handleSaveExtension}
            >
              {editingExtensionKey ? "Update Extension" : "Add Extension"}
            </button>
          </div>
        </div>
      </SettingsModal>
    </div>
  );
}

function StatCard({ title, value, valueClassName = "", compact = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p
        className={`mt-2 font-semibold text-slate-900 ${
          compact ? "text-sm" : "text-xl"
        } ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function ToggleInfoCard({
  title,
  description,
  label,
  detail,
  enabled,
  onToggle,
  disabled,
  enabledTone,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
        <ToggleButton
          enabled={enabled}
          disabled={disabled}
          onClick={onToggle}
          enabledTone={enabledTone}
        />
      </div>
    </div>
  );
}

function ToggleRow({ title, description, enabled, onToggle, disabled, enabledTone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <ToggleButton
          enabled={enabled}
          disabled={disabled}
          onClick={onToggle}
          enabledTone={enabledTone}
        />
      </div>
    </div>
  );
}

function ToggleButton({ enabled, disabled, onClick, enabledTone = "blue" }) {
  const toneClassName =
    enabledTone === "emerald" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        enabled ? toneClassName : "bg-slate-200 text-slate-700"
      }`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </button>
  );
}

function StatusChip({ enabled }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
      }`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

function CompactActionButton({ label, disabled, onClick, tone = "default" }) {
  const toneClassName =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
      : tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300";

  return (
    <button
      type="button"
      className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${toneClassName}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function MiniMetric({ title, value, emphasis = false }) {
  return (
    <div
      className={`min-w-[120px] rounded-2xl border px-3 py-2.5 ${
        emphasis ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <p className="mt-1.5 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SettingsModal({ open, title, description, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <button type="button" className="app-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function ConfigListEditor({
  title,
  items,
  onAdd,
  onRemove,
  onChange,
  showChannel = false,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h5 className="text-sm font-semibold text-slate-900">{title}</h5>
          <p className="mt-1 text-xs text-slate-500">
            Edit the visible provider and network options for this country.
          </p>
        </div>
        <button type="button" className="app-btn-primary" onClick={onAdd}>
          Add
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className={`grid gap-3 ${showChannel ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
              <input
                className="app-input"
                value={item.label}
                onChange={(e) => onChange(index, "label", e.target.value)}
                placeholder="Label"
              />
              <input
                className="app-input"
                value={item.key}
                onChange={(e) => onChange(index, "key", e.target.value)}
                placeholder="Key"
              />
              <input
                className="app-input"
                value={item.type}
                onChange={(e) => onChange(index, "type", e.target.value)}
                placeholder="Type"
              />
              {showChannel ? (
                <input
                  className="app-input"
                  value={item.channel || ""}
                  onChange={(e) => onChange(index, "channel", e.target.value)}
                  placeholder="Channel"
                />
              ) : null}
              <button
                type="button"
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  item.isEnabled
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-700"
                }`}
                onClick={() => onChange(index, "isEnabled", !item.isEnabled)}
              >
                {item.isEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                onClick={() => onRemove(index)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
            No items added yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
