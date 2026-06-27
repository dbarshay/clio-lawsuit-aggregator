import type {
  AdminUsersPhaseW1AreaKey,
  AdminUsersPhaseW1OperationKey,
} from "./admin-users-final-permission-coverage-phase-w1";

export const ADMIN_USERS_PHASE_W6_CLASSIFICATION_OVERRIDES = true as const;

export type AdminUsersPhaseW6ClassificationOverride = {
  path: string;
  areaKey?: AdminUsersPhaseW1AreaKey;
  operationFamilies?: AdminUsersPhaseW1OperationKey[];
  paymentSensitive?: boolean;
  adminOnly?: boolean;
  adminCardGrantKey?: string | null;
  reason: string;
  reviewedDisposition:
    | "admin_card_mapping"
    | "read_only_preview"
    | "payment_sensitive"
    | "financial_settlement_sensitive"
    | "admin_context_only";
  enforcementActive: false;
  uiHidingActive: false;
};

export const ADMIN_USERS_PHASE_W6_CLASSIFICATION_OVERRIDES_LIST: AdminUsersPhaseW6ClassificationOverride[] = [
  {
    path: "app/admin/audit-history/page.tsx",
    adminCardGrantKey: "admin.card.auditHistory",
    reason: "Audit History page should map to the Audit History Admin card.",
    reviewedDisposition: "admin_card_mapping",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/admin/lawsuits/audit/page.tsx",
    adminCardGrantKey: "admin.card.auditHistory",
    reason: "Lawsuit audit page should map to the Audit History Admin card.",
    reviewedDisposition: "admin_card_mapping",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/admin/lawsuits/audit/route.ts",
    adminCardGrantKey: "admin.card.auditHistory",
    reason: "Lawsuit audit API should map to the Audit History Admin card.",
    reviewedDisposition: "admin_card_mapping",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/admin/authorize/route.ts",
    adminCardGrantKey: null,
    reason: "Admin authorization route is Admin context/auth support, not a specific Admin card.",
    reviewedDisposition: "admin_context_only",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/admin/email-automation-status/route.ts",
    adminCardGrantKey: "admin.card.readinessDashboard",
    reason: "Email automation status is operational readiness/status context.",
    reviewedDisposition: "admin_card_mapping",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/admin/clients/[id]/page.tsx",
    paymentSensitive: true,
    reason: "Client detail is part of Clients/Billing planning and should be treated as payment-sensitive.",
    reviewedDisposition: "payment_sensitive",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/admin/clients/page.tsx",
    paymentSensitive: true,
    reason: "Clients landing is part of Clients/Billing planning and should be treated as payment-sensitive.",
    reviewedDisposition: "payment_sensitive",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/admin/clients/[id]/route.ts",
    paymentSensitive: true,
    reason: "Client API is part of Clients/Billing planning and should be treated as payment-sensitive.",
    reviewedDisposition: "payment_sensitive",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/admin/clients/route.ts",
    paymentSensitive: true,
    reason: "Clients API is part of Clients/Billing planning and should be treated as payment-sensitive.",
    reviewedDisposition: "payment_sensitive",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/settlements/attorney-fee-breakdown/route.ts",
    paymentSensitive: true,
    areaKey: "settlement_payment_status",
    reason: "Attorney fee breakdown is settlement financial context.",
    reviewedDisposition: "financial_settlement_sensitive",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/settlements/local-provider-fee-defaults/route.ts",
    paymentSensitive: true,
    areaKey: "settlement_payment_status",
    reason: "Provider fee defaults are settlement financial context.",
    reviewedDisposition: "financial_settlement_sensitive",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/settlements/provider-fee-defaults/route.ts",
    paymentSensitive: true,
    areaKey: "settlement_payment_status",
    reason: "Provider fee defaults are settlement financial context.",
    reviewedDisposition: "financial_settlement_sensitive",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/admin/backups/restore-preview/route.ts",
    operationFamilies: ["view", "admin_manage"],
    reason: "Restore preview is a read-only planning preview, not the restore apply action.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/admin/clients/[id]/invoice/create-preview/route.ts",
    operationFamilies: ["view", "payment_manage", "admin_manage"],
    paymentSensitive: true,
    reason: "Invoice create preview is a read-only preview, but remains payment-sensitive.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/admin/lawsuits/cleanup-preview/route.ts",
    operationFamilies: ["view", "admin_manage"],
    reason: "Cleanup preview is read-only planning, not cleanup confirmation.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/documents/clio-finalization-target-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Finalization target preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/documents/clio-master-crossref-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Clio master crossref preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/documents/clio-master-matter-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Clio master matter preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/documents/delivery-draft-preview/route.ts",
    operationFamilies: ["view", "email"],
    reason: "Delivery draft preview prepares reviewable draft context; email sending remains separate.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/documents/direct-finalize-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Direct finalize preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/documents/finalize-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Finalize preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/documents/generate-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Generate preview is read-only planning, not document generation apply.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/documents/preview-pdf/route.ts",
    operationFamilies: ["view"],
    reason: "PDF preview is read-only.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/documents/templates/import-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Template import preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/graph/draft-payload-preview/route.ts",
    operationFamilies: ["view", "email"],
    reason: "Draft payload preview is review-only; Graph create draft is separate.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/lawsuits/local-generation-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Local generation preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/reference-data/import-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Reference-data import preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/settlements/close-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Settlement close preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/settlements/local-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Settlement local preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/settlements/local-record-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Settlement local record preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/settlements/preview/route.ts",
    operationFamilies: ["view"],
    reason: "Settlement preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
  {
    path: "app/api/settlements/writeback-preview/route.ts",
    operationFamilies: ["view"],
    reason: "Settlement writeback preview is read-only planning.",
    reviewedDisposition: "read_only_preview",
    enforcementActive: false,
    uiHidingActive: false,
  },
] as const;

export function adminUsersPhaseW6OverrideByPath(path: string): AdminUsersPhaseW6ClassificationOverride | null {
  return ADMIN_USERS_PHASE_W6_CLASSIFICATION_OVERRIDES_LIST.find((override) => override.path === path) || null;
}
