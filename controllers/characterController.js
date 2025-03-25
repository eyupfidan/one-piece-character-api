const cheerio = require('cheerio');
const dbService = require('../services/dbService');
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
    const sql = 'SELECT * FROM characters ORDER BY name';
    const characters = await dbService.query(sql);
    res.json(characters);
  } catch (error) {
    console.error('Character list error:', error);
    res.status(500).json({ error: 'Karakter listesi çekilirken hata oluştu' });
  }
}

async function getCharacterDetail(req, res) {
  try {
    const characterName = req.params.name;
    const sql = 'SELECT * FROM character_details WHERE name = ?';
    const characterDetails = await dbService.query(sql, [characterName]);
    
    if (characterDetails && characterDetails.length > 0) {
      res.json(characterDetails[0]);
    } else {
      res.status(404).json({ error: 'Karakter bulunamadı' });
    }
  } catch (error) {
    console.error('Character detail error:', error);
    res.status(500).json({ error: 'Karakter detay çekilirken hata oluştu' });
  }
}

module.exports = {
  listCharacters,
  getCharacterDetail
};
