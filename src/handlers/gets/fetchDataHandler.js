import { dataBaseUrl } from "../../libs/endpoints";

const ADMIN_BOOTSTRAP_TIMEOUT_MS = 20000;

const _fetchDataHandler = async (id) => {
  const url = dataBaseUrl + "getData/" + id;

  let resp = {};
  let timeoutId = null;
  try {
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    timeoutId = controller
      ? window.setTimeout(() => controller.abort(), ADMIN_BOOTSTRAP_TIMEOUT_MS)
      : null;
    const reqs = await fetch(url, controller ? { signal: controller.signal } : undefined);
    resp = await reqs.json();
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message:
        error?.name === "AbortError"
          ? "Loading admin data took too long. Please refresh and try again."
          : "Something went wrong, please please check your internet connection!",
    };
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }

  return resp;
};

export default _fetchDataHandler;
