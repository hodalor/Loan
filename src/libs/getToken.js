const fetch = require("node-fetch");

const _getToken = async (data) => {
  let tokenData = await fetch(data.tokenUrl, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      apikey: data.myApiKey,
      merchantId: data.merchantId,
    }),
  });

  let parseData = await tokenData.json();

  return parseData.data;
};

module.exports = _getToken;
