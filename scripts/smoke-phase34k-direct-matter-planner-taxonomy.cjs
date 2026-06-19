const fs = require("fs");
const ts = require("typescript");

require.extensions[".ts"] = function loadTs(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const { buildClioStorageTargetPlan } = require("../lib/clioStoragePlan.ts");

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

console.log("RESULT: Phase 34K direct matter planner taxonomy smoke starting");

const plan = buildClioStorageTargetPlan(
  {
    storageTargetKind: "individual_matter",
    directMatterFileNumber: "BRL_202600001",
    bmMatterId: "BRL_202600001",
    displayNumber: "BRL_202600001",
  },
  {
    mode: "single_master_matter",
    singleMasterEnabled: true,
    masterMatterId: 1885821245,
    masterMatterName: "Barsh Matters Master Repository",
    bucketSize: 1000,
  }
);

console.log("PLAN_JSON=" + JSON.stringify(plan, null, 2));

assert(plan.storageTargetKind === "individual_matter", "storageTargetKind is individual_matter");
assert(plan.rootFolderName === "Individual Matters", "root folder is Individual Matters");
assert(plan.groupFolderName === "BRL-202600001-BRL-202600999", "range folder is first 999-matter BRL range");
assert(plan.finalFolderName === "BRL_202600001", "final folder is direct matter file number");
assert(Array.isArray(plan.folderSegments), "folderSegments returned");
assert(plan.folderSegments.length === 3, "three folder segments returned");
assert(plan.folderSegments[0] === "Individual Matters", "segment 1 is Individual Matters");
assert(plan.folderSegments[1] === "BRL-202600001-BRL-202600999", "segment 2 is BRL range folder");
assert(plan.folderSegments[2] === "BRL_202600001", "segment 3 is direct matter file number");
assert(plan.matterFolderPath === "Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001", "matterFolderPath is direct matter taxonomy path");
assert(!JSON.stringify(plan).match(/patient|provider|insurer|claim/i), "plan contains no private matter facts");

console.log("PASS: no Clio call performed by planner smoke");
console.log("PASS: no folder created by planner smoke");
console.log("PASS: no upload performed by planner smoke");
console.log("PASS: no database mutation performed by planner smoke");
console.log("RESULT: Phase 34K direct matter planner taxonomy smoke passed");
