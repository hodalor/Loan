import { dataBaseUrl } from "../../libs/endpoints";

const _cancelBouncedDisbursement = async ({ loanId, remark }) => {
  let resp = {};

  try {
    const request = await fetch(`${dataBaseUrl}cancel-bounced-disbursement/${loanId}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ remark }),
    });

    resp = await request.json();
  } catch (error) {
    console.log(error);
    resp = {
      success: 0,
      message: "Could not cancel the bounced-back disbursement.",
    };
  }

  return resp;
};

export default _cancelBouncedDisbursement;
