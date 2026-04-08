const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execFileAsync = promisify(execFile);
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../data/onepiece.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

function toSqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';

  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

function bindParams(sql, params = []) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    if (index >= params.length) {
      throw new Error('SQL parametre sayısı yetersiz.');
    }
    const literal = toSqlLiteral(params[index]);
    index += 1;
    return literal;
  });
}

async function runSql(sql) {
  const { stdout } = await execFileAsync('sqlite3', ['-json', dbPath, sql]);
  return stdout.trim() ? JSON.parse(stdout) : [];
}

async function query(sql, params = []) {
  const boundSql = bindParams(sql, params);
  const normalized = boundSql.trim().toUpperCase();

  if (normalized.startsWith('SELECT') || normalized.startsWith('PRAGMA')) {
    return runSql(`PRAGMA foreign_keys = ON; ${boundSql}`);
  }

  const result = await runSql(
    `PRAGMA foreign_keys = ON; ${boundSql}; SELECT changes() AS changes, last_insert_rowid() AS lastID;`
  );

  return result[0] || { changes: 0, lastID: null };
}

module.exports = { query, dbPath };
