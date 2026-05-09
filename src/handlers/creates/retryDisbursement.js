import { dataBaseUrl } from "../../libs/endpoints";

const _retryDisbursement = async ({ loanId, channel }) => {
  let resp = {};

  try {
    const request = await fetch(`${dataBaseUrl}retry-disbursement/${loanId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel }),
    });

    resp = await request.json();
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message: "Could not retry the disbursement.",
    };
  }

  return resp;
};

export default _retryDisbursement;
