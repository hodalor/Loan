const CUSTOMER_API_BASE =
  process.env.REACT_APP_CUSTOMER_AUTH_BASEURL || "http://localhost:9000/users";

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
