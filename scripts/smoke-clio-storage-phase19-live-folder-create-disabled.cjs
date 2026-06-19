#!/usr/bin/env node

function enabled(value) {
  return String(value ?? "").trim() === "1";
}

function getReadiness(env) {
  const explicit = String(env.CLIO_SINGLE_MASTER_LIVE_WRITE_COMMAND ?? "").trim() === "RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE";
  const createFolders = enabled(env.CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED);
  const liveWrite = enabled(env.CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED);
  const ready = Boolean(explicit && createFolders && liveWrite);
  return {
    ready,
    reason: ready
      ? "Live folder creation readiness gate passed for a later explicitly commanded operational phase."
      : "Live folder creation is blocked unless explicit command phrase and both write flags are present.",
    allowedCommandPhrase: "RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE",
  };
}

async function main() {
  const readiness = getReadiness(process.env);
  console.log("PHASE_19_LIVE_FOLDER_CREATE_SMOKE=disabled_by_default");
  console.log("READY=" + readiness.ready);
  console.log("REASON=" + readiness.reason);
  console.log("REQUIRES_COMMAND=" + readiness.allowedCommandPhrase);

  if (!readiness.ready) {
    console.log("RESULT: live folder-create smoke blocked before any Clio call");
    return;
  }

  throw new Error("Phase 19 harness reached live-write branch. Live execution is reserved for the next explicitly commanded operational phase.");
}

main().catch((err) => {
  console.error("FAIL: " + (err && err.message ? err.message : err));
  process.exit(1);
});
