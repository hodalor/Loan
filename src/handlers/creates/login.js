import { adminBaseUrl } from "../../libs/endpoints";

const _handleLogin = async (data) => {
  let url = adminBaseUrl + "login";

  let resp = {};
  try {
    let reqs = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const contentType = reqs.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      let res = await reqs.json();
      resp = res;
    } else {
      const textResponse = await reqs.text();

      resp = {
        success: 0,
        message: reqs.ok
          ? "Login failed. The server returned an unexpected response."
          : reqs.status === 503
          ? "Login service is unavailable right now. The API is suspended or offline."
          : `Login failed with status ${reqs.status}.`,
        details: textResponse,
      };
    }

    if (!reqs.ok && !resp.message) {
      resp = {
        success: 0,
        message: `Login failed with status ${reqs.status}.`,
      };
    }
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message:
        "Cannot reach the login server. Check the API URL or your internet connection.",
    };
  }

  return resp;
};

export default _handleLogin;
