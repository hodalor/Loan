import { adminBaseUrl } from "../../libs/endpoints";

const _getSystemConfig = async () => {
  let resp = {};

  try {
    const request = await fetch(`${adminBaseUrl}system-config`);
    resp = await request.json();
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message: "Could not load system configuration.",
    };
  }

  return resp;
};

export default _getSystemConfig;
