import { dataBaseUrl } from "../../libs/endpoints";

const _markManualDisbursement = async (loanIds = []) => {
  let resp = {};

  try {
    const request = await fetch(`${dataBaseUrl}manual-disbursement/confirm`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ loanIds }),
    });

    resp = await request.json();
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message: "Could not confirm the manual disbursement.",
    };
  }

  return resp;
};

export default _markManualDisbursement;
