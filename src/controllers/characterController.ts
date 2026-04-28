import type { Request, Response } from 'express';
import { query } from '../services/dbService';

function parsePagination(queryParams: Request['query']) {
  const limit = Math.min(Math.max(Number(queryParams.limit) || 50, 1), 200);
  const offset = Math.max(Number(queryParams.offset) || 0, 0);
  const search = String(queryParams.q || '').trim();
  return { limit, offset, search };
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const str = String(value).replace(/"/g, '""');
    return /[",\n]/.test(str) ? `"${str}"` : str;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(header => escapeCell(row[header])).join(','));
  }
  return lines.join('\n');
}

export async function listCharacters(req: Request, res: Response): Promise<void> {
  try {
    const { limit, offset, search } = parsePagination(req.query);
    const includeDetails = req.query.includeDetails === 'true';

    const where = search ? 'WHERE c.name LIKE ?' : '';
    const params = search ? [`%${search}%`, limit, offset] : [limit, offset];

    const sql = includeDetails
      ? `
      SELECT c.*, cd.status, cd.age, cd.birthday, cd.height, cd.affiliations, cd.occupations
      FROM characters c
      LEFT JOIN character_details cd ON cd.name = c.name
      ${where}
      ORDER BY c.name
      LIMIT ? OFFSET ?
    `
      : `
      SELECT c.*
      FROM characters c
      ${where}
      ORDER BY c.name
      LIMIT ? OFFSET ?
    `;

    const countSql = `SELECT COUNT(*) as total FROM characters c ${where}`;
    const countParams = search ? [`%${search}%`] : [];

    const [characters, countRows] = await Promise.all([
      query(sql, params),
      query(countSql, countParams)
    ]);

    res.json({
      meta: {
        total: Number(countRows?.[0]?.total || 0),
        limit,
        offset,
        search,
        includeDetails
      },
      data: characters
    });
  } catch (error) {
    console.error('Character list error:', error);
    res.status(500).json({ error: 'Karakter listesi çekilirken hata oluştu' });
  }
}

export async function exportCharactersJson(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await query('SELECT * FROM characters ORDER BY name');
    res.json({ exportedAt: new Date().toISOString(), total: rows.length, data: rows });
  } catch (error) {
    console.error('Character export JSON error:', error);
    res.status(500).json({ error: 'Karakter JSON dışa aktarma hatası' });
  }
}

export async function exportCharactersCsv(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await query('SELECT * FROM characters ORDER BY name');
    const csv = toCsv(rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="characters.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Character export CSV error:', error);
    res.status(500).json({ error: 'Karakter CSV dışa aktarma hatası' });
  }
}

export async function getCharacterDetail(req: Request, res: Response): Promise<void> {
  try {
    const characterName = req.params.name;
    const characterDetails = await query('SELECT * FROM character_details WHERE name = ?', [characterName]);

    if (characterDetails && characterDetails.length > 0) {
      res.json(characterDetails[0]);
      return;
    }

    res.status(404).json({ error: 'Karakter bulunamadı' });
  } catch (error) {
    console.error('Character detail error:', error);
    res.status(500).json({ error: 'Karakter detay çekilirken hata oluştu' });
  }
}

export async function characterStats(_req: Request, res: Response): Promise<void> {
  try {
    const [countRows, letterRows, yearRows] = await Promise.all([
      query('SELECT COUNT(*) as total FROM characters'),
      query('SELECT letter, COUNT(*) as total FROM characters GROUP BY letter ORDER BY total DESC LIMIT 10'),
      query('SELECT year, COUNT(*) as total FROM characters WHERE year IS NOT NULL AND year != "" GROUP BY year ORDER BY year')
    ]);

    res.json({
      totalCharacters: Number(countRows?.[0]?.total || 0),
      topLetters: letterRows,
      byYear: yearRows
    });
  } catch (error) {
    console.error('Character stats error:', error);
    res.status(500).json({ error: 'Karakter istatistikleri alınamadı' });
  }
}
