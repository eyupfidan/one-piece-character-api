const scrapingService = require('../services/scrapingService');

async function listCrews(req, res) {
  try {
    const crews = await scrapingService.getCrewList();
    res.json(crews);
  } catch (error) {
    console.error('Crew list error:', error);
    res.status(500).json({ error: 'Mürettebat listesi çekilirken hata oluştu' });
  }
}

module.exports = {
  listCrews
};
