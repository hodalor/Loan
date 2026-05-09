import { adminBaseUrl } from "../../libs/endpoints";

const _fetchUser = async (userId) => {
  let url = adminBaseUrl + "getAdmin/" + userId;

  let resp = {};
  try {
    let reqs = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
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

export default _fetchUser;
