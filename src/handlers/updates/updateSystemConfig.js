import { adminBaseUrl } from "../../libs/endpoints";
import getAuditActor from "../utils/auditActor";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read banner image."));
    reader.readAsDataURL(file);
  });

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

    if (
      homeBannerImageFile instanceof File &&
      (!resp?.success ||
        !resp?.data?.portalContent?.homeBannerImageUrl)
    ) {
      const fallbackBannerDataUrl = await readFileAsDataUrl(homeBannerImageFile);
      const fallbackRequest = await fetch(`${adminBaseUrl}system-config`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...configPayload,
          portalContent: {
            ...(configPayload.portalContent || {}),
            homeBannerImageUrl: fallbackBannerDataUrl,
          },
          auditActor: getAuditActor(),
        }),
      });

      resp = await fallbackRequest.json();
    }
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
