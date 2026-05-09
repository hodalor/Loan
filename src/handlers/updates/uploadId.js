import { usersBaseUrl } from "../../libs/endpoints";

const _updateIDCard = async (data) => {
  let url = usersBaseUrl + "updateId/" + data.userId;

  let resp = {};
  try {
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
