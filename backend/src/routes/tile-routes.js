import express from 'express';
import { getTile } from '../controller/tile-controller.js'

const router = express.Router();

router.get('/:z/:x/:y.pbf', getTile);

export default router;
