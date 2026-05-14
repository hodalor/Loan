import { usersBaseUrl } from "../../libs/endpoints";

const _updateCustomerPaymentOperator = async ({ userId, method, operator }) => {
  let resp = {};

  try {
    const request = await fetch(`${usersBaseUrl}payment-operator/${userId}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ method, operator }),
    });

    resp = await request.json();
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message: "Could not update the mobile money operator.",
    };
  }

  return resp;
};

export default _updateCustomerPaymentOperator;
