const dbService = require('./dbService');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('Veritabanı tabloları kontrol ediliyor...');
    
    // SQL dosyasını oku
    const sqlFile = await fs.readFile(
      path.join(__dirname, '../config/database.sql'),
      'utf8'
    );

    // SQL komutlarını ayır ve çalıştır
    const sqlCommands = sqlFile
      .split(';')
      .filter(cmd => cmd.trim())
      .map(cmd => cmd.trim() + ';');

    for (const sql of sqlCommands) {
      try {
        await dbService.query(sql);
      } catch (err) {
        console.error('SQL çalıştırma hatası:', err);
      }
    }

    console.log('Veritabanı tabloları başarıyla oluşturuldu/güncellendi.');
    return true;
  } catch (err) {
    console.error('Veritabanı başlatma hatası:', err);
    return false;
  }
}

module.exports = { initializeDatabase }; 