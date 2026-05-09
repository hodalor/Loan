const fetch = require("node-fetch");

const _payment = async (data) => {
  let response = await fetch(data.payUrl, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: data.myToken,
    },
    body: JSON.stringify({
      amount: data.payAmount,
      account_name: data.accountName,
      account_number: data.paymentMethod,
      account_issuer: data.ntwrkOperator,
      description: data.type,
      callbackUrl: "https://peoplepay.com.gh/peoplepay/hub/test",
    }),
  });

  let responseData = await response.json();

  return responseData;
};

module.exports = _payment;
