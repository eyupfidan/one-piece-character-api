const dbService = require('./dbService');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('Veritabanı tabloları kontrol ediliyor...');

    const sqlFile = await fs.readFile(
      path.join(__dirname, '../config/database.sql'),
      'utf8'
    );

    const sqlCommands = sqlFile
      .split(';')
      .filter(cmd => cmd.trim())
      .map(cmd => cmd.trim() + ';');

    let hasError = false;

    for (const sql of sqlCommands) {
      try {
        await dbService.query(sql);
      } catch (err) {
        hasError = true;
        console.error('SQL çalıştırma hatası:', err.message || err);
      }
    }

    if (hasError) {
      console.error('Veritabanı başlatma başarısız: SQL komutlarının en az biri çalıştırılamadı.');
      return false;
    }

    console.log('Veritabanı tabloları başarıyla oluşturuldu/güncellendi.');
    return true;
  } catch (err) {
    console.error('Veritabanı başlatma hatası:', err);
    return false;
  }
}

module.exports = { initializeDatabase };
