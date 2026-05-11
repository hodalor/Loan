const DAY_IN_MS = 1000 * 60 * 60 * 24;

const COUNTRY_TIME_ZONES = {
  ZM: "Africa/Lusaka",
  GH: "Africa/Accra",
  NG: "Africa/Lagos",
};

const normalizeCountryCode = (value = "") => String(value || "").trim().toUpperCase();

const getLocaleRegion = (locale = "") => {
  const match = String(locale || "")
    .trim()
    .match(/[-_]([A-Za-z]{2})$/);

  return match ? match[1].toUpperCase() : "";
};

const resolveTimeZone = (timeZone = "") => {
  const normalized = String(timeZone || "").trim();

  if (!normalized) return "UTC";

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: normalized }).format(new Date());
    return normalized;
  } catch (error) {
    return "UTC";
  }
};

const getCountryTimeZone = ({ countryCode = "", locale = "", timeZone = "" } = {}) => {
  if (String(timeZone || "").trim()) {
    return resolveTimeZone(timeZone);
  }

  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const localeRegion = getLocaleRegion(locale);

  return (
    COUNTRY_TIME_ZONES[normalizedCountryCode] ||
    COUNTRY_TIME_ZONES[localeRegion] ||
    "UTC"
  );
};

const getDayNumberInTimeZone = (value, timeZone = "UTC") => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number.parseInt(parts.find((part) => part.type === "year")?.value || "0", 10);
  const month = Number.parseInt(parts.find((part) => part.type === "month")?.value || "0", 10);
  const day = Number.parseInt(parts.find((part) => part.type === "day")?.value || "0", 10);

  return Date.UTC(year, month - 1, day) / DAY_IN_MS;
};

const getCalendarDayDifferenceByCountry = (left, right = new Date(), countryProfile = {}) => {
  const timeZone = getCountryTimeZone(countryProfile);
  const leftDay = getDayNumberInTimeZone(left, timeZone);
  const rightDay = getDayNumberInTimeZone(right, timeZone);

  if (leftDay === null || rightDay === null) return 0;

  return leftDay - rightDay;
};

module.exports = { getCountryTimeZone, getCalendarDayDifferenceByCountry };
