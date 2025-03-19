const cron = require('node-cron');
const scrapingService = require('../services/scrapingService');
const dbService = require('../services/dbService');

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

    console.log("Daily scraping job completed.");
  } catch (err) {
    console.error("Error in daily scraping job:", err);
  }
}

cron.schedule(process.env.CRON_SCHEDULE || '0 0 * * *', () => {
  updateDatabase();
});

module.exports = updateDatabase;
