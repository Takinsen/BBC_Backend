import express from 'express';
import * as auth from '../controllers/auth.js';
import { protect , authorize } from '../middlewares/auth.js';

const router = express.Router();

// -------------------------- Authentication Routes -------------------------- //

router.post('/register' , auth.register);
router.post('/login' , auth.login);
router.get('/me' , protect ,  auth.getMe);

export default router; 
