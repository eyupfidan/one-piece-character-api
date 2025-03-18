const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');

router.get('/', characterController.listCharacters);
router.get('/:name', characterController.getCharacterDetail);

module.exports = router;
