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

export const getFundRequests = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, value);
  });

  const query = params.toString();
  return request(`fund-requests${query ? `?${query}` : ""}`, {
    method: "GET",
  });
};

export const createFundRequest = async (payload = {}) =>
  request("fund-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createFundBatch = async (payload = {}) =>
  request("fund-requests/batch", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const decideFundRequests = async (payload = {}) =>
  request("fund-requests/decision", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const resendFundRequest = async (id, payload = {}) =>
  request(`fund-requests/${id}/resend`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const cancelFundRequest = async (id, payload = {}) =>
  request(`fund-requests/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
