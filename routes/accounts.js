import express from 'express';
import * as account from '../controllers/accounts.js';
import { protect , authorize } from '../middleware/auth.js';

const router = express.Router();

export default router;