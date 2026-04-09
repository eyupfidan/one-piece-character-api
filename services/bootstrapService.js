const dbService = require('./dbService');
const {
  fallbackCharacters,
  fallbackCrews,
  fallbackCharacterDetails
} = require('../config/fallbackData');

async function seedCharactersIfEmpty() {
  const rows = await dbService.query('SELECT COUNT(*) as total FROM characters');
  const total = Number(rows?.[0]?.total || 0);
  if (total > 0) return;

  for (const char of fallbackCharacters) {
    await dbService.query(
      `INSERT INTO characters (letter, name, chapter, episode, year, note)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET letter=excluded.letter, chapter=excluded.chapter, episode=excluded.episode, year=excluded.year, note=excluded.note, updated_at=CURRENT_TIMESTAMP`,
      [char.letter, char.name, char.chapter, char.episode, char.year, char.note]
    );
  }
}

async function seedCrewsIfEmpty() {
  const rows = await dbService.query('SELECT COUNT(*) as total FROM crews');
  const total = Number(rows?.[0]?.total || 0);
  if (total > 0) return;

  for (const crew of fallbackCrews) {
    await dbService.query(
      `INSERT INTO crews (letter, name, numberOfMembers, chapter, episode, year, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET letter=excluded.letter, numberOfMembers=excluded.numberOfMembers, chapter=excluded.chapter, episode=excluded.episode, year=excluded.year, note=excluded.note, updated_at=CURRENT_TIMESTAMP`,
      [crew.letter, crew.name, crew.numberOfMembers, crew.chapter, crew.episode, crew.year, crew.note]
    );
  }
}

async function seedCharacterDetailsIfEmpty() {
  const rows = await dbService.query('SELECT COUNT(*) as total FROM character_details');
  const total = Number(rows?.[0]?.total || 0);
  if (total > 0) return;

  for (const detail of fallbackCharacterDetails) {
    const keys = Object.keys(detail);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const updates = keys.filter(k => k !== 'name').map(k => `${k}=excluded.${k}`).join(', ');

    const sql = updates
      ? `INSERT INTO character_details (${columns}) VALUES (${placeholders}) ON CONFLICT(name) DO UPDATE SET ${updates}`
      : `INSERT INTO character_details (${columns}) VALUES (${placeholders}) ON CONFLICT(name) DO NOTHING`;

    await dbService.query(sql, Object.values(detail));
  }
}

async function bootstrapLocalData() {
  await seedCharactersIfEmpty();
  await seedCrewsIfEmpty();
  await seedCharacterDetailsIfEmpty();
}

module.exports = {
  bootstrapLocalData
};
