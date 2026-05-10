import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const REQUIRED_FIREBASE_KEYS = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

let recaptchaVerifier = null;
let recaptchaWidgetId = null;

const getRecaptchaContainer = (containerId) => {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error("Firebase reCAPTCHA container is missing from the page.");
  }

  return container;
};

const normalizePhoneNumber = (value = "") => String(value || "").replace(/[^\d]/g, "");

const buildE164PhoneNumber = (phone = "", dialCode = "") => {
  const localPhone = normalizePhoneNumber(phone).replace(/^0+/, "");
  const countryDigits = normalizePhoneNumber(dialCode);

  if (!localPhone || !countryDigits) {
    return "";
  }

  return `+${countryDigits}${localPhone}`;
};

const getFirebaseApp = (firebaseConfig = {}) => {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
};

export const isFirebasePhoneVerificationReady = (firebaseConfig = {}) =>
  REQUIRED_FIREBASE_KEYS.every((key) => String(firebaseConfig?.[key] || "").trim());

export const resetFirebasePhoneVerification = () => {
  if (recaptchaWidgetId !== null && window.grecaptcha) {
    try {
      window.grecaptcha.reset(recaptchaWidgetId);
    } catch (error) {}
  }

  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (error) {}
    recaptchaVerifier = null;
  }

  recaptchaWidgetId = null;
};

const mapFirebasePhoneAuthError = (error) => {
  const code = String(error?.code || "").trim();

  if (code === "auth/billing-not-enabled") {
    return "Firebase billing is not enabled for phone auth. Upgrade the Firebase project to Blaze and enable billing before using real SMS OTP.";
  }

  if (code === "auth/operation-not-allowed") {
    return "Phone Authentication is not enabled in Firebase Authentication > Sign-in method.";
  }

  if (code === "auth/invalid-app-credential") {
    return `Firebase reCAPTCHA verification failed for ${window.location.origin}. Add this domain to Firebase Authentication authorized domains and try again.`;
  }

  if (code === "auth/too-many-requests") {
    return "Too many OTP requests were made. Please wait and try again.";
  }

  return error?.message || "Firebase phone verification failed.";
};

export const requestFirebasePhoneOtp = async ({
  firebaseConfig = {},
  phone = "",
  dialCode = "",
  recaptchaContainerId = "firebase-recaptcha-container",
  recaptchaSize = "normal",
}) => {
  if (!isFirebasePhoneVerificationReady(firebaseConfig)) {
    throw new Error("Firebase phone verification is not configured.");
  }

  const e164Phone = buildE164PhoneNumber(phone, dialCode);
  if (!e164Phone) {
    throw new Error("A valid phone number is required.");
  }

  const recaptchaContainer = getRecaptchaContainer(recaptchaContainerId);
  resetFirebasePhoneVerification();
  recaptchaContainer.innerHTML = "";

  const app = getFirebaseApp(firebaseConfig);
  const auth = getAuth(app);
  auth.languageCode = "en";

  recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
    size: recaptchaSize,
  });

  recaptchaWidgetId = await recaptchaVerifier.render();

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, e164Phone, recaptchaVerifier);

    return {
      confirmationResult,
      e164Phone,
    };
  } catch (error) {
    if (window.grecaptcha && recaptchaWidgetId !== null) {
      window.grecaptcha.reset(recaptchaWidgetId);
    }

    throw new Error(mapFirebasePhoneAuthError(error));
  }
};

export const verifyFirebasePhoneOtp = async ({ confirmationResult, otp = "" }) => {
  if (!confirmationResult) {
    throw new Error("Request an OTP first.");
  }

  try {
    const credential = await confirmationResult.confirm(String(otp || "").trim());
    const idToken = await credential.user.getIdToken();

    return {
      idToken,
      phoneNumber: credential.user.phoneNumber || "",
    };
  } catch (error) {
    throw new Error(mapFirebasePhoneAuthError(error));
  }
};
