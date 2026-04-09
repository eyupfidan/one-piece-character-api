const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

router.get('/full/json', exportController.exportFullJson);

module.exports = router;
