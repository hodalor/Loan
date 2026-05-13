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
      if (!reqs.ok) {
        resp = {
          ...res,
          success: 0,
          message: "Login failed. Try later.",
        };
      }
    } else {
      const textResponse = await reqs.text();

      resp = {
        success: 0,
        message: "Login failed. Try later.",
        details: textResponse,
      };
    }

    if (!reqs.ok && !resp.message) {
      resp = {
        success: 0,
        message: "Login failed. Try later.",
      };
    }
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message: "Login failed. Try later.",
    };
  }

  return resp;
};

export default _handleLogin;
