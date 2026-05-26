import { usersBaseUrl } from "../../libs/endpoints";
import getAuditActor from "../utils/auditActor";

const _updateIDCard = async (data) => {
  let url = usersBaseUrl + "updateId/" + data.userId;

  let resp = {};
  try {
    const actor = getAuditActor();
    if (actor.userId && !data.formData.has("auditActorUserId")) {
      data.formData.append("auditActorUserId", actor.userId);
    }
    if (actor.userName && !data.formData.has("auditActorUserName")) {
      data.formData.append("auditActorUserName", actor.userName);
    }
    if (actor.role && !data.formData.has("auditActorRole")) {
      data.formData.append("auditActorRole", actor.role);
    }

    let reqs = await fetch(url, {
      method: "PATCH",
      body: data.formData,
    });

    let res = await reqs.json();

    resp = res;
  } catch (error) {
    resp = {
      success: 0,
      message: "Something went wrong, please check your internet connection!",
    };
  }

  return resp;
};

export default _updateIDCard;
