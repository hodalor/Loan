import { adminBaseUrl } from "../libs/endpoints";

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return {
      success: 0,
      message: "The server returned an invalid response.",
    };
  }
};

const request = async (path, options = {}) => {
  try {
    const response = await fetch(`${adminBaseUrl}${path}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      ...options,
    });

    return parseJson(response);
  } catch (error) {
    console.log(error);
    return {
      success: 0,
      message: "Something went wrong. Please check your internet connection.",
    };
  }
};

export const getPortalPayments = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, value);
  });

  const query = params.toString();
  return request(`portal-payments${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

export const restorePortalPayment = async (reference = "") =>
  request(`portal-payments/${encodeURIComponent(reference)}/restore`, {
    method: "POST",
    body: JSON.stringify({ reference }),
  });

export const backfillPortalPayment = async (reference = "") =>
  request(`portal-payments/${encodeURIComponent(reference)}/backfill`, {
    method: "POST",
    body: JSON.stringify({ reference }),
  });
