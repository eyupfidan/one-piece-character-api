import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import dotenv from 'dotenv';

dotenv.config();

const execFileAsync = promisify(execFile);
export const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../data/onepiece.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

let sqliteNative: { DatabaseSync: new (file: string) => any } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sqliteNative = require('node:sqlite');
} catch {
  sqliteNative = null;
}

let nativeDb: any = null;
if (sqliteNative?.DatabaseSync) {
  nativeDb = new sqliteNative.DatabaseSync(dbPath);
  nativeDb.exec('PRAGMA foreign_keys = ON;');
  nativeDb.exec('PRAGMA journal_mode = WAL;');
  nativeDb.exec('PRAGMA synchronous = NORMAL;');
  nativeDb.exec('PRAGMA busy_timeout = 5000;');
}

function toSqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function bindParams(sql: string, params: unknown[] = []): string {
  let index = 0;
  return sql.replace(/\?/g, () => {
    if (index >= params.length) throw new Error('SQL parametre sayısı yetersiz.');
    return toSqlLiteral(params[index++]);
  });
}

async function runSqlWithCli(sql: string): Promise<any[]> {
  const { stdout } = await execFileAsync('sqlite3', ['-json', dbPath, sql]);
  return stdout.trim() ? (JSON.parse(stdout) as any[]) : [];
}

function runSqlWithNative(sql: string, params: unknown[] = []): any {
  const normalized = sql.trim().toUpperCase();
  const stmt = nativeDb.prepare(sql);

  if (normalized.startsWith('SELECT') || normalized.startsWith('PRAGMA')) {
    return stmt.all(...params);
  }

  const result = stmt.run(...params);
  return { changes: result.changes, lastID: result.lastInsertRowid };
}

async function runSqlWithRetry(sql: string, attempts = 4): Promise<any[]> {
  let lastError: any;

  for (let i = 0; i < attempts; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await runSqlWithCli(sql);
    } catch (error: any) {
      lastError = error;
      const locked = error.code === 5 || /database is locked/i.test(error.stderr || error.message || '');
      if (!locked || i === attempts - 1) break;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, 150 * (i + 1)));
    }
  }

  throw lastError;
}

export async function query(sql: string, params: unknown[] = []): Promise<any> {
  if (nativeDb) return runSqlWithNative(sql, params);

  const boundSql = bindParams(sql, params);
  const normalized = boundSql.trim().toUpperCase();

  try {
    if (normalized.startsWith('SELECT') || normalized.startsWith('PRAGMA')) {
      return await runSqlWithRetry(`PRAGMA foreign_keys = ON; ${boundSql}`);
    }

    const result = await runSqlWithRetry(
      `PRAGMA foreign_keys = ON; ${boundSql}; SELECT changes() AS changes, last_insert_rowid() AS lastID;`
    );

    return result[0] || { changes: 0, lastID: null };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error('SQLite backend bulunamadı. Node.js 24+ (node:sqlite) kullanın veya sqlite3 CLI kurup PATH\'e ekleyin.');
    }
    throw error;
  }
}

export const usingNativeSqlite = Boolean(nativeDb);
