const fetch = require("node-fetch");

const _verifyTransaction = async (data) => {
  let respData = await fetch(data.veriUrl + data.id, {
    method: "GET",
    headers: {
      "Content-type": "application/json",
      Authorization: data.myToken,
    },
  });

  let response = await respData.json();

  console.log(response);

  return response.status;
};

module.exports = _verifyTransaction;
