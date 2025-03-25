require('dotenv').config();
const express = require('express');
const { initializeDatabase } = require('./services/dbInitService');
const updateDatabase = require('./scheduler/dailyScraper');

const app = express();
const PORT = process.env.PORT || 3000;

const characterRoutes = require('./routes/characterRoutes');
const crewRoutes = require('./routes/crewRoutes');

app.use('/api/character', characterRoutes);
app.use('/api/crew', crewRoutes);

async function startServer() {
  try {
    // Veritabanı tablolarını oluştur/kontrol et
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('Veritabanı başlatılamadı. Uygulama kapatılıyor...');
      process.exit(1);
    }

    // Sunucuyu hemen başlat
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Veri çekme işlemini arka planda başlat
    console.log('İlk veri çekme işlemi arka planda başlatılıyor...');
    updateDatabase().catch(error => {
      console.error('Veri çekme hatası:', error);
    });

  } catch (error) {
    console.error('Sunucu başlatma hatası:', error);
    process.exit(1);
  }
}

startServer();
