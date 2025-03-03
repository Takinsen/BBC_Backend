import express from 'express';
import * as account from '../controllers/accounts.js';
import { protect , authorize } from '../middlewares/auth.js';
import {getAccounts, getAccount ,updateAccount , deleteAccount} from '../controllers/accounts.js';

const router = express.Router();

router.route('/')
.get(protect , authorize('super_admin','hotel_admin') , getAccounts)

router.route('/:id')
.get(protect , authorize('super_admin','hotel_admin') , getAccount)
.put(protect , authorize('super_admin','hotel_admin','user') , updateAccount)
.delete(protect , authorize('super_admin','hotel_admin','user') , deleteAccount);
export default router;