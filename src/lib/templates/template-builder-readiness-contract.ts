export const TEMPLATE_BUILDER_PERMISSION = "templates.manage" as const;

export const TEMPLATE_REPOSITORY_STORAGE_PREFIXES = [
  "templates/active/",
  "templates/inactive/",
  "templates/archived/",
  "templates/deleted/",
] as const;

export const TEMPLATE_STATUSES = [
  "Active",
  "Inactive",
  "Archived",
  "Deleted",
] as const;

export type TemplateBuilderStatus = (typeof TEMPLATE_STATUSES)[number];

export type TemplateBuilderLifecycleAction =
  | "create"
  | "editMetadata"
  | "replaceDocx"
  | "makeActive"
  | "deactivate"
  | "archive"
  | "delete"
  | "restore";

export type TemplateBuilderStatusTransition = {
  action: TemplateBuilderLifecycleAction;
  from: TemplateBuilderStatus | "New";
  to: TemplateBuilderStatus;
  requiresConfirmation: boolean;
  requiresTokenScan: boolean;
  updatesLastEdited: boolean;
  auditLogged: boolean;
  storageMoveRequired: boolean;
};

export const TEMPLATE_BUILDER_STATUS_TRANSITIONS: TemplateBuilderStatusTransition[] = [
  {
    action: "create",
    from: "New",
    to: "Inactive",
    requiresConfirmation: false,
    requiresTokenScan: true,
    updatesLastEdited: true,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "editMetadata",
    from: "Active",
    to: "Active",
    requiresConfirmation: false,
    requiresTokenScan: false,
    updatesLastEdited: true,
    auditLogged: true,
    storageMoveRequired: false,
  },
  {
    action: "replaceDocx",
    from: "Active",
    to: "Active",
    requiresConfirmation: false,
    requiresTokenScan: true,
    updatesLastEdited: true,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "makeActive",
    from: "Inactive",
    to: "Active",
    requiresConfirmation: false,
    requiresTokenScan: true,
    updatesLastEdited: false,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "makeActive",
    from: "Archived",
    to: "Active",
    requiresConfirmation: false,
    requiresTokenScan: true,
    updatesLastEdited: false,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "deactivate",
    from: "Active",
    to: "Inactive",
    requiresConfirmation: false,
    requiresTokenScan: false,
    updatesLastEdited: false,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "archive",
    from: "Active",
    to: "Archived",
    requiresConfirmation: false,
    requiresTokenScan: false,
    updatesLastEdited: false,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "archive",
    from: "Inactive",
    to: "Archived",
    requiresConfirmation: false,
    requiresTokenScan: false,
    updatesLastEdited: false,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "delete",
    from: "Active",
    to: "Deleted",
    requiresConfirmation: true,
    requiresTokenScan: false,
    updatesLastEdited: false,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "delete",
    from: "Inactive",
    to: "Deleted",
    requiresConfirmation: true,
    requiresTokenScan: false,
    updatesLastEdited: false,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "delete",
    from: "Archived",
    to: "Deleted",
    requiresConfirmation: true,
    requiresTokenScan: false,
    updatesLastEdited: false,
    auditLogged: true,
    storageMoveRequired: true,
  },
  {
    action: "restore",
    from: "Deleted",
    to: "Inactive",
    requiresConfirmation: true,
    requiresTokenScan: false,
    updatesLastEdited: false,
    auditLogged: true,
    storageMoveRequired: true,
  },
];

export function templateBuilderStoragePrefixForStatus(status: TemplateBuilderStatus) {
  if (status === "Active") return "templates/active/";
  if (status === "Inactive") return "templates/inactive/";
  if (status === "Archived") return "templates/archived/";
  return "templates/deleted/";
}

export function templateBuilderStatusFilterIncludes(status: TemplateBuilderStatus, filter: TemplateBuilderStatus | "All") {
  if (filter === "All") return status !== "Deleted";
  return status === filter;
}

export function templateBuilderIsGenerationEligible(status: TemplateBuilderStatus) {
  return status === "Active";
}

export function templateBuilderShowsStoredPathInRoutineUi() {
  return false;
}

export function templateBuilderRequiresStrongConfirmation(action: TemplateBuilderLifecycleAction) {
  return action === "delete";
}

export function templateBuilderRequiresConfirmation(action: TemplateBuilderLifecycleAction) {
  return action === "delete" || action === "restore";
}

export function templateBuilderLifecycleUpdatesLastEdited(action: TemplateBuilderLifecycleAction) {
  return action === "create" || action === "editMetadata" || action === "replaceDocx";
}

export function templateBuilderLifecycleRequiresTokenScan(action: TemplateBuilderLifecycleAction) {
  return action === "create" || action === "replaceDocx" || action === "makeActive";
}
