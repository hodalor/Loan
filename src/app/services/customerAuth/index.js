const otpStore = new Map();
const VERIFIED_WINDOW_MS = 10 * 60 * 1000;
const OTP_WINDOW_MS = 5 * 60 * 1000;

const buildKey = (phone, purpose = "signup") => `${phone}:${purpose}`;

const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const requestOtp = ({ phone, purpose = "signup" }) => {
  const code = generateOtp();
  const key = buildKey(phone, purpose);

  otpStore.set(key, {
    phone,
    purpose,
    code,
    expiresAt: Date.now() + OTP_WINDOW_MS,
    verifiedAt: null,
  });

  return {
    phone,
    purpose,
    code,
    expiresAt: Date.now() + OTP_WINDOW_MS,
  };
};

const verifyOtp = ({ phone, otp, purpose = "signup" }) => {
  const key = buildKey(phone, purpose);
  const entry = otpStore.get(key);

  if (!entry) {
    return { success: false, message: "OTP request not found. Please request a new code." };
  }

  if (entry.expiresAt < Date.now()) {
    otpStore.delete(key);
    return { success: false, message: "OTP expired. Please request a new code." };
  }

  if (entry.code !== otp) {
    return { success: false, message: "OTP code is not correct." };
  }

  otpStore.set(key, {
    ...entry,
    verifiedAt: Date.now(),
  });

  return { success: true };
};

const consumeVerifiedOtp = ({ phone, purpose = "signup" }) => {
  const key = buildKey(phone, purpose);
  const entry = otpStore.get(key);

  if (!entry || !entry.verifiedAt) {
    return { success: false, message: "OTP verification is required before setting a PIN." };
  }

  if (entry.verifiedAt + VERIFIED_WINDOW_MS < Date.now()) {
    otpStore.delete(key);
    return { success: false, message: "OTP verification expired. Please verify again." };
  }

  otpStore.delete(key);
  return { success: true };
};

module.exports = {
  requestOtp,
  verifyOtp,
  consumeVerifiedOtp,
};
