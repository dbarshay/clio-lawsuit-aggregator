import fs from "node:fs";

// Locks the standard popup-modal look + behavior in ONE place: app/components/BarshModal.tsx.
// Individual popups are migrated onto <BarshModal>, so their per-popup verifiers only need to
// assert they render <BarshModal> with the right title / actions — the chrome is guaranteed here.

const src = fs.readFileSync("app/components/BarshModal.tsx", "utf8");
const failures = [];
const must = (cond, msg) => { if (!cond) failures.push(msg); };

// Standard look
must(src.includes('background: "#0a1c35"'), "navy (#0a1c35) header bar");
must(src.includes('textAlign: "center"'), "centered header title");
must(src.includes('background: "rgba(15, 23, 42, 0.45)"'), "standard translucent backdrop");
must(!src.includes("×"), "no top-right close glyph");

// Behavior: Esc closes, Enter submits (guarding textareas)
must(src.includes('event.key === "Escape"') && src.includes("onClose()"), "Esc fires close action");
must(src.includes('event.key === "Enter"') && src.includes("onSubmit()"), "Enter fires submit action");
must(src.includes('tag === "TEXTAREA"'), "Enter ignored while typing in a textarea");

// Draggable by header
must(src.includes("onPointerDown") && src.includes("setDragging(true)"), "draggable via header pointer drag");
must(src.includes("translate("), "drag offset applied via transform");

// Resizable
must(src.includes('resize: "both"'), "resizable card (CSS resize: both)");

// Footer with explicit close + optional primary
must(src.includes('data-barsh-modal-close="true"'), "explicit footer close/cancel button");
must(src.includes('data-barsh-modal-submit="true"'), "optional footer primary action button");
must(src.includes('data-barsh-standard-modal="true"'), "standard-modal data hook for migrated popups");

if (failures.length) {
  console.error("FAIL: BarshModal standard safety");
  for (const f of failures) console.error("- " + f);
  process.exit(1);
}
console.log("PASS: BarshModal provides the standard popup look + drag/resize/Esc/Enter behavior.");
