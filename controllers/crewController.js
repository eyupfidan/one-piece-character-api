const dbService = require('../services/dbService');

function parsePagination(query) {
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const search = (query.q || '').trim();
  return { limit, offset, search };
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => {
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

async function listCrews(req, res) {
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
      dbService.query(sql, params),
      dbService.query(countSql, countParams)
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

async function exportCrewsJson(req, res) {
  try {
    const rows = await dbService.query('SELECT * FROM crews ORDER BY name');
    res.json({ exportedAt: new Date().toISOString(), total: rows.length, data: rows });
  } catch (error) {
    console.error('Crew export JSON error:', error);
    res.status(500).json({ error: 'Mürettebat JSON dışa aktarma hatası' });
  }
}

async function exportCrewsCsv(req, res) {
  try {
    const rows = await dbService.query('SELECT * FROM crews ORDER BY name');
    const csv = toCsv(rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="crews.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Crew export CSV error:', error);
    res.status(500).json({ error: 'Mürettebat CSV dışa aktarma hatası' });
  }
}


async function crewStats(req, res) {
  try {
    const [countRows, letterRows] = await Promise.all([
      dbService.query('SELECT COUNT(*) as total FROM crews'),
      dbService.query('SELECT letter, COUNT(*) as total FROM crews GROUP BY letter ORDER BY total DESC LIMIT 10')
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

module.exports = {
  listCrews,
  exportCrewsJson,
  exportCrewsCsv,
  crewStats
};
