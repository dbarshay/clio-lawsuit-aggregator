#!/usr/bin/env node
const PROD = process.env.PRODUCTION_URL || "https://clio-lawsuit-aggregator.vercel.app";

const ENTRY_PATHS = ["/matters", "/"];
const REQUIRED_TOKENS = [
  "uploadTargetMode",
  "master-lawsuit",
  "useSingleMasterClioStorage",
  "confirmUpload",
  "singleMasterDryRun",
  "singleMasterResolveFolders",
  "workingDocumentDriveItemId",
  "workingDocumentKey",
  "direct-matter",
  "directMatterDisplayNumber",
];

const CRITICAL_COMBOS = [
  ["master-lawsuit", "useSingleMasterClioStorage"],
  ["master-lawsuit", "singleMasterDryRun"],
  ["master-lawsuit", "singleMasterResolveFolders"],
  ["direct-matter", "directMatterDisplayNumber"],
  ["direct-matter", "singleMasterDryRun"],
];

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "BarshMattersReadOnlyVerifier/1.0" } });
  const text = await res.text();
  return { status: res.status, contentType: res.headers.get("content-type") || "", text };
}

async function main() {
  console.log("RESULT: production UI single-master finalize bundle token verifier starting");
  console.log("CONTRACT: read-only asset fetch only; no UI actions and no finalize calls.");

  const seen = new Map();
  const queue = [];

  for (const path of ENTRY_PATHS) {
    const url = new URL(path, PROD).toString();
    const result = await fetchText(url);
    if (result.status === 200) pass(`fetched entry ${url}`);
    else fail(`could not fetch entry ${url}: HTTP ${result.status}`);
    seen.set(url, result.text);

    for (const match of result.text.matchAll(/(?:src|href)=["']([^"']+\.js[^"']*)["']/g)) {
      queue.push(new URL(match[1], PROD).toString());
    }
    for (const match of result.text.matchAll(/["'](\/_next\/static\/[^"']+?\.js[^"']*)["']/g)) {
      queue.push(new URL(match[1], PROD).toString());
    }
  }

  const uniqueQueue = [...new Set(queue)].slice(0, 300);
  console.log(`INFO: discovered ${uniqueQueue.length} candidate JS assets`);

  for (const url of uniqueQueue) {
    try {
      const result = await fetchText(url);
      if (result.status !== 200) continue;
      seen.set(url, result.text);
      if (REQUIRED_TOKENS.some((token) => result.text.includes(token))) {
        pass(`payload-related token found in asset ${url}`);
      }
    } catch {
      // Ignore individual static asset failures; aggregate token checks below decide result.
    }
  }

  const combined = [...seen.values()].join("\n");

  for (const token of REQUIRED_TOKENS) {
    combined.includes(token)
      ? pass(`production UI/assets contain token ${token}`)
      : fail(`production UI/assets missing token ${token}`);
  }

  for (const [a, b] of CRITICAL_COMBOS) {
    const hit = [...seen.entries()].find(([, text]) => text.includes(a) && text.includes(b));
    if (hit) pass(`production asset co-locates ${JSON.stringify(a)} with ${JSON.stringify(b)}: ${hit[0]}`);
    else fail(`no fetched production asset co-locates ${JSON.stringify(a)} with ${JSON.stringify(b)}`);
  }

  if (process.exitCode) {
    console.error("RESULT: production UI single-master finalize bundle token verifier failed");
    process.exit(process.exitCode);
  }

  console.log("RESULT: production UI single-master finalize bundle token verifier passed");
}

main().catch((err) => {
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});
