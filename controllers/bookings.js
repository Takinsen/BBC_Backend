import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';

export const getBookings = async (req,res,next) => {

    let query;
    // General users can see only their Bookings!
    if(req.user.role === 'hotel_admin'){

        if(!req.user.hotel_id) return res.status(400).json("Only hotel admin with hotel_id can view hotel's booking");

        query = Booking.find({hotel_id : req.user.hotel_id}).populate({
            path : 'account_id' , 
            select : 'first_name last_name' 
        }).populate({
            path : 'hotel_id' , 
            select : 'name tel address' 
        }).populate({
            path : 'room_id' , 
            select : 'room_number capacity price_per_night' 
        });

    }
    else if(req.user.role === 'user'){

        query = Booking.find({user_id : req.user.id}).populate({
            path : 'account_id' , 
            select : 'first_name last_name' 
        }).populate({
            path : 'hotel_id' , 
            select : 'name tel address' 
        }).populate({
            path : 'room_id' , 
            select : 'room_number capacity price_per_night' 
        });

    } else {

        query = Booking.find().populate({
            path : 'account_id' , 
            select : 'first_name last_name' 
        }).populate({
            path : 'hotel_id' , 
            select : 'name tel address' 
        }).populate({
            path : 'room_id' , 
            select : 'room_number capacity price_per_night' 
        });

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

        if(req.user.role === 'hotel_admin'){

            if(!req.user.hotel_id) return res.status(400).json("Only hotel admin with hotel_id can view hotel's booking");

            // Check hotel's booking ownership
            query = Booking.findOne({_id : req.params.id , hotel_id : req.user.hotel_id}).populate({
                path : 'account_id' , 
                select : 'first_name last_name' 
            }).populate({
                path : 'hotel_id' , 
                select : 'name tel address' 
            }).populate({
                path : 'room_id' , 
                select : 'room_number capacity price_per_night' 
            });

        }
        else if(req.user.role === 'user'){

            // Check user's booking ownership
            query = Booking.findOne({_id : req.params.id , user_id : req.user.id}).populate({
                path : 'account_id' , 
                select : 'first_name last_name' 
            }).populate({
                path : 'hotel_id' , 
                select : 'name tel address' 
            }).populate({
                path : 'room_id' , 
                select : 'room_number capacity price_per_night' 
            });

        } else {

            // Super_admin can view any booking
            query = Booking.findById(req.params.id).populate({
                path : 'account_id' , 
                select : 'first_name last_name' 
            }).populate({
                path : 'hotel_id' , 
                select : 'name tel address' 
            }).populate({
                path : 'room_id' , 
                select : 'room_number capacity price_per_night' 
            });

        }

        const booking = await query;

        if(!booking) return res.status(404).json({
            success: false , 
            message: `No booking with the id of ${req.params.id}`
        });

        res.status(200).json({
            success : true,
            booking
        });
    } catch {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            error : err.stack
        });
    }
}

export const addBooking = async (req,res,next) => {
    try {

        if(req.user.role === 'user'){

            req.body.account_id = req.user.id;

            const existedBookings = await Booking.find({account_id: req.user.id});
            // user can only create 3 booking.
            if(existedBookings.length >= 3){
                return res.status(400).json({
                    success: false , 
                    message: `The user with ID ${req.user.id} has already made 3 bookings`
                });
            }

            if(!hotelExistValidation(req.body.hotel_id)) return res.status(404).json({
                success: false , 
                message: `No hotel with the id of ${req.body.hotel_id}`
            });

        } else if(req.user.role === 'hotel_admin'){

            req.body.hotel_id =  req.user.hotel_id;

            if(!hotelExistValidation(req.body.hotel_id)) return res.status(404).json({
                success: false , 
                message: `No hotel with the id of ${req.body.hotel_id}`
            });

        }

        // Check if room is existed and available
        const room = await Room.findOne({room_number : req.body.room_number , hotel_id : req.body.hotel_id});
        if(!room) 
            return res.status(404).json({
                success: false , 
                message: `No room with room number ${req.body.room_number} in this hotel`
            });
        if(room.status !== 'available') 
            return res.status(400).json({
                success: false , 
                message: `the room in hotel with id ${req.body.hotel_id} is not available`
            });

        req.body.room_id = room.id;

        const booking = await Booking.create(req.body);

        res.status(200).json({
            success : true,
            message : "Create booking successfully",
            booking
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            message : "Cannot create booking",
            error : err.stack
        });
    }
}

export const updateBooking = async (req,res,next) => {
    try {

        // Validation

        let booking = await Booking.findById(req.params.id);
        
        if(!booking) return res.status(404).json({
            success: false , 
            message: `No booking with the id of ${req.params.id}`
        });

        if(booking.account_id.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false , 
                message: `The user with the id ${req.user.id} is not authorized to update this booking`
            });
        }

        // Updating

        booking = await Booking.findByIdAndUpdate(
            req.params.id , 
            req.body ,
            { new : true , runValidators: true}
        );

        res.status(200).json({
            success : true,
            updated_booking : booking
        });

    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            message : "Cannot update booking",
            error : err.stack
        });
    }
}

export const deleteBooking = async (req,res,next) => {
    try {

        let booking = await Booking.findById(req.params.id);
        
        if(!booking) return res.status(404).json({
            success: false , 
            message: `No booking with the id of ${req.params.id}`
        });

        // Ownership
        if(booking.account_id.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false , 
                message: `The account with ID ${req.user.id} is not authorized to delete this booking`
            });
        }

        await Booking.deleteOne();

        res.status(200).json({
            success : true,
            deleted_booking : booking
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            message : "Cannot delete booking",
            error : err.stack
        });
    }

}

// Admin

export const acceptBooking = async (req,res,next) => {

    try{

        const booking = await Booking.findByIdAndUpdate(
            req.params.id , 
            { $set : { status : 'accept' }},
            { new : true , runValidators : true }
        );

        res.status(200).json({
            success : true,
            message : "Accept booking successfully",
            accepted_booking : booking
        });


    } catch (err) {
        res.status(500).json({
            success : false,
            message : "Cannot accept booking",
            error : err.stack
        });
    }    

}

export const rejectBooking = async (req,res,next) => {

    try{

        const booking = await Booking.findByIdAndUpdate(
            req.params.id , 
            { $set : { status : 'reject' }},
            { new : true , runValidators : true }
        );

        res.status(200).json({
            success : true,
            message : "Reject booking successfully",
            reject_booking : booking
        });


    } catch (err) {
        res.status(500).json({
            success : false,
            message : "Cannot reject booking",
            error : err.stack
        });
    }    

}

// Validation function

const hotelExistValidation = async (hotel_id) => {
    // Check if hotel existed
    const hotel = await Hotel.findById(hotel_id);
    if(!hotel) return res.status(404).json({
        success: false , 
        message: `No hotel with the id of ${hotel_id}`
    });
}

const RoomExistValidation = async (room_id) => {
    // Check if room existed
    const room = await Room.findById(room_id);
    if(!room) return res.status(404).json({
        success: false , 
        message: `No room with the id of ${room_id}`
    });
}

const bookingExistValidation = async (booking_id) => {
    // Check if booking existed
    const booking = await Booking.findById(booking_id);
    if(!booking) return res.status(404).json({
        success: false , 
        message: `No booking with the id of ${booking_id}`
    });
}

const alreadyBookingValidation = async (user_id , hotel_id , room_id) => {

    // Check if user already booking this room in hotel
    const is_already_booking = await Booking.findOne({
        user_id,
        hotel_id,
        room_id
    });

    if(is_already_booking) return false;

    return true;

}