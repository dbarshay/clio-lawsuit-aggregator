import { buildClioStorageTargetPlan, type ClioStorageTargetInput, type ClioStorageTargetPlan } from "./clioStoragePlan";

export type ClioStorageFolderResolutionMode = "preview_only" | "future_create_allowed";

export type ClioStorageFolderResolutionAction =
  | "verify-master-matter"
  | "find-or-create-bucket-folder"
  | "find-or-create-matter-folder"
  | "return-matter-folder-upload-target";

export type ClioStorageFolderResolutionPreview = {
  mode: "preview_only";
  createsFolders: false;
  callsClio: false;
  uploadsDocuments: false;
  mutatesDatabase: false;
  targetPlan: ClioStorageTargetPlan;
  plannedActions: ClioStorageFolderResolutionAction[];
  notes: string[];
};

export function buildClioStorageFolderResolutionPreview(input: ClioStorageTargetInput): ClioStorageFolderResolutionPreview {
  const targetPlan = buildClioStorageTargetPlan(input);

  return {
    mode: "preview_only",
    createsFolders: false,
    callsClio: false,
    uploadsDocuments: false,
    mutatesDatabase: false,
    targetPlan,
    plannedActions: [
      "verify-master-matter",
      "find-or-create-bucket-folder",
      "find-or-create-matter-folder",
      "return-matter-folder-upload-target",
    ],
    notes: [
      "Preview only. No Clio API call is made in Phase 5.",
      "Future resolver must verify the configured single master matter before any folder operation.",
      "Future resolver must create at most the computed bucket folder and one matter folder.",
      "Future upload routes must use the returned matter folder as the document upload target.",
    ],
  };
}
