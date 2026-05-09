import { dataBaseUrl } from "../../libs/endpoints";

const _createCollCallRecord = async (data) => {
  let url = dataBaseUrl + "colCallRecord/" + data.ID;

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
    resp = {
      success: 0,
      message:
        "Something went wrong, please please check your internet connection!",
    };
  }

  return resp;
};

export default _createCollCallRecord;
