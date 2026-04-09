const express = require('express');
const router = express.Router();
const crewController = require('../controllers/crewController');

router.get('/', crewController.listCrews);
router.get('/stats', crewController.crewStats);
router.get('/export/json', crewController.exportCrewsJson);
router.get('/export/csv', crewController.exportCrewsCsv);

module.exports = router;
