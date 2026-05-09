import { dataBaseUrl } from "../../libs/endpoints";

const _confirmClearPublic = async (data) => {
  let url = dataBaseUrl + "confirmClearCaseP/" + data.ID;

  var formData = new FormData();

  formData.append("proof2", data.selfieData);
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
        "Something went wrong, please please check your internet connection!",
    };
  }

  return resp;
};

export default _confirmClearPublic;
