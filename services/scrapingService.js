const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://onepiece.fandom.com/wiki';
const CANON_CHARACTERS_PATH = '/List_of_Canon_Characters';
const REQUEST_TIMEOUT_MS = Number(process.env.SCRAPER_TIMEOUT_MS) || 10000;

async function fetchPageContent(url) {
  const { data } = await axios.get(url, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      'User-Agent': 'one-piece-character-api/1.0 (+https://github.com)'
    }
  });

  return data;
}

async function getCanonCharactersPage() {
  const url = `${BASE_URL}${CANON_CHARACTERS_PATH}`;
  const content = await fetchPageContent(url);
  return cheerio.load(content);
}

function parseCharacterList($) {
  const characters = [];
  const table = $('table.fandom-table.sortable.jquery-tablesorter').first();

  table.find('tbody > tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 6) return;

    let letter = $(tds[0]).text().trim();
    const name = $(tds[1]).text().trim();
    const chapter = $(tds[2]).text().trim();
    const episode = $(tds[3]).text().trim();
    const year = $(tds[4]).text().trim();
    const note = $(tds[5]).text().trim();

    if (!letter && name) {
      letter = name.charAt(0);
    }

    characters.push({ letter, name, chapter, episode, year, note });
  });

  return characters;
}

function parseCrewList($) {
  const crews = [];
  const table = $('table.fandom-table.sortable.jquery-tablesorter').eq(1);

  table.find('tbody > tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 7) return;

    let letter = $(tds[0]).text().trim();
    const name = $(tds[1]).text().trim();
    const numberOfMembers = $(tds[2]).text().trim();
    const chapter = $(tds[3]).text().trim();
    const episode = $(tds[4]).text().trim();
    const year = $(tds[5]).text().trim();
    const note = $(tds[6]).text().trim();

    if (!letter && name) {
      letter = name.charAt(0);
    }

    crews.push({ letter, name, numberOfMembers, chapter, episode, year, note });
  });

  return crews;
}

async function getCharacterList() {
  const $ = await getCanonCharactersPage();
  return parseCharacterList($);
}

async function getCrewList() {
  const $ = await getCanonCharactersPage();
  return parseCrewList($);
}

async function getCharacterAndCrewLists() {
  const $ = await getCanonCharactersPage();

  return {
    characters: parseCharacterList($),
    crews: parseCrewList($)
  };
}

async function getCharacterDetails(characterName) {
  const safeName = encodeURIComponent(characterName.replace(/\s+/g, '_'));
  const url = `${BASE_URL}/${safeName}`;
  return fetchPageContent(url);
}

module.exports = {
  getCharacterList,
  getCrewList,
  getCharacterAndCrewLists,
  getCharacterDetails
};
