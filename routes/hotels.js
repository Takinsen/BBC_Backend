import express from 'express';
import * as hotel from '../controllers/hotels.js';
import { protect , authorize } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
.get(hotel.getHotels)
.post(protect , authorize('super_admin') , hotel.createHotel);

router.route('/nearest')
    .get(hotel.getNearestHotel);

router.route('/:id')
.get(hotel.getHotel)
.put(protect , authorize('super_admin') , hotel.updateHotel)
.delete(protect , authorize('super_admin') , hotel.deleteHotel);

export default router;