import { usersBaseUrl } from "../../libs/endpoints";

const _getCustomerById = async (id) => {
  const url = usersBaseUrl + "findUser/" + id;

  let resp = {};
  try {
    const request = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-type": "application/json",
      },
    });

    resp = await request.json();
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message: "Something went wrong, please please check your internet connection!",
    };
  }

  return resp;
};

export default _getCustomerById;
