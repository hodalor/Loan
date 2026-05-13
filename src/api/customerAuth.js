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

const request = async (path, payload) => {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: 0,
      message: "Unable to reach customer auth service.",
    };
  }
};

export const requestCustomerOtp = (payload) =>
  request("/auth/request-otp", payload);

export const verifyCustomerOtp = (payload) =>
  request("/auth/verify-otp", payload);

export const setCustomerPin = (payload) => request("/auth/set-pin", payload);

export const loginCustomer = (payload) => request("/auth/login", payload);
