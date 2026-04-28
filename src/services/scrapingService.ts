import axios from 'axios';
import * as cheerio from 'cheerio';
import { fallbackCharacters, fallbackCrews } from '../config/fallbackData';
import type { Character, Crew } from '../types/domain';

const REQUEST_TIMEOUT_MS = Number(process.env.SCRAPER_TIMEOUT_MS) || 10000;
const FANDOM_API_URL = 'https://onepiece.fandom.com/api.php';

const SOURCES = [
  'https://onepiece.fandom.com'
];

const http = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'User-Agent': 'one-piece-character-api/1.0 (+https://github.com/eyupfidan/one-piece-character-api)',
    Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  }
});

function normalizeText(value: string): string {
  return value.replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeNumber(value: string): string {
  const cleaned = normalizeText(value);
  if (!/^\d+$/.test(cleaned)) return cleaned;
  return String(Number(cleaned));
}

function textFromCell($: cheerio.CheerioAPI, cell: any, preferLink = false): string {
  if (preferLink) {
    const linkText = $(cell).find('a').first().text().trim();
    if (linkText) return normalizeText(linkText);
  }

  return normalizeText($(cell).text());
}

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

async function fetchParsedPage(page: string): Promise<string> {
  const { data } = await http.get(FANDOM_API_URL, {
    params: {
      action: 'parse',
      page,
      prop: 'text',
      format: 'json',
      origin: '*',
      redirects: 1,
      disableeditsection: 1,
      disablelimitreport: 1
    }
  });

  const html = data?.parse?.text?.['*'];
  if (typeof html !== 'string' || !html.trim()) {
    throw new Error(`MediaWiki API parse response is empty for page "${page}".`);
  }

  return html;
}

async function fetchFromSources(pathname: string): Promise<string> {
  const errors: string[] = [];

  for (const baseUrl of SOURCES) {
    const url = `${baseUrl}${pathname}`;

    try {
      const { data } = await http.get<string>(url);

      return data;
    } catch (error: any) {
      const status = error.response?.status;
      errors.push(`${url} -> ${status || error.code || error.message}`);
    }
  }

  const err = new Error(`Tüm kaynaklardan veri çekilemedi: ${errors.join(' | ')}`) as Error & { code?: string };
  err.code = 'SCRAPE_SOURCE_UNAVAILABLE';
  throw err;
}

function findCharacterAndCrewTables($: cheerio.CheerioAPI): { characterTable: cheerio.Cheerio<any>; crewTable: cheerio.Cheerio<any> } {
  const preferred = $('table.fandom-table.sortable.jquery-tablesorter');
  if (preferred.length >= 2) {
    return {
      characterTable: preferred.first(),
      crewTable: preferred.eq(1)
    };
  }

  const allTables = $('table').filter((_, table) => {
    const headers = $(table).find('th').map((__, th) => $(th).text().trim().toLowerCase()).get();
    return headers.includes('name') && (headers.includes('chapter') || headers.includes('episode'));
  });

  return {
    characterTable: allTables.first(),
    crewTable: allTables.eq(1)
  };
}

async function getCanonCharactersPage(): Promise<cheerio.CheerioAPI> {
  const content = await fetchParsedPage('List_of_Canon_Characters');
  return cheerio.load(content);
}

function parseCharacterList($: cheerio.CheerioAPI): Character[] {
  const characters: Character[] = [];
  const { characterTable } = findCharacterAndCrewTables($);

  characterTable.find('tbody > tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 6) return;

    let letter = textFromCell($, tds[0]);
    const name = textFromCell($, tds[1], true);
    const chapter = normalizeNumber(textFromCell($, tds[2]));
    const episode = normalizeNumber(textFromCell($, tds[3]));
    const year = normalizeText($(tds[4]).text());
    const note = normalizeText($(tds[5]).text());

    if (!letter && name) letter = name.charAt(0);
    if (!name) return;

    characters.push({ letter, name, chapter, episode, year, note });
  });

  return characters;
}

function parseCrewList($: cheerio.CheerioAPI): Crew[] {
  const crews: Crew[] = [];
  const { crewTable } = findCharacterAndCrewTables($);

  crewTable.find('tbody > tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 7) return;

    let letter = textFromCell($, tds[0]);
    const name = textFromCell($, tds[1], true);
    const numberOfMembers = normalizeText($(tds[2]).text());
    const chapter = normalizeNumber(textFromCell($, tds[3]));
    const episode = normalizeNumber(textFromCell($, tds[4]));
    const year = normalizeText($(tds[5]).text());
    const note = normalizeText($(tds[6]).text());

    if (!letter && name) letter = name.charAt(0);
    if (!name) return;

    crews.push({ letter, name, numberOfMembers, chapter, episode, year, note });
  });

  return crews;
}

export async function getCharacterAndCrewLists(): Promise<{ characters: Character[]; crews: Crew[] }> {
  try {
    const $ = await getCanonCharactersPage();
    const characters = parseCharacterList($);
    const crews = parseCrewList($);

    if (characters.length > 0 && crews.length > 0) {
      return {
        characters: dedupeByName(characters),
        crews: dedupeByName(crews)
      };
    }
  } catch (error: any) {
    console.warn('Live character list could not be fetched, using fallback seed:', error.message || error);
  }

  return {
    characters: fallbackCharacters,
    crews: fallbackCrews
  };
}

export async function getCharacterList(): Promise<Character[]> {
  const { characters } = await getCharacterAndCrewLists();
  return characters;
}

export async function getCrewList(): Promise<Crew[]> {
  const { crews } = await getCharacterAndCrewLists();
  return crews;
}

export async function getCharacterDetails(characterName: string): Promise<string> {
  const pageName = characterName.trim().replace(/\s+/g, '_');

  try {
    return await fetchParsedPage(pageName);
  } catch (apiError) {
    const safeName = encodeURIComponent(pageName);
    return await fetchFromSources(`/wiki/${safeName}`).catch(() => {
      throw apiError;
    });
  }
}
