import fs from "node:fs";

let failures = 0;

function read(path) {
  try {
    return fs.readFileSync(path, "utf8");
  } catch {
    console.error(`Missing file: ${path}`);
    failures += 1;
    return "";
  }
}

function mustContain(label, text, needle) {
  if (!text.includes(needle)) {
    console.error(`FAIL ${label}: missing ${JSON.stringify(needle)}`);
    failures += 1;
  }
}

function mustNotContain(label, text, needle) {
  if (text.includes(needle)) {
    console.error(`FAIL ${label}: forbidden ${JSON.stringify(needle)}`);
    failures += 1;
  }
}

const routePath = "app/api/graph/live-token-test/route.ts";
const tokenPath = "lib/graph/token.ts";
const packagePath = "package.json";

const route = read(routePath);
const token = read(tokenPath);
const packageJson = read(packagePath);

console.log("=== GRAPH LIVE TOKEN TEST SAFETY VERIFICATION ===");

mustContain(routePath, route, "export async function GET");
mustContain(routePath, route, 'action: "graph-live-token-test"');
mustContain(routePath, route, 'const REQUIRED_CONFIRMATION = "live-token-test"');
mustContain(routePath, route, 'confirm !== REQUIRED_CONFIRMATION');
mustContain(routePath, route, "requestMicrosoftGraphAppToken()");
mustContain(routePath, route, "graphCallsMade: false");
mustContain(routePath, route, "graphCallsMade: true");
mustContain(routePath, route, "tokenRequested: false");
mustContain(routePath, route, "tokenRequested: true");
mustContain(routePath, route, "accessTokenReturned: false");
mustContain(routePath, route, "tokenReceived: Boolean(result.token?.accessToken)");
mustContain(routePath, route, "createsOutlookDraft: false");
mustContain(routePath, route, "sendsEmail: false");
mustContain(routePath, route, "readsMailbox: false");
mustContain(routePath, route, "syncsMailbox: false");
mustContain(routePath, route, "clioRecordsChanged: false");
mustContain(routePath, route, "databaseRecordsChanged: false");
mustContain(routePath, route, "The access token is intentionally omitted");

mustContain(tokenPath, token, "requestMicrosoftGraphAppToken");
mustContain(tokenPath, token, "redactSecretForError");
mustContain(tokenPath, token, "client_credentials");
mustContain(tokenPath, token, "https://graph.microsoft.com/.default");

mustNotContain(routePath, route, "accessToken:");
mustNotContain(routePath, route, "result.token?.accessToken,");
mustNotContain(routePath, route, "prisma.");
mustNotContain(routePath, route, "clioFetch(");
mustNotContain(routePath, route, "sendMail");
mustNotContain(routePath, route, "/sendMail");
mustNotContain(routePath, route, "messages/");
mustNotContain(routePath, route, "createUploadSession");
mustNotContain(routePath, route, "export async function POST");
mustNotContain(routePath, route, "export async function PATCH");
mustNotContain(routePath, route, "export async function DELETE");

if (packageJson.includes('"verify:graph-live-token-test-safety"')) {
  console.log("PASS package.json exposes verify:graph-live-token-test-safety script.");
} else {
  console.error("FAIL package.json missing verify:graph-live-token-test-safety script.");
  failures += 1;
}

if (failures > 0) {
  console.error(`=== GRAPH LIVE TOKEN TEST SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== GRAPH LIVE TOKEN TEST SAFETY PASSED ===");
