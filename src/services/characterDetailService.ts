import * as cheerio from 'cheerio';
import * as scrapingService from './scrapingService';
import { query } from './dbService';
import extractSectionData from '../utils/extractSection';
import type { CharacterDetail } from '../types/domain';

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

function toDetailData(characterName: string, html: string): CharacterDetail {
  const $ = cheerio.load(html);

  return {
    name: characterName,
    ...extractSectionData($, 'Statistics', statisticsMapping),
    ...extractSectionData($, 'Portrayal', portrayalMapping),
    ...extractSectionData($, 'Devil Fruit', devilFruitMapping)
  };
}

export function hasRichCharacterDetail(detail: Partial<CharacterDetail> | null | undefined): boolean {
  return Boolean(
    detail?.japaneseName ||
    detail?.romanizedName ||
    detail?.officialEnglishName ||
    detail?.debut ||
    detail?.bounty ||
    detail?.devilFruitJapaneseName
  );
}

async function upsertCharacterDetail(detailData: CharacterDetail): Promise<CharacterDetail> {
  const columns = Object.keys(detailData).join(', ');
  const values = Object.keys(detailData).map(() => '?').join(', ');
  const updateKeys = Object.keys(detailData).filter(key => key !== 'name');
  const updates = updateKeys.map(key => `${key}=excluded.${key}`).join(', ');

  const detailSql = updates
    ? `INSERT INTO character_details (${columns}) VALUES (${values}) ON CONFLICT(name) DO UPDATE SET ${updates}, updated_at=CURRENT_TIMESTAMP;`
    : `INSERT INTO character_details (${columns}) VALUES (${values}) ON CONFLICT(name) DO NOTHING;`;

  await query(detailSql, Object.values(detailData));
  return detailData;
}

export async function fetchAndSaveCharacterDetail(characterName: string): Promise<CharacterDetail> {
  const content = await scrapingService.getCharacterDetails(characterName);
  const detailData = toDetailData(characterName, content);

  return upsertCharacterDetail(detailData);
}

export async function getStoredCharacterDetail(characterName: string): Promise<CharacterDetail | null> {
  const rows = await query('SELECT * FROM character_details WHERE name = ?', [characterName]);
  return rows?.[0] || null;
}

export async function getOrFetchCharacterDetail(characterName: string, forceRefresh = false): Promise<CharacterDetail | null> {
  if (!forceRefresh) {
    const stored = await getStoredCharacterDetail(characterName);
    if (hasRichCharacterDetail(stored)) return stored;
  }

  try {
    await fetchAndSaveCharacterDetail(characterName);
    return getStoredCharacterDetail(characterName);
  } catch (error: any) {
    console.error(`Character detail fetch failed for ${characterName}:`, error.message || error);
    return getStoredCharacterDetail(characterName);
  }
}
