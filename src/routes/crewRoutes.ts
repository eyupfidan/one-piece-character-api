import { Router } from 'express';
import { crewStats, exportCrewsCsv, exportCrewsJson, listCrews } from '../controllers/crewController';

const router = Router();

router.get('/', listCrews);
router.get('/stats', crewStats);
router.get('/export/json', exportCrewsJson);
router.get('/export/csv', exportCrewsCsv);

export default router;
