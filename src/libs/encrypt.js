const stringCrypto = require("string-crypto");

const password = "hvfmrh8jhk";

// initialization of string crypto
const { encryptString, decryptString } = new stringCrypto();

// encrypt data/password
const _encrypt = async (data) => {
  let encryptedString = encryptString(data, password);
  return encryptedString;
};

// decrypt data/password
const _decrypt = async (data) => {
  let decryptedSTring = decryptString(data, password);
  return decryptedSTring;
};

module.exports = { _encrypt, _decrypt };
