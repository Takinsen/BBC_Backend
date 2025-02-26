import express from 'express';
import * as room from '../controllers/rooms.js';
import { protect , authorize } from '../middlewares/auth.js';

const router = express.Router();

export default router;