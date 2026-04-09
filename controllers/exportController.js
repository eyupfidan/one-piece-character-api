const dbService = require('../services/dbService');

async function exportFullJson(req, res) {
  try {
    const [characters, details, crews] = await Promise.all([
      dbService.query('SELECT * FROM characters ORDER BY name'),
      dbService.query('SELECT * FROM character_details ORDER BY name'),
      dbService.query('SELECT * FROM crews ORDER BY name')
    ]);

    const detailMap = new Map(details.map(item => [item.name, item]));
    const enrichedCharacters = characters.map(char => ({
      ...char,
      details: detailMap.get(char.name) || null
    }));

    res.json({
      exportedAt: new Date().toISOString(),
      totals: {
        characters: characters.length,
        details: details.length,
        crews: crews.length
      },
      characters: enrichedCharacters,
      crews
    });
  } catch (error) {
    console.error('Full export error:', error);
    res.status(500).json({ error: 'Tam veri dışa aktarma hatası' });
  }
}

module.exports = {
  exportFullJson
};
