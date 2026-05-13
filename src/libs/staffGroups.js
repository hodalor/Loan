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

export const normalizeIdList = (values = []) =>
  [
    ...new Set(
      (Array.isArray(values) ? values : [values])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    ),
  ];

export const getAdminsByGroup = (admins = [], groupId = "") =>
  (Array.isArray(admins) ? admins : []).filter(
    (admin) => String(admin?.staffGroupId || "") === String(groupId || "")
  );

export const getAdminsByGroupIds = (admins = [], groupIds = []) => {
  const allowedIds = new Set(normalizeIdList(groupIds));

  return (Array.isArray(admins) ? admins : []).filter((admin) =>
    allowedIds.has(String(admin?.staffGroupId || "").trim())
  );
};

export const getManagedGroupIdsForUser = (user = {}, groups = [], department = "") => {
  const departmentGroups = getGroupsByDepartment(groups, department);
  const departmentGroupIds = new Set(departmentGroups.map((group) => String(group.id || "").trim()));
  const explicitManagedIds = normalizeIdList(user?.managedStaffGroupIds).filter((groupId) =>
    departmentGroupIds.has(groupId)
  );

  if (explicitManagedIds.length > 0) {
    return explicitManagedIds;
  }

  const primaryGroupId = String(user?.staffGroupId || "").trim();
  return departmentGroupIds.has(primaryGroupId) ? [primaryGroupId] : [];
};

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
