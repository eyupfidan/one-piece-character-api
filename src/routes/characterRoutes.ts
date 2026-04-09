import { Router } from 'express';
import { characterStats, exportCharactersCsv, exportCharactersJson, getCharacterDetail, listCharacters } from '../controllers/characterController';

const router = Router();

router.get('/', listCharacters);
router.get('/stats', characterStats);
router.get('/export/json', exportCharactersJson);
router.get('/export/csv', exportCharactersCsv);
router.get('/:name', getCharacterDetail);

export default router;
