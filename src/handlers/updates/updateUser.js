import { adminBaseUrl } from "../../libs/endpoints";

const _updateUser = async (data) => {
  let url = adminBaseUrl + "updateAdmin/" + data.userName;

  let resp = {};
  try {
    let reqs = await fetch(url, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
      body: JSON.stringify(data),
    });

    let res = await reqs.json();

    resp = res;
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

export default _updateUser;
