const cheerio = require('cheerio');
const scrapingService = require('../services/scrapingService');
const extractSectionData = require('../utils/extractSection');

const statisticsMapping = {
  jname: 'japaneseName',
  rname: 'romanizedName',
  ename: 'officialEnglishName',
  first: 'debut',
  affiliation: 'affiliations',
  occupation: 'occupations',
  origin: 'origin',
  residence: 'residence',
  alias: 'alias',
  epithet: 'epithet',
  status: 'status',
  age: 'age',
  birth: 'birthday',
  height: 'height',
  "blood type": 'bloodType',
  bounty: 'bounty'
};

const portrayalMapping = {
  jva: 'japaneseVoice',
  eva: 'englishVoice',
  liveaction: 'liveActionPortrayal'
};

const devilFruitMapping = {
  dfname: 'devilFruitJapaneseName',
  dfename: 'devilFruitEnglishName',
  dfmeaning: 'devilFruitMeaning',
  dftype: 'devilFruitType'
};

async function listCharacters(req, res) {
  try {
    const characters = await scrapingService.getCharacterList();
    res.json(characters);
  } catch (error) {
    console.error('Character list error:', error);
    res.status(500).json({ error: 'Karakter listesi çekilirken hata oluştu' });
  }
}

async function getCharacterDetail(req, res) {
  try {
    const characterName = req.params.name;
    const content = await scrapingService.getCharacterDetails(characterName);
    const $ = cheerio.load(content);

    const statisticsData = extractSectionData($, 'Statistics', statisticsMapping);
    const portrayalData = extractSectionData($, 'Portrayal', portrayalMapping);
    const devilFruitData = extractSectionData($, 'Devil Fruit', devilFruitMapping);

    const result = {};
    if (statisticsData) result.statistics = statisticsData;
    if (portrayalData) result.portrayal = portrayalData;
    if (devilFruitData) result.devilFruit = devilFruitData;

    console.log(`Extracted details for ${characterName}:`, result);
    res.json(result);
  } catch (error) {
    console.error('Character detail error:', error);
    res.status(500).json({ error: 'Karakter detay çekilirken hata oluştu' });
  }
}

module.exports = {
  listCharacters,
  getCharacterDetail
};
