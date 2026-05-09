const express = require("express");
const Users = require("../../models/users");
const _checkOverdues = require("../../../libs/checkOverdue");
const _payLoan = require("../../handlers/loanHandlers/payLoan");
const _checkLevel = require("../../../libs/levelCheck");
const fetch = require("node-fetch");
const config = require("../../../config");
const _generateString = require("../../../libs/generateID");

let url = "https://zambia-1.onrender.com"

const router = express.Router();

router.patch("/repayLoan/:id", async (request, responses) => {
  try {
    const id = request.params.id;
    const user = await Users.findOne({ _id: id });

    const { type, payAmount, paymentMethod, accountName, ntwrkOperator } =
    request.body;

    let myApiKey = config.myApiKey;
    let merchantId = config.merchantId;
    let myApiID = config.myApiID;

    let reference = await _generateString(12);

    let payUrl = config.paymentBaseUrl;
    var reference_no = "";
    await fetch(payUrl, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        auth: {
          merchant_id: merchantId,
          api_id: myApiID,
          api_key: myApiKey,
          service_id: "1002",
          channel: "momo",
        },
        data: {
          method: "runBillPayment",
          request_id: "perficent005",
          sender_id: paymentMethod,
          reference_no: reference,
          amount: payAmount, 
        },
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        // console.log({"res1": res});
        reference_no = res.response.sender_id;
      })
      .then(() => {
        setTimeout(() => {
          fetch(url)
            .then((response) => response.json())
            .then(async (res) => {
              // console.log({"res2": res});
              if (
                res.response_code == "100" &&
                res.sender_id === reference_no
              ) {
                // console.log({"res2 in": res});
                let loans = user.loan.loans;
                let newLoan = loans.filter((item) => item.isNewLoan === true);

                let repAmount =
                  newLoan[0].repaymentAmount === "" ||
                  newLoan[0].repaymentAmount === undefined
                    ? 0
                    : newLoan[0].repaymentAmount;

                let amtPaid =
                  newLoan[0].amountPaid === "" ||
                  newLoan[0].amountPaid === undefined
                    ? 0
                    : newLoan[0].amountPaid;

                let computedAmount =
                  parseFloat(repAmount) -
                  (parseFloat(amtPaid) + parseFloat(payAmount));

                newLoan[0].paymentStatus =
                  computedAmount > 0 ? "Not paid" : "Paid";
                newLoan[0].loanStatus = "Granted";
                newLoan[0].isNewLoan = computedAmount > 0 ? true : false;
                newLoan[0].dp = new Date();
                newLoan[0].amountPaid = JSON.stringify(
                  parseFloat(amtPaid) + parseFloat(payAmount)
                );

                let filteredLoans = loans.filter(
                  (item) => item._id !== newLoan[0]._id
                );

                let updatedLoans = [...filteredLoans, newLoan[0]];

                let overdResp = await _checkOverdues(newLoan[0]);

                let userODue =
                  user.loan.acumulatedOverDue === undefined
                    ? 0
                    : user.loan.acumulatedOverDue;

                const loanData = {
                  isApplied: computedAmount > 0 ? true : false,
                  loanStatus: "Granted",
                  paymentStatus: computedAmount > 0 ? "Not paid" : "Paid",
                  acumulatedOverDue: userODue + overdResp,
                  loans: updatedLoans,
                };

                let lev =
                  computedAmount > 0 || user.level === "20"
                    ? user.level
                    : await _checkLevel(updatedLoans);

                const updatedUser = await Users.updateOne(
                  { _id: id },
                  {
                    $set: {
                      loan: loanData,
                      level: lev,
                    },
                  }
                );

                if (updatedUser.modifiedCount >= 1) {
                  let ret = await _payLoan({ id: newLoan[0]._id, payAmount });

                  if (ret)
                    return responses.status(200).json({
                      success: 1,
                      message: "payment made successfully",
                    });

                  if (!ret)
                    return responses.status(400).json({
                      success: 0,
                      message: "could not make payment",
                    });
                }

                if (updatedUser.modifiedCount < 1)
                  return responses.status(400).json({
                    success: 0,
                    message: "payment request failed",
                  });
              } else if(res.response_code == "990") {
                setTimeout( async () => {
                  fetch(url)
                    .then((response) => response.json())
                    .then(async (res) => {
                      // console.log({"res3": res});
                      if (
                        res.response_code == "100" &&
                        res.sender_id === reference_no
                      ) {
                        // console.log({"res3 in": });
                        let loans = user.loan.loans;
                        let newLoan = loans.filter((item) => item.isNewLoan === true);
        
                        let repAmount =
                          newLoan[0].repaymentAmount === "" ||
                          newLoan[0].repaymentAmount === undefined
                            ? 0
                            : newLoan[0].repaymentAmount;
        
                        let amtPaid =
                          newLoan[0].amountPaid === "" ||
                          newLoan[0].amountPaid === undefined
                            ? 0
                            : newLoan[0].amountPaid;
        
                        let computedAmount =
                          parseFloat(repAmount) -
                          (parseFloat(amtPaid) + parseFloat(payAmount));
        
                        newLoan[0].paymentStatus =
                          computedAmount > 0 ? "Not paid" : "Paid";
                        newLoan[0].loanStatus = "Granted";
                        newLoan[0].isNewLoan = computedAmount > 0 ? true : false;
                        newLoan[0].dp = new Date();
                        newLoan[0].amountPaid = JSON.stringify(
                          parseFloat(amtPaid) + parseFloat(payAmount)
                        );
        
                        let filteredLoans = loans.filter(
                          (item) => item._id !== newLoan[0]._id
                        );
        
                        let updatedLoans = [...filteredLoans, newLoan[0]];
        
                        let overdResp = await _checkOverdues(newLoan[0]);
        
                        let userODue =
                          user.loan.acumulatedOverDue === undefined
                            ? 0
                            : user.loan.acumulatedOverDue;
        
                        const loanData = {
                          isApplied: computedAmount > 0 ? true : false,
                          loanStatus: "Granted",
                          paymentStatus: computedAmount > 0 ? "Not paid" : "Paid",
                          acumulatedOverDue: userODue + overdResp,
                          loans: updatedLoans,
                        };
        
                        let lev =
                          computedAmount > 0 || user.level === "20"
                            ? user.level
                            : await _checkLevel(updatedLoans);
        
                        const updatedUser = await Users.updateOne(
                          { _id: id },
                          {
                            $set: {
                              loan: loanData,
                              level: lev,
                            },
                          }
                        );
        
                        if (updatedUser.modifiedCount >= 1) {
                          let ret = await _payLoan({ id: newLoan[0]._id, payAmount });
        
                          if (ret)
                            return responses.status(200).json({
                              success: 1,
                              message: "payment made successfully",
                            });
        
                          if (!ret)
                            return responses.status(400).json({
                              success: 0,
                              message: "could not make payment",
                            });
                        }
        
                        if (updatedUser.modifiedCount < 1)
                          return responses.status(400).json({
                            success: 0,
                            message: "payment request failed",
                          });
                      } else {
                        return responses.status(400).json({
                          success: 0,
                          message: "Transaction failed, please try again",
                        });
                      }
                    })
                }, 50000);
              } else {
                return responses.status(400).json({
                  success: 0,
                  message: "Transaction failed, please try again",
                });
              }
            });
        }, 25000);
      });
  } catch (error) {
    console.log(error);
    return responses.status(500).json({
      success: 0,
      message: "Internal error: code(500)!",
    });
  }
});

module.exports = router;
