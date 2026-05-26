import { adminBaseUrl } from "../../libs/endpoints";
import getAuditActor from "../utils/auditActor";

const _createStaffGroup = async (data) => {
  let resp = {};
  try {
    const reqs = await fetch(`${adminBaseUrl}staff-groups`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        auditActor: getAuditActor(),
      }),
    });

    resp = await reqs.json();
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message:
        "Something went wrong, please please check your internet connection!",
    };
  }

  return resp;
};

export default _createStaffGroup;
