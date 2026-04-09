const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execFileAsync = promisify(execFile);
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../data/onepiece.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

let sqliteNative = null;
try {
  sqliteNative = require('node:sqlite');
} catch (_) {
  sqliteNative = null;
}

let nativeDb = null;
if (sqliteNative?.DatabaseSync) {
  nativeDb = new sqliteNative.DatabaseSync(dbPath);
  nativeDb.exec('PRAGMA foreign_keys = ON;');
  nativeDb.exec('PRAGMA journal_mode = WAL;');
}

function toSqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function bindParams(sql, params = []) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    if (index >= params.length) throw new Error('SQL parametre sayısı yetersiz.');
    return toSqlLiteral(params[index++]);
  });
}

async function runSqlWithCli(sql) {
  const { stdout } = await execFileAsync('sqlite3', ['-json', dbPath, sql]);
  return stdout.trim() ? JSON.parse(stdout) : [];
}

function runSqlWithNative(sql, params = []) {
  const normalized = sql.trim().toUpperCase();
  const stmt = nativeDb.prepare(sql);

  if (normalized.startsWith('SELECT') || normalized.startsWith('PRAGMA')) {
    return stmt.all(...params);
  }

  const result = stmt.run(...params);
  return { changes: result.changes, lastID: result.lastInsertRowid };
}

async function query(sql, params = []) {
  if (nativeDb) {
    return runSqlWithNative(sql, params);
  }

  const boundSql = bindParams(sql, params);
  const normalized = boundSql.trim().toUpperCase();

  try {
    if (normalized.startsWith('SELECT') || normalized.startsWith('PRAGMA')) {
      return await runSqlWithCli(`PRAGMA foreign_keys = ON; ${boundSql}`);
    }

    const result = await runSqlWithCli(
      `PRAGMA foreign_keys = ON; ${boundSql}; SELECT changes() AS changes, last_insert_rowid() AS lastID;`
    );

    return result[0] || { changes: 0, lastID: null };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        'SQLite backend bulunamadı. Node.js 24+ (node:sqlite) kullanın veya sqlite3 CLI kurup PATH\'e ekleyin.'
      );
    }
    throw error;
  }
}

module.exports = { query, dbPath, usingNativeSqlite: Boolean(nativeDb) };
