import type { CheerioAPI } from 'cheerio';

export default function extractSectionData(
  $: CheerioAPI,
  sectionTitle: string,
  fieldMapping: Record<string, string>
): Record<string, string> {
  const sectionData: Record<string, string> = {};

  const section = $('section.pi-item.pi-group.pi-border-color').filter((_, el) => {
    const h2Text = $(el).find('h2.pi-item.pi-header.pi-secondary-font.pi-item-spacing.pi-secondary-background').text().trim();
    return h2Text.toLowerCase() === sectionTitle.toLowerCase();
  }).first();

  if (!section.length) {
    return sectionData;
  }

  section.find('div.pi-item.pi-data.pi-item-spacing.pi-border-color').each((_, item) => {
    const dataSource = ($(item).attr('data-source') || '').trim().toLowerCase();
    const mappedField = fieldMapping[dataSource];
    if (!mappedField) return;

    const value = $(item).find('div.pi-data-value.pi-font').text().trim();
    sectionData[mappedField] = value;
  });

  return sectionData;
}
