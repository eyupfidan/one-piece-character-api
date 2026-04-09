import { Router } from 'express';
import { exportFullJson } from '../controllers/exportController';

const router = Router();

router.get('/full/json', exportFullJson);

export default router;
