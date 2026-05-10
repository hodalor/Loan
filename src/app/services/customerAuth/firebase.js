const fetch = require("node-fetch");

const normalizeDigits = (value = "") => String(value || "").replace(/\D+/g, "");

const phonesMatch = (left = "", right = "") => {
  const normalizedLeft = normalizeDigits(left);
  const normalizedRight = normalizeDigits(right);

  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;

  return (
    normalizedLeft.endsWith(normalizedRight) ||
    normalizedRight.endsWith(normalizedLeft)
  );
};

const verifyFirebasePhoneToken = async ({
  idToken = "",
  phone = "",
  firebaseWebConfig = {},
}) => {
  const apiKey = String(firebaseWebConfig?.apiKey || "").trim();

  if (!idToken || !apiKey) {
    return {
      success: false,
      message: "Firebase verification is not configured correctly.",
    };
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      }
    );

    const data = await response.json();
    const account = Array.isArray(data?.users) ? data.users[0] : null;

    if (!response.ok || !account) {
      return {
        success: false,
        message: "Firebase verification failed.",
      };
    }

    if (!account.phoneNumber || !phonesMatch(account.phoneNumber, phone)) {
      return {
        success: false,
        message: "The verified Firebase phone does not match this account.",
      };
    }

    return {
      success: true,
      phoneNumber: account.phoneNumber,
      firebaseUserId: account.localId || "",
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Firebase verification failed.",
    };
  }
};

module.exports = {
  verifyFirebasePhoneToken,
};
