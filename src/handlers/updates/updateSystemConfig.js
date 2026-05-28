import { adminBaseUrl } from "../../libs/endpoints";
import getAuditActor from "../utils/auditActor";

const _updateSystemConfig = async (data) => {
  let resp = {};

  try {
    const { homeBannerImageFile, ...configPayload } = data || {};
    const formData = new FormData();
    formData.append(
      "config",
      JSON.stringify({
        ...configPayload,
      })
    );
    formData.append("auditActor", JSON.stringify(getAuditActor()));
    if (homeBannerImageFile instanceof File) {
      formData.append("homeBannerImage", homeBannerImageFile);
    }

    const request = await fetch(`${adminBaseUrl}system-config`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
      },
      body: formData,
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
