const isGodModeRole = (role = "") => role === "super-admin";

const canAccess = (role, allowedRoles = []) =>
  isGodModeRole(role) || allowedRoles.includes(role);
const buildPermissionKey = (path) => `nav:${path}`;

const rawNavigationItems = [
  {
    key: "home",
    label: "Home",
    path: "/",
    exact: true,
    icon: "fa fa-home",
    roles: [
      "super-admin",
      "admin",
      "rv-team-lead",
      "pre-team-lead",
      "col-team-lead",
      "rev-personel",
      "pre-personel",
      "col-personel",
    ],
  },
  {
    key: "user",
    label: "User",
    icon: "fa fa-users",
    roles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
    children: [
      {
        label: "User List",
        path: "/user-list",
        roles: ["super-admin", "admin"],
      },
      {
        label: "User Query",
        path: "/user-query",
        roles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
      },
    ],
  },
  {
    key: "order",
    label: "Order Center",
    icon: "fa fa-file-text-o",
    roles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
    children: [
      {
        label: "Order List",
        path: "/order-list",
        roles: ["super-admin", "admin"],
      },
      {
        label: "Order Repayment",
        path: "/order-repayment",
        roles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
      },
      {
        label: "Repayment Review",
        path: "/order-repayment-review",
        roles: ["super-admin", "admin"],
      },
      {
        label: "Apply Extension",
        path: "/apply-extension",
        roles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
      },
      {
        label: "Manual Payment Pool",
        path: "/manual-payment-pool",
        roles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
      },
      {
        label: "Failed Disburse",
        path: "/failed-disbursements",
        roles: ["super-admin", "admin"],
      },
    ],
  },
  {
    key: "credit",
    label: "Credit Audit",
    icon: "fa fa-check-square-o",
    roles: ["super-admin", "admin", "rv-team-lead", "rev-personel"],
    children: [
      {
        label: "Distribute Cases",
        path: "/distribute-credit-cases",
        roles: ["super-admin", "admin", "rv-team-lead"],
      },
      {
        label: "Credit Case List",
        path: "/credit-case-list",
        roles: ["super-admin", "admin", "rv-team-lead", "rev-personel"],
      },
      {
        label: "Credit Analysis",
        path: "/credit-audit-analysis",
        roles: ["super-admin", "admin", "rv-team-lead"],
      },
      {
        label: "Manual Disburse",
        path: "/manual-disbursement",
        roles: ["super-admin", "admin"],
      },
    ],
  },
  {
    key: "precollection",
    label: "Pre-Collection",
    icon: "fa fa-sitemap",
    roles: ["super-admin", "admin", "col-team-lead", "pre-team-lead", "pre-personel"],
    children: [
      {
        label: "Advance Case List",
        path: "/advance-case-list",
        roles: ["super-admin", "admin", "pre-team-lead", "pre-personel"],
      },
      {
        label: "Payment Records",
        path: "/prepayment-records",
        roles: ["super-admin", "admin", "pre-team-lead", "pre-personel"],
      },
      {
        label: "Ranking",
        path: "/pre-ranking",
        roles: ["super-admin", "admin", "pre-team-lead", "pre-personel"],
      },
    ],
  },
  {
    key: "collection",
    label: "Collection",
    icon: "fa fa-money",
    roles: ["super-admin", "admin", "col-team-lead", "col-personel"],
    children: [
      {
        label: "Collection Cases",
        path: "/collection-cases",
        roles: ["super-admin", "admin", "col-team-lead", "col-personel"],
      },
      {
        label: "Payment Records",
        path: "/collection-payment-records",
        roles: ["super-admin", "admin", "col-team-lead", "col-personel"],
      },
      {
        label: "Ranking",
        path: "/collection-ranking",
        roles: ["super-admin", "admin", "col-team-lead", "col-personel"],
      },
    ],
  },
  {
    key: "data-center",
    label: "Data Center",
    icon: "fa fa-bar-chart",
    roles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
    children: [
      {
        label: "Data",
        path: "/data-center-data",
        roles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
      },
    ],
  },
  {
    key: "system",
    label: "System Management",
    icon: "fa fa-cogs",
    roles: ["super-admin"],
    children: [
      {
        label: "User",
        path: "/create-users",
        icon: "fa fa-user-plus",
        roles: ["super-admin"],
      },
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: "fa fa-dashboard",
        roles: ["super-admin"],
      },
      {
        label: "Config",
        path: "/system-config",
        icon: "fa fa-sliders",
        roles: ["super-admin"],
      },
    ],
  },
];

export const navigationItems = rawNavigationItems.map((item) => ({
  ...item,
  permissionKey: item.path ? buildPermissionKey(item.path) : undefined,
  children: item.children?.map((child) => ({
    ...child,
    permissionKey: buildPermissionKey(child.path),
  })),
}));

const actionPermissionGroups = [
  {
    id: "user-actions",
    label: "User Actions",
    description: "Staff administration actions and access control changes.",
    items: [
      {
        key: "action:user:create",
        label: "Create Staff Accounts",
        description: "Open the create user modal and add new staff accounts.",
        defaultRoles: ["super-admin"],
      },
      {
        key: "action:user:update",
        label: "Edit Staff Accounts",
        description: "Update staff profile details, role, and department values.",
        defaultRoles: ["super-admin"],
      },
      {
        key: "action:user:delete",
        label: "Delete Staff Accounts",
        description: "Remove a staff account from the admin workspace.",
        defaultRoles: ["super-admin"],
      },
      {
        key: "action:user:toggle-active",
        label: "Change Staff Active Status",
        description: "Activate or block admin users from the staff list.",
        defaultRoles: ["super-admin"],
      },
      {
        key: "action:customer:view",
        label: "View Customer Details",
        description: "Open customer profile details from user query and user list pages.",
        defaultRoles: ["super-admin", "admin", "rv-team-lead"],
      },
      {
        key: "action:customer:update",
        label: "Edit Customers",
        description: "Update customer profile fields and manually change loan level.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:customer:toggle-active",
        label: "Change Customer Active Status",
        description: "Block or unblock customers from the user workspace.",
        defaultRoles: ["super-admin", "admin"],
      },
    ],
  },
  {
    id: "credit-actions",
    label: "Credit Actions",
    description: "Approval, assignment, and disbursement operational actions.",
    items: [
      {
        key: "action:credit:assign",
        label: "Assign Credit Cases",
        description: "Distribute incoming review cases to review officers.",
        defaultRoles: ["super-admin", "admin", "rv-team-lead"],
      },
      {
        key: "action:credit:reassign",
        label: "Reassign Credit Cases",
        description: "Move review cases from one review officer to another.",
        defaultRoles: ["super-admin", "admin", "rv-team-lead"],
      },
      {
        key: "action:loan:approve",
        label: "Approve Loans",
        description: "Grant approved loans from the credit review workspace.",
        defaultRoles: ["super-admin", "admin", "rv-team-lead", "rev-personel"],
      },
      {
        key: "action:loan:reject",
        label: "Reject Loans",
        description: "Reject loan requests during credit review.",
        defaultRoles: ["super-admin", "admin", "rv-team-lead", "rev-personel"],
      },
      {
        key: "action:disbursement:manual",
        label: "Run Manual Disbursement",
        description: "Open and process loans in the manual disbursement queue.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:disbursement:retry",
        label: "Retry Failed Disbursement",
        description: "Retry failed automatic disbursements and switch channels.",
        defaultRoles: ["super-admin", "admin"],
      },
    ],
  },
  {
    id: "collection-actions",
    label: "Collection Actions",
    description: "Case handling actions across pre-collection and collection.",
    items: [
      {
        key: "action:precollection:assign",
        label: "Assign Pre-Collection Cases",
        description: "Distribute pre-collection cases to officers.",
        defaultRoles: ["super-admin", "admin", "pre-team-lead"],
      },
      {
        key: "action:collection:assign",
        label: "Assign Collection Cases",
        description: "Distribute collection cases to officers.",
        defaultRoles: ["super-admin", "admin", "col-team-lead"],
      },
      {
        key: "action:payment:review",
        label: "Review Payment Records",
        description: "Open repayment review and payment record workspaces.",
        defaultRoles: [
          "super-admin",
          "admin",
          "rv-team-lead",
          "pre-team-lead",
          "col-team-lead",
          "pre-personel",
          "col-personel",
        ],
      },
    ],
  },
  {
    id: "system-actions",
    label: "System Actions",
    description: "High-level configuration and dashboard management actions.",
    items: [
      {
        key: "action:config:update",
        label: "Update System Config",
        description: "Save channel, gateway, and operational system settings.",
        defaultRoles: ["super-admin"],
      },
      {
        key: "action:config:repayment",
        label: "Manage Repayment Automation",
        description: "Change auto repayment posting and repayment routing settings.",
        defaultRoles: ["super-admin"],
      },
      {
        key: "action:dashboard:view",
        label: "View Executive Dashboard",
        description: "Open the system management dashboard pages.",
        defaultRoles: ["super-admin"],
      },
      {
        key: "action:data:early-window",
        label: "View Early Recovery Window",
        description:
          "See recovery columns before DAY-1 on the data center recovery matrix and assign this visibility to specific staff.",
        defaultRoles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
      },
    ],
  },
];

const menuPermissionGroups = navigationItems.map((item) => {
  const items = item.children?.length
    ? item.children.map((child) => ({
        key: child.permissionKey,
        label: child.label,
        description: `Open the ${child.label} workspace from ${item.label}.`,
        defaultRoles: child.roles,
      }))
    : [
        {
          key: item.permissionKey,
          label: item.label,
          description: `Open the ${item.label} workspace.`,
          defaultRoles: item.roles,
        },
      ];

  return {
    id: `menu-${item.key}`,
    label: item.label,
    description: `Sidebar menu and page access for ${item.label}.`,
    items,
  };
});

export const permissionGroups = [...menuPermissionGroups, ...actionPermissionGroups];

export const getDefaultPermissionsForRole = (role = "") =>
  [
    ...new Set(
      permissionGroups.flatMap((group) =>
        group.items
          .filter((item) => canAccess(role, item.defaultRoles))
          .map((item) => item.key)
      )
    ),
  ];

export const normalizeUserPermissions = (role = "", permissions = []) => {
  if (isGodModeRole(role)) {
    return [
      ...new Set(
        permissionGroups.flatMap((group) => group.items.map((item) => item.key))
      ),
    ];
  }

  const cleanPermissions = Array.isArray(permissions)
    ? [...new Set(permissions.filter(Boolean))]
    : [];

  return cleanPermissions.length > 0
    ? cleanPermissions
    : getDefaultPermissionsForRole(role);
};

export const hasPermission = (role = "", permissions = [], permissionKey = "") =>
  isGodModeRole(role) ||
  normalizeUserPermissions(role, permissions).includes(permissionKey);

const hasPermissionAccess = (role, permissions, item) => {
  if (!item.permissionKey) return canAccess(role, item.roles);

  return hasPermission(role, permissions, item.permissionKey);
};

export const getVisibleNavigation = (role, permissions = []) =>
  navigationItems
    .map((item) => {
      if (!item.children) {
        return hasPermissionAccess(role, permissions, item) ? item : null;
      }

      const children = item.children.filter((child) =>
        hasPermissionAccess(role, permissions, child)
      );

      if (children.length === 0 && !canAccess(role, item.roles)) return null;

      return { ...item, children };
    })
    .filter((item) => item && (!item.children || item.children.length > 0));
