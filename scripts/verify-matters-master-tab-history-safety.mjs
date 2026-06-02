#!/usr/bin/env node

import fs from "node:fs";

const pagePath = "app/matters/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const failures = [];

function mustContain(label, needle) {
  if (!page.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

function mustNotContain(label, needle) {
  if (page.includes(needle)) failures.push(`${label}: forbidden ${needle}`);
}

mustContain("has master workspace tab list", "const MASTER_WORKSPACE_TABS: MasterWorkspaceTab[] = [");
mustContain("normalizes master workspace tab", "function normalizeMasterWorkspaceTab(value: unknown): MasterWorkspaceTab");
mustContain("reads master tab from URL", "function masterWorkspaceTabFromUrl(): MasterWorkspaceTab");
mustContain("uses tab query parameter", 'new URLSearchParams(window.location.search).get("tab")');
mustContain("builds matters URL with tab", "function mattersUrlWithMasterWorkspaceTab(tab: MasterWorkspaceTab)");
mustContain("sets tab query parameter", 'url.searchParams.set("tab", tab);');
mustContain("initializes tab from URL", "useState<MasterWorkspaceTab>(() => masterWorkspaceTabFromUrl())");
mustContain("uses wrapped master tab setter", "function setActiveMasterWorkspaceTab(tab: MasterWorkspaceTab");
mustContain("pushes master tab history", "window.history.pushState({ barshMattersMattersMasterTab: true }, \"\", nextUrl);");
mustContain("replaces master tab history", "window.history.replaceState({ barshMattersMattersMasterTab: true }, \"\", nextUrl);");
mustContain("listens for Back/Forward", 'window.addEventListener("popstate", applyMasterWorkspaceTabFromUrl);');
mustContain("removes Back/Forward listener", 'window.removeEventListener("popstate", applyMasterWorkspaceTabFromUrl);');
mustContain("Back restores active master tab", "setActiveMasterWorkspaceTabState(masterWorkspaceTabFromUrl());");

mustNotContain("must not use old direct tab state setter", 'const [activeMasterWorkspaceTab, setActiveMasterWorkspaceTab] = useState<MasterWorkspaceTab>("payments");');

console.log("RESULT: verify matters master tab history safety");
console.log("PAGE=" + pagePath);
console.log("EXPECTS_MATTERS_MASTER_TAB_URL_STATE=YES");
console.log("EXPECTS_BROWSER_BACK_RESTORES_MASTER_TAB=YES");
console.log("FAILURES=" + failures.length);

for (const failure of failures) console.log("FAIL=" + failure);

if (failures.length) process.exit(1);
