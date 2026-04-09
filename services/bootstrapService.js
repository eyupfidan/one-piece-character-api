const dbService = require('./dbService');
const { readCache } = require('./cacheService');
const {
  fallbackCharacters,
  fallbackCrews,
  fallbackCharacterDetails
} = require('../config/fallbackData');

function normalizeSeedData(cache) {
  return {
    characters: Array.isArray(cache?.characters) && cache.characters.length ? cache.characters : fallbackCharacters,
    crews: Array.isArray(cache?.crews) && cache.crews.length ? cache.crews : fallbackCrews,
    details: Array.isArray(cache?.details) && cache.details.length ? cache.details : fallbackCharacterDetails
  };
}

async function seedCharactersIfEmpty(characters) {
  const rows = await dbService.query('SELECT COUNT(*) as total FROM characters');
  const total = Number(rows?.[0]?.total || 0);
  if (total > 0) return;

  for (const char of characters) {
    await dbService.query(
      `INSERT INTO characters (letter, name, chapter, episode, year, note)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET letter=excluded.letter, chapter=excluded.chapter, episode=excluded.episode, year=excluded.year, note=excluded.note, updated_at=CURRENT_TIMESTAMP`,
      [char.letter || '', char.name, char.chapter || '', char.episode || '', char.year || '', char.note || 'Seed dataset']
    );
  }
}

async function seedCrewsIfEmpty(crews) {
  const rows = await dbService.query('SELECT COUNT(*) as total FROM crews');
  const total = Number(rows?.[0]?.total || 0);
  if (total > 0) return;

  for (const crew of crews) {
    await dbService.query(
      `INSERT INTO crews (letter, name, numberOfMembers, chapter, episode, year, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET letter=excluded.letter, numberOfMembers=excluded.numberOfMembers, chapter=excluded.chapter, episode=excluded.episode, year=excluded.year, note=excluded.note, updated_at=CURRENT_TIMESTAMP`,
      [crew.letter || '', crew.name, crew.numberOfMembers || '', crew.chapter || '', crew.episode || '', crew.year || '', crew.note || 'Seed dataset']
    );
  }
}

async function seedCharacterDetailsIfEmpty(details) {
  const rows = await dbService.query('SELECT COUNT(*) as total FROM character_details');
  const total = Number(rows?.[0]?.total || 0);
  if (total > 0) return;

  for (const detail of details) {
    if (!detail?.name) continue;

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
  const cache = await readCache();
  const seed = normalizeSeedData(cache);

  await seedCharactersIfEmpty(seed.characters);
  await seedCrewsIfEmpty(seed.crews);
  await seedCharacterDetailsIfEmpty(seed.details);
}

module.exports = {
  bootstrapLocalData
};
