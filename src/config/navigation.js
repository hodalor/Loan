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
      {
        label: "Bounced Back",
        path: "/bounced-back-disbursements",
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
        label: "Dashboard",
        path: "/dashboard",
        icon: "fa fa-dashboard",
        roles: ["super-admin"],
      },
      {
        label: "Data",
        path: "/data-center-data",
        roles: ["super-admin", "admin", "rv-team-lead", "pre-team-lead", "col-team-lead"],
      },
    ],
  },
  {
    key: "fund-management",
    label: "Fund Management",
    icon: "fa fa-credit-card",
    roles: ["super-admin", "admin"],
    children: [
      {
        label: "Payments",
        path: "/fund-payments",
        roles: ["super-admin", "admin"],
      },
      {
        label: "Failed Payments",
        path: "/fund-failed-payments",
        roles: ["super-admin", "admin"],
      },
      {
        label: "Airtime",
        path: "/fund-airtime",
        roles: ["super-admin", "admin"],
      },
      {
        label: "Failed Airtime",
        path: "/fund-failed-airtime",
        roles: ["super-admin", "admin"],
      },
      {
        label: "Batch Upload",
        path: "/fund-batch-payments",
        roles: ["super-admin", "admin"],
      },
      {
        label: "Batch Talktime",
        path: "/fund-batch-talktime",
        roles: ["super-admin", "admin"],
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
        label: "Config",
        path: "/system-config",
        icon: "fa fa-sliders",
        roles: ["super-admin"],
      },
      {
        label: "Audit Logs",
        path: "/system-audit-logs",
        icon: "fa fa-clipboard",
        roles: ["super-admin"],
      },
      {
        label: "Error Logs",
        path: "/system-error-logs",
        icon: "fa fa-exclamation-triangle",
        roles: ["super-admin"],
      },
      {
        label: "Docs",
        path: "/system-docs",
        icon: "fa fa-book",
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
    id: "precollection-visibility",
    label: "Pre-Collection Visibility",
    description: "Control who can see pre-collection queues, payment records, and ranking scope.",
    items: [
      {
        key: "action:precollection:cases:unassigned:view",
        label: "View Unassigned Pre-Collection Cases",
        description: "See the unassigned pre-collection queue before cases are distributed.",
        defaultRoles: ["super-admin", "admin", "pre-team-lead"],
      },
      {
        key: "action:precollection:cases:assigned:own",
        label: "View Own Assigned Pre-Collection Cases",
        description: "Limit assigned pre-collection cases to the logged-in officer only.",
        defaultRoles: ["pre-personel"],
      },
      {
        key: "action:precollection:cases:assigned:group",
        label: "View Group Assigned Pre-Collection Cases",
        description: "See assigned pre-collection cases for the groups managed by this staff member.",
        defaultRoles: ["pre-team-lead"],
      },
      {
        key: "action:precollection:cases:assigned:all",
        label: "View All Assigned Pre-Collection Cases",
        description: "See assigned pre-collection cases across the whole department.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:precollection:cases:completed:own",
        label: "View Own Completed Pre-Collection Cases",
        description: "Limit completed pre-collection cases to the logged-in officer only.",
        defaultRoles: ["pre-personel"],
      },
      {
        key: "action:precollection:cases:completed:group",
        label: "View Group Completed Pre-Collection Cases",
        description: "See completed pre-collection cases for the groups managed by this staff member.",
        defaultRoles: ["pre-team-lead"],
      },
      {
        key: "action:precollection:cases:completed:all",
        label: "View All Completed Pre-Collection Cases",
        description: "See completed pre-collection cases across the whole department.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:precollection:payments:own",
        label: "View Own Pre-Collection Payment Records",
        description: "See only the payment records collected by the logged-in pre-collection officer.",
        defaultRoles: ["pre-personel"],
      },
      {
        key: "action:precollection:payments:group",
        label: "View Group Pre-Collection Payment Records",
        description: "See payment records for the managed pre-collection groups.",
        defaultRoles: ["pre-team-lead"],
      },
      {
        key: "action:precollection:payments:all",
        label: "View All Pre-Collection Payment Records",
        description: "See all pre-collection payment records across the department.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:precollection:ranking:group",
        label: "View Group Pre-Collection Ranking",
        description: "See ranking for the logged-in officer's group or managed groups.",
        defaultRoles: ["pre-personel", "pre-team-lead"],
      },
      {
        key: "action:precollection:ranking:all",
        label: "View All Pre-Collection Ranking",
        description: "See ranking across the full pre-collection department.",
        defaultRoles: ["super-admin", "admin"],
      },
    ],
  },
  {
    id: "collection-visibility",
    label: "Collection Visibility",
    description: "Control who can see collection queues, payment records, and ranking scope.",
    items: [
      {
        key: "action:collection:cases:unassigned:view",
        label: "View Unassigned Collection Cases",
        description: "See the unassigned collection queue before cases are distributed.",
        defaultRoles: ["super-admin", "admin", "col-team-lead"],
      },
      {
        key: "action:collection:cases:assigned:own",
        label: "View Own Assigned Collection Cases",
        description: "Limit assigned collection cases to the logged-in officer only.",
        defaultRoles: ["col-personel"],
      },
      {
        key: "action:collection:cases:assigned:group",
        label: "View Group Assigned Collection Cases",
        description: "See assigned collection cases for the groups managed by this staff member.",
        defaultRoles: ["col-team-lead"],
      },
      {
        key: "action:collection:cases:assigned:all",
        label: "View All Assigned Collection Cases",
        description: "See assigned collection cases across the whole department.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:collection:cases:completed:own",
        label: "View Own Completed Collection Cases",
        description: "Limit completed collection cases to the logged-in officer only.",
        defaultRoles: ["col-personel"],
      },
      {
        key: "action:collection:cases:completed:group",
        label: "View Group Completed Collection Cases",
        description: "See completed collection cases for the groups managed by this staff member.",
        defaultRoles: ["col-team-lead"],
      },
      {
        key: "action:collection:cases:completed:all",
        label: "View All Completed Collection Cases",
        description: "See completed collection cases across the whole department.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:collection:payments:own",
        label: "View Own Collection Payment Records",
        description: "See only the payment records collected by the logged-in collection officer.",
        defaultRoles: ["col-personel"],
      },
      {
        key: "action:collection:payments:group",
        label: "View Group Collection Payment Records",
        description: "See payment records for the managed collection groups.",
        defaultRoles: ["col-team-lead"],
      },
      {
        key: "action:collection:payments:all",
        label: "View All Collection Payment Records",
        description: "See all collection payment records across the department.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:collection:ranking:group",
        label: "View Group Collection Ranking",
        description: "See ranking for the logged-in officer's group or managed groups.",
        defaultRoles: ["col-personel", "col-team-lead"],
      },
      {
        key: "action:collection:ranking:all",
        label: "View All Collection Ranking",
        description: "See ranking across the full collection department.",
        defaultRoles: ["super-admin", "admin"],
      },
    ],
  },
  {
    id: "fund-actions",
    label: "Fund Management",
    description: "Grants for internal staff payments, airtime, batch upload, approvals, and failed resend queues.",
    items: [
      {
        key: "action:fund:payment:initiate",
        label: "Create Payment Requests",
        description: "Open the make payment modal and submit single staff payment requests.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:payment:approve:first",
        label: "First Approve Payments",
        description: "Approve or reject single payment requests in the first approval queue.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:payment:approve:second",
        label: "Second Approve Payments",
        description: "Approve or reject single payment requests in the second approval queue before send.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:payment:resend",
        label: "Resend Failed Payments",
        description: "Return failed single payment requests back into the resend workflow.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:airtime:initiate",
        label: "Create Airtime Requests",
        description: "Open the airtime modal and submit single airtime requests.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:airtime:approve:first",
        label: "Review Airtime Requests",
        description: "Approve or reject single airtime requests from the pending review tab.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:airtime:resend",
        label: "Resend Failed Airtime",
        description: "Return failed single airtime requests back into the review workflow.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:batch-payment:initiate",
        label: "Import Batch Payments",
        description: "Download the template, import xlsx rows, and create batch payment requests.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:batch-payment:approve:first",
        label: "First Approve Batch Payments",
        description: "Approve or reject imported batch payment rows in the first approval queue.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:batch-payment:approve:second",
        label: "Second Approve Batch Payments",
        description: "Approve or reject imported batch payment rows in the second approval queue before send.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:batch-payment:resend",
        label: "Resend Failed Batch Payments",
        description: "Return failed batch payment rows back into the resend workflow.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:batch-airtime:initiate",
        label: "Import Batch Talktime",
        description: "Download the template, import xlsx rows, and create batch talktime requests.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:batch-airtime:approve:first",
        label: "Review Batch Talktime",
        description: "Approve or reject imported batch talktime rows from the pending review tab.",
        defaultRoles: ["super-admin", "admin"],
      },
      {
        key: "action:fund:batch-airtime:resend",
        label: "Resend Failed Batch Talktime",
        description: "Return failed batch talktime rows back into the review workflow.",
        defaultRoles: ["super-admin", "admin"],
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

export const getDefaultPermissionsForRoleFromGroups = (
  role = "",
  groups = permissionGroups
) =>
  [
    ...new Set(
      (Array.isArray(groups) ? groups : []).flatMap((group) =>
        (Array.isArray(group?.items) ? group.items : [])
          .filter((item) => canAccess(role, item.defaultRoles))
          .map((item) => item.key)
      )
    ),
  ];

export const getDefaultPermissionsForRole = (role = "") =>
  getDefaultPermissionsForRoleFromGroups(role, permissionGroups);

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

export const getAssignablePermissionGroups = (role = "", permissions = []) =>
  permissionGroups
    .map((group) => ({
      ...group,
      items: (Array.isArray(group?.items) ? group.items : []).filter((item) =>
        hasPermission(role, permissions, item.key)
      ),
    }))
    .filter((group) => group.items.length > 0);

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

export const getFirstVisiblePath = (role = "", permissions = []) => {
  const visibleNavigation = getVisibleNavigation(role, permissions);

  for (const item of visibleNavigation) {
    if (item?.path) return item.path;
    if (Array.isArray(item?.children) && item.children[0]?.path) {
      return item.children[0].path;
    }
  }

  return "/";
};
