import express from 'express';
import * as booking from '../controllers/bookings.js';
import { protect , authorize } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
    .get(protect , booking.getBookings)
    .post(protect , authorize('super_admin','hotel_admin' , 'user') , booking.addBooking);

router.route('/:id')
    .get(protect , booking.getBooking)
    .put(protect , authorize('super_admin','hotel_admin' , 'user') , booking.updateBooking)
    .delete(protect , authorize('super_admin','hotel_admin' , 'user') , booking.deleteBooking); 

export default router;