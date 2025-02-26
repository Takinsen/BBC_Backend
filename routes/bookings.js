import express from 'express';
import * as booking from '../controllers/bookings.js';
import { protect , authorize } from '../middleware/auth.js';

const router = express.Router();

export default router;