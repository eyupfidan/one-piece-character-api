const dbService = require('../services/dbService');

async function listCrews(req, res) {
  try {
    const sql = 'SELECT * FROM crews ORDER BY name';
    const crews = await dbService.query(sql);
    res.json(crews);
  } catch (error) {
    console.error('Crew list error:', error);
    res.status(500).json({ error: 'Mürettebat listesi çekilirken hata oluştu' });
  }
}

module.exports = {
  listCrews
};
