import cron from 'node-cron';
import * as scrapingService from '../services/scrapingService';
import { writeCache } from '../services/cacheService';
import { query } from '../services/dbService';
import { fetchAndSaveCharacterDetail, hasRichCharacterDetail } from '../services/characterDetailService';
import type { Character } from '../types/domain';

interface SyncStatus {
  listRunning: boolean;
  detailRunning: boolean;
  listStartedAt: string | null;
  listFinishedAt: string | null;
  detailStartedAt: string | null;
  detailFinishedAt: string | null;
  totalCharacters: number;
  totalCrews: number;
  detailTotal: number;
  detailProcessed: number;
  detailSucceeded: number;
  detailFailed: number;
  lastError: string | null;
  lastDetail: string | null;
}

const DETAIL_CONCURRENCY = Math.max(Number(process.env.DETAIL_CONCURRENCY || process.env.DETAIL_BATCH_SIZE) || 8, 1);
const DETAIL_BATCH_DELAY_MS = Math.max(Number(process.env.DETAIL_BATCH_DELAY_MS) || 100, 0);
const SYNC_DETAILS_ON_START = process.env.SYNC_DETAILS_ON_START !== 'false';

const syncStatus: SyncStatus = {
  listRunning: false,
  detailRunning: false,
  listStartedAt: null,
  listFinishedAt: null,
  detailStartedAt: null,
  detailFinishedAt: null,
  totalCharacters: 0,
  totalCrews: 0,
  detailTotal: 0,
  detailProcessed: 0,
  detailSucceeded: 0,
  detailFailed: 0,
  lastError: null,
  lastDetail: null
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

async function getCharactersMissingDetails(characters: Character[]): Promise<Character[]> {
  const rows = await query('SELECT name, japaneseName, romanizedName, officialEnglishName, debut, bounty, devilFruitJapaneseName FROM character_details');
  const existing = new Set((rows || [])
    .filter((row: any) => hasRichCharacterDetail(row))
    .map((row: { name: string }) => row.name));

  return characters.filter(char => !existing.has(char.name));
}

async function deleteRowsMissingFromSource(tableName: 'characters' | 'character_details' | 'crews', sourceNames: string[]): Promise<void> {
  const sourceNameSet = new Set(sourceNames);
  const rows = await query(`SELECT name FROM ${tableName}`);

  for (const row of rows || []) {
    if (sourceNameSet.has(row.name)) continue;
    // eslint-disable-next-line no-await-in-loop
    await query(`DELETE FROM ${tableName} WHERE name = ?`, [row.name]);
  }
}

async function updateCharacterDetails(characters: Character[], concurrency = DETAIL_CONCURRENCY): Promise<void> {
  const targetCharacters = await getCharactersMissingDetails(characters);
  syncStatus.detailRunning = true;
  syncStatus.detailStartedAt = new Date().toISOString();
  syncStatus.detailFinishedAt = null;
  syncStatus.detailTotal = targetCharacters.length;
  syncStatus.detailProcessed = 0;
  syncStatus.detailSucceeded = 0;
  syncStatus.detailFailed = 0;
  syncStatus.lastError = null;
  syncStatus.lastDetail = null;

  if (!targetCharacters.length) {
    syncStatus.detailRunning = false;
    syncStatus.detailFinishedAt = new Date().toISOString();
    console.log('Karakter detayları güncel; yeni detay çekilecek kayıt yok.');
    return;
  }

  console.log(`Karakter detayları güncelleniyor: ${targetCharacters.length} eksik kayıt, concurrency=${concurrency}`);

  for (let i = 0; i < targetCharacters.length; i += concurrency) {
    const batch = targetCharacters.slice(i, i + concurrency);

    await Promise.all(batch.map(async (char) => {
      try {
        await fetchAndSaveCharacterDetail(char.name);
        syncStatus.detailSucceeded += 1;
        syncStatus.lastDetail = char.name;
      } catch (detailError: any) {
        syncStatus.detailFailed += 1;
        syncStatus.lastError = detailError.message || String(detailError);
        console.error(`Error updating details for ${char.name}:`, detailError.message || detailError);
      } finally {
        syncStatus.detailProcessed += 1;
      }
    }));

    console.log(`Karakter detay ilerleme: ${syncStatus.detailProcessed}/${syncStatus.detailTotal}`);

    if (DETAIL_BATCH_DELAY_MS > 0 && i + concurrency < targetCharacters.length) {
      await delay(DETAIL_BATCH_DELAY_MS);
    }
  }

  syncStatus.detailRunning = false;
  syncStatus.detailFinishedAt = new Date().toISOString();
  console.log(`Karakter detay güncellemesi tamamlandı. Başarılı=${syncStatus.detailSucceeded}, Hatalı=${syncStatus.detailFailed}`);
}

export async function updateDatabase(): Promise<void> {
  try {
    console.log('Starting daily scraping job...');
    syncStatus.listRunning = true;
    syncStatus.listStartedAt = new Date().toISOString();
    syncStatus.listFinishedAt = null;
    syncStatus.lastError = null;

    const { characters, crews } = await scrapingService.getCharacterAndCrewLists();
    syncStatus.totalCharacters = characters.length;
    syncStatus.totalCrews = crews.length;

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

    if (characters.length > 100) {
      await deleteRowsMissingFromSource('character_details', characters.map(char => char.name));
      await deleteRowsMissingFromSource('characters', characters.map(char => char.name));
      await deleteRowsMissingFromSource('crews', crews.map(crew => crew.name));
    }

    await writeCache({ characters, crews });

    syncStatus.listRunning = false;
    syncStatus.listFinishedAt = new Date().toISOString();

    if (SYNC_DETAILS_ON_START) {
      updateCharacterDetails(characters).catch(error => {
        syncStatus.detailRunning = false;
        syncStatus.detailFinishedAt = new Date().toISOString();
        syncStatus.lastError = error.message || String(error);
        console.error('Karakter detayları güncelleme hatası:', error);
      });
    }

    console.log(`Daily scraping list job completed. characters=${characters.length}, crews=${crews.length}`);
  } catch (err: any) {
    syncStatus.listRunning = false;
    syncStatus.listFinishedAt = new Date().toISOString();
    syncStatus.lastError = err.message || String(err);
    console.error('Error in daily scraping job:', err.message || err);
  }
}

cron.schedule(process.env.CRON_SCHEDULE || '0 0 * * *', () => {
  void updateDatabase();
});

export default updateDatabase;
