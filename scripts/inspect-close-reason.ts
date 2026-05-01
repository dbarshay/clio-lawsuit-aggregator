import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE = process.env.CLIO_API_BASE || "https://app.clio.com";

async function getToken() {
  const token = await prisma.clioToken.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!token?.accessToken) {
    throw new Error("No Clio access token found in ClioToken table.");
  }

  return token.accessToken;
}

async function clio(path: string) {
  const token = await getToken();

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("CLIO ERROR", res.status, text);
    process.exit(1);
  }

  return JSON.parse(text);
}

async function main() {
  console.log("\n=== Searching custom fields for Close Reason ===\n");

  const fields = await clio(
    "/api/v4/custom_fields.json?fields=id,name,parent_type,field_type,displayed&limit=200"
  );

  const matches = (fields.data || []).filter((f: any) =>
    String(f.name || "").toLowerCase().includes("close") ||
    String(f.name || "").toLowerCase().includes("reason")
  );

  console.log(JSON.stringify(matches, null, 2));

  console.log("\n=== Fetching sample matter BRL30085 ===\n");

  const matters = await clio(
    "/api/v4/matters.json?query=BRL30085&fields=id,display_number,status,custom_field_values{id,value,custom_field{id,name}}&limit=5"
  );

  console.log(JSON.stringify(matters.data, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
