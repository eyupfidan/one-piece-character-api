const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const puppeteerConfig = require('../config/puppeteer.config');

async function fetchPageContent(url, waitSelector) {
  const browser = await puppeteer.launch(puppeteerConfig);
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  if (waitSelector) {
    await page.waitForSelector(waitSelector);
  }
  const content = await page.content();
  await browser.close();
  return content;
}

async function getCharacterList() {
  const url = 'https://onepiece.fandom.com/wiki/List_of_Canon_Characters';
  const content = await fetchPageContent(url, 'table.fandom-table.sortable.jquery-tablesorter');
  const $ = cheerio.load(content);
  const characters = [];
  // İlk tabloyu seçiyoruz.
  const table = $('table.fandom-table.sortable.jquery-tablesorter').first();
  table.find('tbody > tr').each((i, row) => {
    const tds = $(row).find('td');
    if (tds.length >= 6) {
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
    }
  });
  return characters;
}

async function getCrewList() {
  const url = 'https://onepiece.fandom.com/wiki/List_of_Canon_Characters';
  const content = await fetchPageContent(url, 'table.fandom-table.sortable.jquery-tablesorter');
  const $ = cheerio.load(content);
  const crews = [];
  const table = $('table.fandom-table.sortable.jquery-tablesorter').eq(1);
  table.find('tbody > tr').each((i, row) => {
    const tds = $(row).find('td');
    if (tds.length >= 7) {
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
    }
  });
  return crews;
}

async function getCharacterDetails(characterName) {
  const url = `https://onepiece.fandom.com/wiki/${characterName}`;
  const content = await fetchPageContent(url, 'section.pi-item.pi-group.pi-border-color');
  return content;
}

module.exports = {
  getCharacterList,
  getCrewList,
  getCharacterDetails
};
