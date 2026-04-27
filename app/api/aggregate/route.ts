import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { preflightLawsuitMatter, writeLawsuitFields } from "@/lib/clioWrite";

const SHARED_DOCS_PATH = process.env.SHARED_DOCS_PATH!;

function padSequence(n: number): string {
  return n.toString().padStart(5, "0");
}

async function generateLawsuitId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const counter = await prisma.$transaction(async (tx: any) => {
    const existing = await tx.lawsuitSequenceCounter.findUnique({
      where: {
        year_month: {
          year,
          month,
        },
      },
    });

    if (!existing) {
      return tx.lawsuitSequenceCounter.create({
        data: {
          year,
          month,
          lastSequence: 1,
        },
      });
    }

    return tx.lawsuitSequenceCounter.update({
      where: {
        year_month: {
          year,
          month,
        },
      },
      data: {
        lastSequence: {
          increment: 1,
        },
      },
    });
  });

  const monthStr = String(month).padStart(2, "0");
  const sequenceStr = padSequence(counter.lastSequence);

  return `${monthStr}.${year}.${sequenceStr}`;
}

function buildFolderPath(masterId: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}-${year}`;

  return path.join(SHARED_DOCS_PATH, String(year), dateStr, masterId);
}

async function ensureFolder(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function createStubDocument(dir: string, masterId: string) {
  const filePath = path.join(dir, `${masterId} - TEST DOCUMENT.txt`);

  await fs.writeFile(
    filePath,
    `Lawsuit ${masterId}\nGenerated at ${new Date().toISOString()}\n`
  );

  return filePath;
}

type InputMatter = {
  id: number;
  displayNumber: string;
};

function normalizeMatters(rawMatters: any[]): InputMatter[] {
  return rawMatters
    .map((m) => ({
      id: Number(m?.id),
      displayNumber: String(m?.displayNumber || "").trim(),
    }))
    .filter(
      (m) =>
        Number.isFinite(m.id) &&
        m.id > 0 &&
        m.displayNumber.length > 0
    );
}

export async function POST(req: NextRequest) {
  try {
    if (!SHARED_DOCS_PATH) {
      return NextResponse.json(
        { ok: false, error: "SHARED_DOCS_PATH is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const rawMatters = Array.isArray(body?.matters) ? body.matters : [];
    const matters = normalizeMatters(rawMatters);

    // --- CLAIM INDEX PRECHECK ---
    const ids = matters.map(m => Number(m.id));

    const indexedRows = await prisma.claimIndex.findMany({
      where: {
        matter_id: { in: ids }
      }
    });

    if (indexedRows.length !== matters.length) {
      return NextResponse.json(
        {
          ok: false,
          stage: "preflight",
          error: "One or more matters are not indexed (missing claim number)."
        },
        { status: 400 }
      );
    }

    const claimSet = new Set(indexedRows.map(r => r.claim_number_normalized));
    if (claimSet.size !== 1) {
      return NextResponse.json(
        {
          ok: false,
          stage: "preflight",
          error: "Selected matters do not share the same claim number."
        },
        { status: 400 }
      );
    }

    const providerSet = new Set(indexedRows.map(r => r.client_name));
    if (providerSet.size !== 1) {
      return NextResponse.json(
        {
          ok: false,
          stage: "preflight",
          error: "Selected matters do not share the same provider."
        },
        { status: 400 }
      );
    }


    if (matters.length < 2) {
      return NextResponse.json(
        { ok: false, error: "No valid matters selected" },
        { status: 400 }
      );
    }

    const displayNumbers = matters
      .map((m) => m.displayNumber)
      .filter(Boolean)
      .sort();

    const uniqueDisplayNumbers = [...new Set(displayNumbers)];
    const lawsuitMatters = uniqueDisplayNumbers.join(", ");

    const preflightResults: Array<{
      id: number;
      displayNumber: string;
      ok: boolean;
      error?: string;
      existingMasterValue?: string;
    }> = [];

    for (const matter of matters) {
      try {
        const result = await preflightLawsuitMatter(matter.id);

        if (result.existingMasterValue) {
          preflightResults.push({
            id: matter.id,
            displayNumber: matter.displayNumber,
            ok: false,
            existingMasterValue: result.existingMasterValue,
            error: `Matter already has MASTER LAWSUIT ID ${result.existingMasterValue}`,
          });
        } else {
          preflightResults.push({
            id: matter.id,
            displayNumber: matter.displayNumber,
            ok: true,
          });
        }
      } catch (err: any) {
        preflightResults.push({
          id: matter.id,
          displayNumber: matter.displayNumber,
          ok: false,
          error: err?.message || "Unknown preflight error",
        });
      }
    }

    const preflightFailures = preflightResults.filter((r) => !r.ok);

    if (preflightFailures.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          stage: "preflight",
          requested: matters.length,
          failed: preflightFailures.length,
          preflightResults,
          error: "One or more matters are invalid or already aggregated.",
        },
        { status: 400 }
      );
    }

    const masterLawsuitId = await generateLawsuitId();
    const folderPath = buildFolderPath(masterLawsuitId);

    await ensureFolder(folderPath);
    const docPath = await createStubDocument(folderPath, masterLawsuitId);

    const lawsuit = await prisma.lawsuit.create({
      data: {
        masterLawsuitId,
        lawsuitMatters,
        sharedFolderPath: folderPath,
      },
    });

    const clioResults: Array<{
      id: number;
      displayNumber: string;
      ok: boolean;
      error?: string;
    }> = [];

    for (const matter of matters) {
      try {
        await writeLawsuitFields(
          matter.id,
          masterLawsuitId,
          lawsuitMatters
        );

        clioResults.push({
          id: matter.id,
          displayNumber: matter.displayNumber,
          ok: true,
        });
      } catch (err: any) {
        clioResults.push({
          id: matter.id,
          displayNumber: matter.displayNumber,
          ok: false,
          error: err?.message || "Unknown Clio write-back error",
        });
      }
    }

    const failedWrites = clioResults.filter((r) => !r.ok);

    return NextResponse.json({
      ok: failedWrites.length === 0,
      stage: "writeback",
      lawsuitId: lawsuit.id,
      masterLawsuitId,
      lawsuitMatters,
      folderPath,
      docPath,
      requested: matters.length,
      succeeded: clioResults.length - failedWrites.length,
      failed: failedWrites.length,
      clioResults,
      error:
        failedWrites.length > 0
          ? `Clio write-back failed for ${failedWrites.length} matter(s).`
          : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
