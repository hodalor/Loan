export const normalizeDepartmentValue = (value = "") =>
  String(value || "").trim().toLowerCase();

export const normalizeGroupCollection = (groups = []) =>
  (Array.isArray(groups) ? groups : []).map((group) => ({
    ...group,
    id: group?._id || group?.id || "",
    name: String(group?.name || "").trim(),
    department: String(group?.department || "").trim(),
    description: String(group?.description || "").trim(),
  }));

export const getGroupsByDepartment = (groups = [], department = "") => {
  const normalizedDepartment = normalizeDepartmentValue(department);

  return normalizeGroupCollection(groups).filter(
    (group) => normalizeDepartmentValue(group.department) === normalizedDepartment
  );
};

export const getGroupOptionsByDepartment = (groups = [], department = "") =>
  getGroupsByDepartment(groups, department).map((group) => ({
    label: group.name,
    value: group.id,
  }));

export const getAdminsByGroup = (admins = [], groupId = "") =>
  (Array.isArray(admins) ? admins : []).filter(
    (admin) => String(admin?.staffGroupId || "") === String(groupId || "")
  );

export const getAdminGroupMap = (admins = []) =>
  new Map(
    (Array.isArray(admins) ? admins : []).map((admin) => [
      String(admin?.userName || ""),
      String(admin?.staffGroupId || ""),
    ])
  );

export const getDepartmentLabel = (department = "") => {
  const normalized = normalizeDepartmentValue(department);
  if (normalized === "pre-collection") return "Pre-collection";
  if (normalized === "collection") return "Collection";
  if (normalized === "review") return "Review";
  if (normalized === "management") return "Management";
  return department;
};
