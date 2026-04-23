import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const SHARED_DOCS_PATH = process.env.SHARED_DOCS_PATH!;
const PAD = (n: number, len = 5) => n.toString().padStart(len, "0");

const sequenceStore: Record<string, number> = {};

function generateLawsuitId(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const key = `${year}-${month}`;

  if (!sequenceStore[key]) {
    sequenceStore[key] = 0;
  }

  sequenceStore[key] += 1;

  const seq = PAD(sequenceStore[key]);

  return `${month}.${year}.${seq}`;
}

function buildFolderPath(masterId: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}-${year}`;

  return path.join(
    SHARED_DOCS_PATH,
    String(year),
    dateStr,
    masterId
  );
}

async function ensureFolder(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function createStubDocument(dir: string, masterId: string) {
  const filePath = path.join(
    dir,
    `${masterId} - TEST DOCUMENT.txt`
  );

  await fs.writeFile(
    filePath,
    `Lawsuit ${masterId}\nGenerated at ${new Date().toISOString()}`
  );

  return filePath;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matters } = body;

    if (!matters || matters.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No matters selected" },
        { status: 400 }
      );
    }

    const masterId = generateLawsuitId();

    const brlNumbers = matters
      .map((m: any) => m.displayNumber)
      .sort();

    const lawsuitMatters = brlNumbers.join(", ");

    const folderPath = buildFolderPath(masterId);
    await ensureFolder(folderPath);

    const docPath = await createStubDocument(folderPath, masterId);

    return NextResponse.json({
      ok: true,
      masterLawsuitId: masterId,
      lawsuitMatters,
      folderPath,
      docPath,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
