import express from 'express';
import * as room from '../controllers/rooms.js';
import { protect , authorize } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
.get(room.getRooms)
.post(protect , authorize('super_admin','hotel_admin') , room.createRoom);

router.route('/:id')
.get(room.getRoom)
.put(protect , authorize('super_admin','hotel_admin','user') , room.updateRoom)
.delete(protect , authorize('super_admin','hotel_admin') , room.deleteRoom);

export default router;