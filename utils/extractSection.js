// utils/extractSection.js
function extractSectionData($, headerText, mapping) {
    const section = $('section.pi-item.pi-group.pi-border-color').filter((i, el) => {
      return $(el).find('h2.pi-header').text().trim().toLowerCase().includes(headerText.toLowerCase());
    }).first();
  
    if (!section.length) return null;
  
    const data = {};
    section.find('div.pi-item.pi-data.pi-item-spacing.pi-border-color').each((i, el) => {
      const source = $(el).attr('data-source');
      if (source && mapping[source]) {
        let value = $(el).find('div.pi-data-value.pi-font').text().trim();
        if (value) {
          data[mapping[source]] = value;
        }
      }
    });
    return Object.keys(data).length ? data : null;
  }
  
  module.exports = extractSectionData;
  