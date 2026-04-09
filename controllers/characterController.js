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

async function listCharacters(req, res) {
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
      dbService.query(sql, params),
      dbService.query(countSql, countParams)
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

async function exportCharactersJson(req, res) {
  try {
    const rows = await dbService.query('SELECT * FROM characters ORDER BY name');
    res.json({ exportedAt: new Date().toISOString(), total: rows.length, data: rows });
  } catch (error) {
    console.error('Character export JSON error:', error);
    res.status(500).json({ error: 'Karakter JSON dışa aktarma hatası' });
  }
}

async function exportCharactersCsv(req, res) {
  try {
    const rows = await dbService.query('SELECT * FROM characters ORDER BY name');
    const csv = toCsv(rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="characters.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Character export CSV error:', error);
    res.status(500).json({ error: 'Karakter CSV dışa aktarma hatası' });
  }
}

async function getCharacterDetail(req, res) {
  try {
    const characterName = req.params.name;
    const sql = 'SELECT * FROM character_details WHERE name = ?';
    const characterDetails = await dbService.query(sql, [characterName]);

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


async function characterStats(req, res) {
  try {
    const [countRows, letterRows, yearRows] = await Promise.all([
      dbService.query('SELECT COUNT(*) as total FROM characters'),
      dbService.query('SELECT letter, COUNT(*) as total FROM characters GROUP BY letter ORDER BY total DESC LIMIT 10'),
      dbService.query('SELECT year, COUNT(*) as total FROM characters WHERE year IS NOT NULL AND year != "" GROUP BY year ORDER BY year')
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

module.exports = {
  listCharacters,
  exportCharactersJson,
  exportCharactersCsv,
  characterStats,
  getCharacterDetail
};
