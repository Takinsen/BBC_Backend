import express from 'express';
import * as hotel from '../controllers/hotels.js';
import { protect , authorize } from '../middleware/auth.js';

const router = express.Router();

export default router;