require('dotenv').config();
const net = require('net');
const express = require('express');
const { initializeDatabase } = require('./services/dbInitService');
const updateDatabase = require('./scheduler/dailyScraper');
const { bootstrapLocalData } = require('./services/bootstrapService');

const app = express();
const BASE_PORT = Number(process.env.PORT) || 3000;

const characterRoutes = require('./routes/characterRoutes');
const crewRoutes = require('./routes/crewRoutes');
const exportRoutes = require('./routes/exportRoutes');

app.use('/api/character', characterRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/export', exportRoutes);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(startPort, maxTries = 20) {
  for (let offset = 0; offset < maxTries; offset += 1) {
    const port = startPort + offset;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(port)) return port;
  }

  throw new Error(`Kullanılabilir port bulunamadı. Başlangıç portu: ${startPort}`);
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(startPort, maxTries = 20) {
  for (let offset = 0; offset < maxTries; offset += 1) {
    const port = startPort + offset;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortAvailable(port)) return port;
  }

  throw new Error(`Kullanılabilir port bulunamadı. Başlangıç portu: ${startPort}`);
}

async function startServer() {
  try {
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('Veritabanı başlatılamadı. Uygulama kapatılıyor...');
      process.exit(1);
    }

    await bootstrapLocalData();

    const activePort = await findAvailablePort(BASE_PORT);

    app.listen(activePort, () => {
      console.log(`Server running on port ${activePort}`);
      if (activePort !== BASE_PORT) {
        console.log(`Port ${BASE_PORT} dolu olduğu için otomatik olarak ${activePort} kullanıldı.`);
      }
    });

    console.log('İlk veri çekme işlemi arka planda başlatılıyor...');
    updateDatabase().catch((error) => {
      console.error('Veri çekme hatası:', error.message || error);
    });
  } catch (error) {
    console.error('Sunucu başlatma hatası:', error);
    process.exit(1);
  }
}

startServer();
