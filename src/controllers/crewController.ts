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

export async function listCrews(req: Request, res: Response): Promise<void> {
  try {
    const { limit, offset, search } = parsePagination(req.query);

    const where = search ? 'WHERE c.name LIKE ?' : '';
    const params = search ? [`%${search}%`, limit, offset] : [limit, offset];

    const sql = `
      SELECT c.*
      FROM crews c
      ${where}
      ORDER BY c.name
      LIMIT ? OFFSET ?
    `;

    const countSql = `SELECT COUNT(*) as total FROM crews c ${where}`;
    const countParams = search ? [`%${search}%`] : [];

    const [crews, countRows] = await Promise.all([
      query(sql, params),
      query(countSql, countParams)
    ]);

    res.json({
      meta: {
        total: Number(countRows?.[0]?.total || 0),
        limit,
        offset,
        search
      },
      data: crews
    });
  } catch (error) {
    console.error('Crew list error:', error);
    res.status(500).json({ error: 'Mürettebat listesi çekilirken hata oluştu' });
  }
}

export async function exportCrewsJson(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await query('SELECT * FROM crews ORDER BY name');
    res.json({ exportedAt: new Date().toISOString(), total: rows.length, data: rows });
  } catch (error) {
    console.error('Crew export JSON error:', error);
    res.status(500).json({ error: 'Mürettebat JSON dışa aktarma hatası' });
  }
}

export async function exportCrewsCsv(_req: Request, res: Response): Promise<void> {
  try {
    const rows = await query('SELECT * FROM crews ORDER BY name');
    const csv = toCsv(rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="crews.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Crew export CSV error:', error);
    res.status(500).json({ error: 'Mürettebat CSV dışa aktarma hatası' });
  }
}

export async function crewStats(_req: Request, res: Response): Promise<void> {
  try {
    const [countRows, letterRows] = await Promise.all([
      query('SELECT COUNT(*) as total FROM crews'),
      query('SELECT letter, COUNT(*) as total FROM crews GROUP BY letter ORDER BY total DESC LIMIT 10')
    ]);

    res.json({
      totalCrews: Number(countRows?.[0]?.total || 0),
      topLetters: letterRows
    });
  } catch (error) {
    console.error('Crew stats error:', error);
    res.status(500).json({ error: 'Mürettebat istatistikleri alınamadı' });
  }
}
