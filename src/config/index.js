require("dotenv").config();

module.exports = {
  merchantId: process.env.MERCHANT_ID,
  myApiKey: process.env.API_KEY,
  myApiID: process.env.API_ID,
  paymentBaseUrl: process.env.PAYMENT_URL,
  callbackUrl: process.env.callbackURl,
  nsanoApiKey: process.env.NSANO_API_KEY,
  nsanoApiEndpoint: process.env.NSANO_API_ENDPOINT,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
  paystackBaseUrl: process.env.PAYSTACK_BASE_URL || "https://api.paystack.co",
  paystackCallbackUrl: process.env.PAYSTACK_CALLBACK_URL,
  paystackCurrency: process.env.PAYSTACK_CURRENCY || "GHS",
  paystackMtnBankCode: process.env.PAYSTACK_MTN_BANK_CODE,
  paystackAirtelBankCode: process.env.PAYSTACK_AIRTEL_BANK_CODE,
  paystackZamtelBankCode: process.env.PAYSTACK_ZAMTEL_BANK_CODE,
  bridgeBaseUrl: process.env.BRIDGE_BASE_URL || "https://api.bridgeagw.com",
  bridgeApiUsername: process.env.BRIDGE_API_USERNAME,
  bridgeApiPassword: process.env.BRIDGE_API_PASSWORD,
  bridgeServiceId: process.env.BRIDGE_SERVICE_ID,
  bridgeCallbackUrl: process.env.BRIDGE_CALLBACK_URL,
  bridgeCurrencyCode: process.env.BRIDGE_CURRENCY_CODE || "GHS",
  bridgeCurrencyValue: process.env.BRIDGE_CURRENCY_VALUE || "1",
  database: process.env.MONGO_URI,
  server: {
    port: process.env.PORT,
  },

  //reduse expiry time
  jwt: {
    secret: "djkfsnf63",
    expiresIn: "365d",
  },
};
