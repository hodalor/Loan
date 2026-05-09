import { adminBaseUrl } from "../../libs/endpoints";

const _updateSystemConfig = async (data) => {
  let resp = {};

  try {
    const request = await fetch(`${adminBaseUrl}system-config`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    resp = await request.json();
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message: "Could not update system configuration.",
    };
  }

  return resp;
};

export default _updateSystemConfig;
