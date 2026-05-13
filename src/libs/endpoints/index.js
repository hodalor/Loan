const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const isLocalHost = () => {
  if (typeof window === "undefined") return false;

  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
};

const hostedApiBaseUrl = "https://loan-htqt.onrender.com";
const configuredApiBaseUrl =
  process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_BASE_URL;
const defaultApiBaseUrl = isLocalHost() ? "http://localhost:9000" : hostedApiBaseUrl;

const apiBaseUrl = trimTrailingSlash(
  configuredApiBaseUrl || defaultApiBaseUrl
);

const dataBaseUrl = `${apiBaseUrl}/loans/`;
const adminBaseUrl = `${apiBaseUrl}/admin/`;
const usersBaseUrl = `${apiBaseUrl}/users/`;

module.exports = { apiBaseUrl, dataBaseUrl, adminBaseUrl, usersBaseUrl };
