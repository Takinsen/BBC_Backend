import express from 'express';
import * as booking from '../controllers/bookings.js';
import { protect , authorize } from '../middlewares/auth.js';

const router = express.Router();

export default router;