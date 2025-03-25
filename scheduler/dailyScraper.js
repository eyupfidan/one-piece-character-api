const cron = require('node-cron');
const scrapingService = require('../services/scrapingService');
const dbService = require('../services/dbService');
const cheerio = require('cheerio');
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

// Rate limiting için yardımcı fonksiyon
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Karakter detaylarını güncelleme fonksiyonu
async function updateCharacterDetails(characters, batchSize = 5) {
  console.log("Karakter detayları güncelleniyor...");
  
  // Karakterleri batch'lere böl
  for (let i = 0; i < characters.length; i += batchSize) {
    const batch = characters.slice(i, i + batchSize);
    
    // Her batch için parallel işlem
    await Promise.all(batch.map(async (char) => {
      try {
        const content = await scrapingService.getCharacterDetails(char.name);
        const $ = cheerio.load(content);

        const statisticsData = extractSectionData($, 'Statistics', statisticsMapping) || {};
        const portrayalData = extractSectionData($, 'Portrayal', portrayalMapping) || {};
        const devilFruitData = extractSectionData($, 'Devil Fruit', devilFruitMapping) || {};

        const detailData = {
          name: char.name,
          ...statisticsData,
          ...portrayalData,
          ...devilFruitData
        };

        const columns = Object.keys(detailData).join(', ');
        const values = Object.keys(detailData).map(() => '?').join(', ');
        const updates = Object.keys(detailData)
          .filter(key => key !== 'name')
          .map(key => `${key}=?`)
          .join(', ');

        const detailSql = `
          INSERT INTO character_details (${columns})
          VALUES (${values})
          ON DUPLICATE KEY UPDATE ${updates};
        `;

        const detailParams = [
          ...Object.values(detailData),
          ...Object.values(detailData).slice(1)
        ];

        await dbService.query(detailSql, detailParams);
        console.log(`Updated details for character: ${char.name}`);
      } catch (detailError) {
        console.error(`Error updating details for ${char.name}:`, detailError);
      }
    }));

    // Her batch sonrası bekle
    await delay(1000);
  }
}

async function updateDatabase() {
  try {
    console.log("Starting daily scraping job...");

    // Karakter listesini güncelleme
    const characters = await scrapingService.getCharacterList();
    for (const char of characters) {
      const sql = `
        INSERT INTO characters (letter, name, chapter, episode, year, note)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE letter=?, chapter=?, episode=?, year=?, note=?;
      `;
      const params = [
        char.letter, char.name, char.chapter, char.episode, char.year, char.note,
        char.letter, char.chapter, char.episode, char.year, char.note,
      ];
      await dbService.query(sql, params);
    }
    console.log("Character list updated.");

    // Mürettebat listesini güncelleme
    const crews = await scrapingService.getCrewList();
    for (const crew of crews) {
      const sql = `
        INSERT INTO crews (letter, name, numberOfMembers, chapter, episode, year, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE letter=?, numberOfMembers=?, chapter=?, episode=?, year=?, note=?;
      `;
      const params = [
        crew.letter, crew.name, crew.numberOfMembers, crew.chapter, crew.episode, crew.year, crew.note,
        crew.letter, crew.numberOfMembers, crew.chapter, crew.episode, crew.year, crew.note,
      ];
      await dbService.query(sql, params);
    }
    console.log("Crew list updated.");

    // Karakter detaylarını arka planda güncelle
    updateCharacterDetails(characters).catch(error => {
      console.error('Karakter detayları güncelleme hatası:', error);
    });

    console.log("Daily scraping job completed.");
  } catch (err) {
    console.error("Error in daily scraping job:", err);
  }
}

// Her gün gece yarısı çalıştır
cron.schedule(process.env.CRON_SCHEDULE || '0 0 * * *', () => {
  updateDatabase();
});

module.exports = updateDatabase;
