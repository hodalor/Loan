import { dataBaseUrl } from "../../libs/endpoints";

const _createClearPublic = async (data) => {
  let url = dataBaseUrl + "clearCasePublic/" + data.ID;

  var formData = new FormData();

  formData.append("proof1", data.selfieData);
  formData.append("data", JSON.stringify(data.data));

  let resp = {};
  try {
    let reqs = await fetch(url, {
      method: "PATCH",
      body: formData,
    });

    let res = await reqs.json();

    resp = res;
  } catch (error) {
    resp = {
      success: 0,
      message:
        "Something went wrong, check your internet connection!",
    };
  }

  return resp;
};

export default _createClearPublic;
