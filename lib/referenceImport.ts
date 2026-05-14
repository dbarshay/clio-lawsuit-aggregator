import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  cleanReferenceText,
  normalizeReferenceEntityType,
  normalizeReferenceText,
  referenceTypeLabel,
} from "@/lib/referenceData";

export type ColumnMappingAction =
  | "ignore"
  | "displayName"
  | "aliases"
  | "notes"
  | "active"
  | "source"
  | "details_show"
  | "details_hidden";

type ParsedCsvRow = Record<string, string>;

export const VALID_IMPORT_MAPPING_ACTIONS = new Set<ColumnMappingAction>([
  "ignore",
  "displayName",
  "aliases",
  "notes",
  "active",
  "source",
  "details_show",
  "details_hidden",
]);

export function safetyImportPreview() {
  return {
    localBarshMattersReferenceData: true,
    previewOnly: true,
    databaseRecordsChanged: false,
    noDatabaseRecordsChanged: true,
    clioData: false,
    noClioRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
    hardDeleteSupported: false,
    confirmedImportSupported: false,
  };
}

export function safetyConfirmedImport() {
  return {
    localBarshMattersReferenceData: true,
    previewOnly: false,
    databaseRecordsChanged: true,
    noDatabaseRecordsChanged: false,
    clioData: false,
    noClioRecordsChanged: true,
    noDocumentsGenerated: true,
    noPrintQueueRecordsChanged: true,
    hardDeleteSupported: false,
    hardDeletePerformed: false,
    confirmedImportSupported: true,
  };
}

export function parseCsv(text: string): string[][] {
  const input = String(text ?? "").replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell);
      if (row.some((value) => cleanReferenceText(value))) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => cleanReferenceText(value))) {
    rows.push(row);
  }

  return rows;
}

export function autoMapHeader(header: string): ColumnMappingAction {
  const normalized = normalizeReferenceText(header).replace(/\s+/g, "_");

  if (normalized.startsWith("hidden_") || normalized.startsWith("internal_")) {
    return "details_hidden";
  }

  if (
    [
      "display_name",
      "displayname",
      "canonical_name",
      "canonical",
      "name",
      "entity_name",
      "reference_name",
      "company_name",
      "person_name",
      "provider_name",
      "patient_name",
      "insurer_name",
      "court_name",
    ].includes(normalized)
  ) {
    return "displayName";
  }

  if (["alias", "aliases", "aka", "also_known_as", "search_terms", "search_term"].includes(normalized)) {
    return "aliases";
  }

  if (["note", "notes", "memo", "comment", "comments"].includes(normalized)) {
    return "notes";
  }

  if (["active", "status", "enabled", "inactive"].includes(normalized)) {
    return "active";
  }

  if (["source", "origin", "data_source"].includes(normalized)) {
    return "source";
  }

  return "details_show";
}

function cleanHeader(value: unknown, index: number): string {
  const raw = cleanReferenceText(value);
  return raw || `Column ${index + 1}`;
}

export function normalizeMappings(headers: string[], rawMappings: any): Record<string, ColumnMappingAction> {
  const normalized: Record<string, ColumnMappingAction> = {};

  for (const header of headers) {
    const requested = cleanReferenceText(rawMappings?.[header]) as ColumnMappingAction;
    normalized[header] = VALID_IMPORT_MAPPING_ACTIONS.has(requested) ? requested : autoMapHeader(header);
  }

  return normalized;
}

export function toObjectRows(rows: string[][]): { headers: string[]; records: ParsedCsvRow[] } {
  const headerRow = rows[0] || [];
  const headers = headerRow.map((header, index) => cleanHeader(header, index));

  const seen = new Map<string, number>();
  const uniqueHeaders = headers.map((header) => {
    const count = seen.get(header) || 0;
    seen.set(header, count + 1);
    return count === 0 ? header : `${header} (${count + 1})`;
  });

  const records = rows.slice(1).map((row) => {
    const record: ParsedCsvRow = {};
    uniqueHeaders.forEach((header, index) => {
      record[header] = cleanReferenceText(row[index]);
    });
    return record;
  });

  return { headers: uniqueHeaders, records };
}

function parseBoolean(value: unknown): boolean | null {
  const raw = cleanReferenceText(value).toLowerCase();
  if (!raw) return null;
  if (["true", "1", "yes", "y", "active", "enabled"].includes(raw)) return true;
  if (["false", "0", "no", "n", "inactive", "disabled"].includes(raw)) return false;
  return null;
}

function splitAliases(value: unknown): string[] {
  const raw = cleanReferenceText(value);
  if (!raw) return [];

  return raw
    .split(/[;\n|]+/g)
    .map((item) => cleanReferenceText(item))
    .filter(Boolean);
}

export function summarizeMapping(headers: string[], mappings: Record<string, ColumnMappingAction>) {
  const summary: Record<ColumnMappingAction, string[]> = {
    ignore: [],
    displayName: [],
    aliases: [],
    notes: [],
    active: [],
    source: [],
    details_show: [],
    details_hidden: [],
  };

  for (const header of headers) {
    summary[mappings[header] || "ignore"].push(header);
  }

  return summary;
}

export function mergeImportDetails(
  existing: unknown,
  visible: Record<string, string>,
  hidden: Record<string, string>
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  for (const [key, value] of Object.entries(visible)) {
    base[key] = value;
  }

  if (Object.keys(hidden).length > 0) {
    const existingHidden =
      base._hiddenImportFields && typeof base._hiddenImportFields === "object" && !Array.isArray(base._hiddenImportFields)
        ? (base._hiddenImportFields as Record<string, unknown>)
        : {};

    base._hiddenImportFields = {
      ...existingHidden,
      ...hidden,
    };
  }

  return Object.keys(base).length > 0 ? (base as Prisma.InputJsonValue) : Prisma.JsonNull;
}

export async function buildReferenceImportPreview(input: {
  type: unknown;
  csvText: string;
  columnMappings?: any;
}) {
  const type = normalizeReferenceEntityType(input.type);
  const rows = parseCsv(input.csvText);

  if (!rows.length) {
    throw new Error("CSV text is required.");
  }

  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const { headers, records } = toObjectRows(rows);
  const mappings = normalizeMappings(headers, input.columnMappings || {});
  const displayNameColumns = headers.filter((header) => mappings[header] === "displayName");

  if (displayNameColumns.length !== 1) {
    const error: any = new Error("Exactly one CSV column must be mapped to Display Name.");
    error.headers = headers;
    error.mappings = mappings;
    error.mappingSummary = summarizeMapping(headers, mappings);
    throw error;
  }

  const existing = await prisma.referenceEntity.findMany({
    where: { type },
    include: { aliases: { orderBy: { alias: "asc" } } },
    orderBy: [{ active: "desc" }, { displayName: "asc" }],
    take: 5000,
  });

  const existingByNormalizedName = new Map(existing.map((entity) => [entity.normalizedName, entity]));

  const normalizedCounts = new Map<string, number>();
  for (const record of records) {
    const displayName = cleanReferenceText(record[displayNameColumns[0]]);
    const normalizedName = normalizeReferenceText(displayName);
    if (normalizedName) {
      normalizedCounts.set(normalizedName, (normalizedCounts.get(normalizedName) || 0) + 1);
    }
  }

  const rowPreviews = records.map((record, index) => {
    const rowNumber = index + 2;
    const displayName = cleanReferenceText(record[displayNameColumns[0]]);
    const normalizedName = normalizeReferenceText(displayName);
    const existingEntity = normalizedName ? existingByNormalizedName.get(normalizedName) : null;
    const duplicateInFile = normalizedName ? (normalizedCounts.get(normalizedName) || 0) > 1 : false;

    const aliases: string[] = [];
    let notes = "";
    let active: boolean | null = null;
    let source = "";
    const detailsVisible: Record<string, string> = {};
    const detailsHidden: Record<string, string> = {};
    const ignored: Record<string, string> = {};
    const invalidReasons: string[] = [];

    for (const header of headers) {
      const action = mappings[header] || "ignore";
      const value = cleanReferenceText(record[header]);

      if (action === "ignore") {
        if (value) ignored[header] = value;
        continue;
      }

      if (action === "displayName") {
        continue;
      }

      if (action === "aliases") {
        aliases.push(...splitAliases(value));
        continue;
      }

      if (action === "notes") {
        notes = value;
        continue;
      }

      if (action === "active") {
        const parsed = parseBoolean(value);
        if (value && parsed === null) {
          invalidReasons.push(`Invalid active value in "${header}": ${value}`);
        }
        active = parsed;
        continue;
      }

      if (action === "source") {
        source = value;
        continue;
      }

      if (action === "details_show") {
        if (value) detailsVisible[header] = value;
        continue;
      }

      if (action === "details_hidden") {
        if (value) detailsHidden[header] = value;
      }
    }

    if (!displayName) {
      invalidReasons.push("Missing display name.");
    }

    if (duplicateInFile) {
      invalidReasons.push("Duplicate display name within uploaded CSV.");
    }

    const uniqueAliases = Array.from(new Set(aliases.map((alias) => cleanReferenceText(alias)).filter(Boolean)));

    const classification =
      invalidReasons.length > 0
        ? "invalid"
        : existingEntity
          ? "update"
          : "create";

    return {
      rowNumber,
      classification,
      type,
      typeLabel: referenceTypeLabel(type),
      displayName,
      normalizedName,
      existingEntity: existingEntity
        ? {
            id: existingEntity.id,
            displayName: existingEntity.displayName,
            active: existingEntity.active,
            notes: existingEntity.notes,
            source: existingEntity.source,
            aliasCount: existingEntity.aliases.length,
            details: existingEntity.details,
          }
        : null,
      proposed: {
        displayName,
        aliases: uniqueAliases,
        notes,
        active,
        source,
        detailsVisible,
        detailsHidden,
      },
      ignored,
      invalidReasons,
    };
  });

  const importableRows = rowPreviews.filter(
    (row) => row.classification === "create" || row.classification === "update"
  );

  const summary = {
    totalCsvRows: records.length,
    validRows: importableRows.length,
    rowsToCreate: rowPreviews.filter((row) => row.classification === "create").length,
    rowsToUpdate: rowPreviews.filter((row) => row.classification === "update").length,
    duplicateOrConflictRows: rowPreviews.filter((row) => row.classification === "conflict").length,
    invalidRows: rowPreviews.filter((row) => row.classification === "invalid").length,
    aliasesToAdd: importableRows.reduce((sum, row) => sum + row.proposed.aliases.length, 0),
    rowsWithVisibleDetails: importableRows.filter((row) => Object.keys(row.proposed.detailsVisible).length > 0).length,
    rowsWithHiddenInternalDetails: importableRows.filter((row) => Object.keys(row.proposed.detailsHidden).length > 0).length,
    ignoredColumns: headers.filter((header) => mappings[header] === "ignore").length,
    existingRecordsChecked: existing.length,
  };

  return {
    type,
    typeLabel: referenceTypeLabel(type),
    headers,
    mappings,
    mappingSummary: summarizeMapping(headers, mappings),
    summary,
    rowPreviews,
  };
}
