const express = require('express');
const router = express.Router();
const crewController = require('../controllers/crewController');

router.get('/', crewController.listCrews);

module.exports = router;
