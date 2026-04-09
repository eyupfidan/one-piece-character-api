import axios from 'axios';
import * as cheerio from 'cheerio';
import { fallbackCharacters, fallbackCrews } from '../config/fallbackData';
import type { Character, Crew } from '../types/domain';

const REQUEST_TIMEOUT_MS = Number(process.env.SCRAPER_TIMEOUT_MS) || 10000;

const SOURCES = [
  'https://onepiece.fandom.com',
  'https://breezewiki.com/onepiece'
];

async function fetchFromSources(pathname: string): Promise<string> {
  const errors: string[] = [];

  for (const baseUrl of SOURCES) {
    const url = `${baseUrl}${pathname}`;

    try {
      const { data } = await axios.get<string>(url, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'https://www.google.com/'
        }
      });

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
  const content = await fetchFromSources('/wiki/List_of_Canon_Characters');
  return cheerio.load(content);
}

function parseCharacterList($: cheerio.CheerioAPI): Character[] {
  const characters: Character[] = [];
  const { characterTable } = findCharacterAndCrewTables($);

  characterTable.find('tbody > tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 6) return;

    let letter = $(tds[0]).text().trim();
    const name = $(tds[1]).text().trim();
    const chapter = $(tds[2]).text().trim();
    const episode = $(tds[3]).text().trim();
    const year = $(tds[4]).text().trim();
    const note = $(tds[5]).text().trim();

    if (!letter && name) letter = name.charAt(0);

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

    let letter = $(tds[0]).text().trim();
    const name = $(tds[1]).text().trim();
    const numberOfMembers = $(tds[2]).text().trim();
    const chapter = $(tds[3]).text().trim();
    const episode = $(tds[4]).text().trim();
    const year = $(tds[5]).text().trim();
    const note = $(tds[6]).text().trim();

    if (!letter && name) letter = name.charAt(0);

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
      return { characters, crews };
    }
  } catch {
    // fallback below
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
  const safeName = encodeURIComponent(characterName.replace(/\s+/g, '_'));

  try {
    return await fetchFromSources(`/wiki/${safeName}`);
  } catch {
    return `<section><h2>${characterName}</h2><p>Fallback character detail (network unavailable).</p></section>`;
  }
}
