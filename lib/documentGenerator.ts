import fs from "fs";
import path from "path";

function ensureDir(p: string) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function todayFolderParts() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  return {
    year: String(yyyy),
    dateFolder: `${mm}-${dd}-${yyyy}`,
  };
}

export function buildSharedFolderPath(masterId: string) {
  const base = process.env.SHARED_DOCS_PATH;

  if (!base) {
    throw new Error("SHARED_DOCS_PATH not set");
  }

  const { year, dateFolder } = todayFolderParts();

  const fullPath = path.join(base, year, dateFolder, masterId);

  ensureDir(fullPath);

  return fullPath;
}

export function generateDocuments(params: {
  masterId: string;
  matters: number[];
}) {
  const { masterId, matters } = params;

  const folder = buildSharedFolderPath(masterId);

  const files: string[] = [];

  const timestamp = new Date().toISOString();

  // Example core documents (expand later)
  const docs = [
    {
      name: `${masterId} - SUMMONS.txt`,
      content: `SUMMONS\n\nMaster ID: ${masterId}\nMatters: ${matters.join(", ")}\nGenerated: ${timestamp}`,
    },
    {
      name: `${masterId} - COMPLAINT.txt`,
      content: `COMPLAINT\n\nMaster ID: ${masterId}\nMatter Count: ${matters.length}\nGenerated: ${timestamp}`,
    },
    {
      name: `${masterId} - BILL SCHEDULE.txt`,
      content: `BILL SCHEDULE\n\n${matters.map((m) => `Matter ${m}`).join("\n")}`,
    },
  ];

  for (const doc of docs) {
    const fullPath = path.join(folder, doc.name);
    fs.writeFileSync(fullPath, doc.content, "utf8");
    files.push(fullPath);
  }

  return {
    folder,
    files,
  };
}
