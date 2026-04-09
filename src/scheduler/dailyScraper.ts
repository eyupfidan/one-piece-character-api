import cron from 'node-cron';
import * as cheerio from 'cheerio';
import * as scrapingService from '../services/scrapingService';
import { writeCache } from '../services/cacheService';
import { query } from '../services/dbService';
import extractSectionData from '../utils/extractSection';
import type { Character } from '../types/domain';

const statisticsMapping: Record<string, string> = {
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
  'blood type': 'bloodType',
  bounty: 'bounty'
};

const portrayalMapping: Record<string, string> = {
  jva: 'japaneseVoice',
  eva: 'englishVoice',
  liveaction: 'liveActionPortrayal'
};

const devilFruitMapping: Record<string, string> = {
  dfname: 'devilFruitJapaneseName',
  dfename: 'devilFruitEnglishName',
  dfmeaning: 'devilFruitMeaning',
  dftype: 'devilFruitType'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function updateCharacterDetails(characters: Character[], batchSize = Number(process.env.DETAIL_BATCH_SIZE) || 5): Promise<void> {
  console.log('Karakter detayları güncelleniyor...');

  for (let i = 0; i < characters.length; i += batchSize) {
    const batch = characters.slice(i, i + batchSize);

    for (const char of batch) {
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
        } as Record<string, string>;

        const columns = Object.keys(detailData).join(', ');
        const values = Object.keys(detailData).map(() => '?').join(', ');
        const updateKeys = Object.keys(detailData).filter(key => key !== 'name');
        const updates = updateKeys.map(key => `${key}=?`).join(', ');

        const detailSql = updates
          ? `INSERT INTO character_details (${columns}) VALUES (${values}) ON CONFLICT(name) DO UPDATE SET ${updates};`
          : `INSERT INTO character_details (${columns}) VALUES (${values}) ON CONFLICT(name) DO NOTHING;`;

        const detailParams = updates
          ? [...Object.values(detailData), ...Object.values(detailData).slice(1)]
          : [...Object.values(detailData)];

        await query(detailSql, detailParams);
        console.log(`Updated details for character: ${char.name}`);
      } catch (detailError: any) {
        console.error(`Error updating details for ${char.name}:`, detailError.message || detailError);
      }
    }

    await delay(1000);
  }
}

export async function updateDatabase(): Promise<void> {
  try {
    console.log('Starting daily scraping job...');

    const { characters, crews } = await scrapingService.getCharacterAndCrewLists();
    for (const char of characters) {
      const sql = `
        INSERT INTO characters (letter, name, chapter, episode, year, note)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET letter=?, chapter=?, episode=?, year=?, note=?, updated_at=CURRENT_TIMESTAMP;
      `;
      const params = [
        char.letter, char.name, char.chapter, char.episode, char.year, char.note,
        char.letter, char.chapter, char.episode, char.year, char.note
      ];
      // eslint-disable-next-line no-await-in-loop
      await query(sql, params);
    }
    console.log('Character list updated.');

    for (const crew of crews) {
      const sql = `
        INSERT INTO crews (letter, name, numberOfMembers, chapter, episode, year, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(name) DO UPDATE SET letter=?, numberOfMembers=?, chapter=?, episode=?, year=?, note=?, updated_at=CURRENT_TIMESTAMP;
      `;
      const params = [
        crew.letter, crew.name, crew.numberOfMembers, crew.chapter, crew.episode, crew.year, crew.note,
        crew.letter, crew.numberOfMembers, crew.chapter, crew.episode, crew.year, crew.note
      ];
      // eslint-disable-next-line no-await-in-loop
      await query(sql, params);
    }
    console.log('Crew list updated.');

    await writeCache({ characters, crews });

    updateCharacterDetails(characters).catch(error => {
      console.error('Karakter detayları güncelleme hatası:', error);
    });

    console.log('Daily scraping job completed.');
  } catch (err: any) {
    console.error('Error in daily scraping job:', err.message || err);
  }
}

cron.schedule(process.env.CRON_SCHEDULE || '0 0 * * *', () => {
  void updateDatabase();
});

export default updateDatabase;
