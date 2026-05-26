const getAuditActor = () => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedUser = JSON.parse(window.localStorage.getItem("user") || "null");

    if (!storedUser) {
      return {};
    }

    return {
      userId: String(storedUser.userId || "").trim(),
      userName: String(storedUser.userName || "").trim(),
      role: String(storedUser.role || "").trim(),
    };
  } catch (error) {
    return {};
  }
};

export default getAuditActor;
