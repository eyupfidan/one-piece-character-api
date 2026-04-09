const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');

router.get('/', characterController.listCharacters);
router.get('/stats', characterController.characterStats);
router.get('/export/json', characterController.exportCharactersJson);
router.get('/export/csv', characterController.exportCharactersCsv);
router.get('/:name', characterController.getCharacterDetail);

module.exports = router;
