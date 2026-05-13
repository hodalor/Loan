import { adminBaseUrl } from "../../libs/endpoints";

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, value);
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

const _getSystemLogs = async (path = "system-logs", filters = {}) => {
  try {
    const reqs = await fetch(`${adminBaseUrl}${path}${buildQuery(filters)}`);
    return await reqs.json();
  } catch (error) {
    console.log(error);
    return {
      success: 0,
      message: "Could not load system logs right now.",
    };
  }
};

export const recoverPortalPayment = async (reference = "") => {
  try {
    const reqs = await fetch(`${adminBaseUrl}system-logs/portal-recover`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reference }),
    });
    return await reqs.json();
  } catch (error) {
    console.log(error);
    return {
      success: 0,
      message: "Could not run the portal payment recovery right now.",
    };
  }
};

export default _getSystemLogs;
