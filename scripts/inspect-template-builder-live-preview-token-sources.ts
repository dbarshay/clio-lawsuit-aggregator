import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const clean = (value: unknown): string => String(value ?? '').trim();
const norm = (value: string): string => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');

async function query(sql: string): Promise<Record<string, unknown>[]> {
  return await prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql);
}

async function tableNames(): Promise<string[]> {
  try {
    const rows = await query("select table_name as name from information_schema.tables where table_schema = 'public' order by table_name");
    return rows.map((row) => clean(row.name)).filter(Boolean);
  } catch {
    const rows = await query("select name from sqlite_master where type = 'table' order by name");
    return rows.map((row) => clean(row.name)).filter(Boolean);
  }
}

async function tableColumns(tableName: string): Promise<string[]> {
  const escaped = tableName.replace(/'/g, "''");
  try {
    const rows = await query("select column_name as name from information_schema.columns where table_schema = 'public' and table_name = '" + escaped + "' order by ordinal_position");
    return rows.map((row) => clean(row.name)).filter(Boolean);
  } catch {
    const rows = await query("pragma table_info('" + escaped + "')");
    return rows.map((row) => clean(row.name)).filter(Boolean);
  }
}

async function main(): Promise<void> {
  const tables = await tableNames();
  const columnReport: { table: string; columns: string[] }[] = [];
  for (const table of tables) {
    const columns = await tableColumns(table);
    const interesting = columns.filter((column) => {
      const n = norm(column);
      return n.includes('tax') || n.includes('tin') || n.includes('ein') || n.includes('insurer') || n.includes('insurance') || n.includes('hidden') || n.includes('index') || n.includes('aaa') || n.includes('court') || n.includes('adversary') || n.includes('filed') || n.includes('fee') || n.includes('cost') || n.includes('balance') || n.includes('payment');
    });
    if (interesting.length > 0) columnReport.push({ table, columns: interesting });
  }

  const taxCandidates = columnReport.filter((entry) => entry.columns.some((column) => {
    const n = norm(column);
    return n.includes('tax') || n.includes('tin') || n.includes('ein');
  }));

  console.log('TOKEN_SOURCE_COLUMN_REPORT=' + JSON.stringify(columnReport, null, 2));
  console.log('PROVIDER_TAX_ID_CANDIDATE_COLUMNS=' + JSON.stringify(taxCandidates, null, 2));
  if (taxCandidates.length === 0) console.log('PROVIDER_TAX_ID_EVIDENCE=No tax/tin/ein candidate columns found in inspected DB tables.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
