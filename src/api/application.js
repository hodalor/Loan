const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");
const isLocalHost = () => {
  if (typeof window === "undefined") return false;

  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
};
const normalizeCustomerApiBase = (value = "") => {
  const trimmed = trimTrailingSlash(value);
  return /\/users$/i.test(trimmed) ? trimmed : `${trimmed}/users`;
};
const hostedCustomerApiBase = "https://loan-htqt.onrender.com/users";
const configuredCustomerApiBase =
  process.env.REACT_APP_CUSTOMER_AUTH_BASEURL ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_BASE_URL;
const CUSTOMER_API_BASE = normalizeCustomerApiBase(
  configuredCustomerApiBase ||
    (isLocalHost() ? "http://localhost:9000/users" : hostedCustomerApiBase)
);

export const saveApplicationDraft = async (payload) => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/application/save-draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to save application draft.",
    };
  }
};

export const submitApplicationProfile = async ({ phone, application, countryCode, files }) => {
  try {
    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("application", JSON.stringify(application));
    if (countryCode) {
      formData.append("countryCode", countryCode);
    }

    if (files?.frontPhoto instanceof File) {
      formData.append("frontPhoto", files.frontPhoto);
    }

    if (files?.backPhoto instanceof File) {
      formData.append("backPhoto", files.backPhoto);
    }

    if (files?.selfiePhoto instanceof File) {
      formData.append("selfiePhoto", files.selfiePhoto);
    }

    const response = await fetch(`${CUSTOMER_API_BASE}/application/submit-profile`, {
      method: "POST",
      body: formData,
    });

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to submit customer profile.",
    };
  }
};

export const fetchPortalSummary = async (phone) => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/portal/summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to load customer portal data.",
    };
  }
};

export const fetchPortalContent = async () => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/portal/content`);

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to load customer portal content.",
    };
  }
};

export const fetchRepaymentSummary = async (payload) => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/portal/repayment-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to load repayment summary.",
    };
  }
};

export const fetchExtensionSummary = async (payload) => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/portal/extension-summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to load extension summary.",
    };
  }
};

export const payCustomerLoan = async (payload) => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/portal/pay-loan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to process repayment.",
    };
  }
};

export const extendCustomerLoan = async (payload) => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/portal/extend-loan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to process loan extension.",
    };
  }
};

export const verifyPaystackPortalTransaction = async (payload) => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/portal/gateway/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to verify the gateway transaction.",
    };
  }
};

export const applyCustomerLoan = async (payload) => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/portal/apply-loan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "Unable to submit loan application.",
    };
  }
};
