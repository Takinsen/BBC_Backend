import express from 'express';
import * as account from '../controllers/accounts.js';
import { protect , authorize } from '../middlewares/auth.js';

const router = express.Router();

export default router;