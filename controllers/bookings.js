import Booking from '../models/Booking';
import Hotel from '../models/Hotel';

export const getBookings = async (req,res,next) => {

    let query;
    // General users can see only their Bookings!
    if(req.user.role === 'hotel_admin'){
        query = Booking.find({hotel_id : req.user.hotel_id})
        .populate({path : 'hotel_id' , select : 'name tel address.city address.street_name' });
    }
    else if(req.user.role === 'user'){
        query = Booking.find({user_id : req.user.id})
        .populate({path : 'hotel_id' , select : 'name tel address.city address.street_name' });
    } else {
        query = Booking.find()
        .populate({path : 'hotel_id' , select : 'name tel address.city address.street_name' });
    }

    try {
        const bookings = await query;
        res.status(200).json({
            success : true,
            count : bookings.length,
            data : bookings
        });
    } catch {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            error : err.stack
        });
    }
}

export const getBooking = async (req,res,next) => {
    try {
        const Booking = await Booking.findById(req.params.id).populate({
            path: 'Hotel',
            select: 'name description tel'
        });

        if(!Booking) return res.status(404).json({
            success: false , 
            message: `No Booking with the id of ${req.params.id}`
        });

        res.status(200).json({
            success : true,
            data : Booking
        });
    } catch {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            error : err.stack
        });
    }
}

//@desc Add single Booking
//@route POST /api/v1/Hotels/:HotelId/Bookings/
//@access Private
exports.addBooking = async (req,res,next) => {
    try {

        console.log(req.user.id);
        // Add user Id to req.body
        req.body.user = req.user.id;

        // Check for existed Booking
        const existedBookings = await Booking.find({user: req.user.id});

        // If the user is not an admin, they can only create 3 Booking.
        if(existedBookings.length >= 3 && req.user.role !== 'admin'){
            return res.status(400).json({
                success: false , 
                message: `The user with ID ${req.user.id} has already made 3 Bookings`
            });
        }

        req.body.Hotel = req.params.HotelId;

        const Hotel = await  Hotel.findById(req.params.HotelId);
        
        if(!Hotel) return res.status(404).json({
            success: false , 
            message: `No Hotel with the id of ${req.params.HotelId}`
        });

        const Booking = await Booking.create(req.body);

        res.status(200).json({
            success : true,
            data : Booking
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            message : "Cannot create Booking",
            error : err.stack
        });
    }
}

//@desc Update Booking
//@route PUT /api/v1/Bookings/:id
//@access Private
exports.updateBooking = async (req,res,next) => {
    try {

        let Booking = await Booking.findById(req.params.id);
        
        if(!Booking) return res.status(404).json({
            success: false , 
            message: `No Booking with the id of ${req.params.id}`
        });

        if(Booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false , 
                message: `The user with ID ${req.user.id} is not authorized to update this Booking`
            });
        }

        Booking = await Booking.findByIdAndUpdate(
            req.params.id , 
            req.body ,
            { new : true , runValidators: true}
        );

        res.status(200).json({
            success : true,
            data : Booking
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            message : "Cannot update Booking",
            error : err.stack
        });
    }
}

//@desc Delete Booking
//@route Delete /api/v1/Bookings/:id
//@access Private
exports.deleteBooking = async (req,res,next) => {
    try {

        let Booking = await Booking.findById(req.params.id);
        
        if(!Booking) return res.status(404).json({
            success: false , 
            message: `No Booking with the id of ${req.params.id}`
        });

        if(Booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false , 
                message: `The user with ID ${req.user.id} is not authorized to delete this Booking`
            });
        }

        await Booking.deleteOne();

        res.status(200).json({
            success : true,
            deleted_Booking : Booking
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            message : "Cannot delete Booking",
            error : err.stack
        });
    }
}