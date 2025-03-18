// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const characterRoutes = require('./routes/characterRoutes');
const crewRoutes = require('./routes/crewRoutes');

app.use('/api/character', characterRoutes);
app.use('/api/crew', crewRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
