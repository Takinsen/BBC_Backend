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

        query = Booking.find({account_id : req.user.id}).populate({
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
    } catch(err) {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            error : err.stack
        });
    }
}

export const getBooking = async (req,res,next) => {
    try {
        let query;
        if(req.user.role === 'hotel_admin'){

            if(!req.user.hotel_id) {
                return res.status(400).json({
                    success: false ,
                    message:"Only hotel admin with hotel_id can view hotel's booking"
                });
            }

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
            query = Booking.findOne({_id : req.params.id , account_id : req.user.id}).populate({
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
            data:booking
        });
    } catch(err) {
        console.log(err.stack);
        res.status(500).json({
            success : false,
            error : err.stack
        });
    }
}

export const addBooking = async (req, res, next) => {
    try {
        const { check_in_date, check_out_date, num_people, hotel_id, room_number } = req.body;
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);

        // Check if check-out date is after check-in date
        if (checkOut <= checkIn) {
            return res.status(400).json({
                success: false,
                message: `The check-out date must be greater than check-in date`,
            });
        }

        // Fetch hotel from database
        const hotel = await Hotel.findById(hotel_id);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: `No hotel with the id of ${hotel_id}`,
            });
        }

        // Role-based checks
        if (req.user.role === 'user') {
            // Check booking duration for users
            if (!isBookingDurationValid(check_in_date, check_out_date)) {
                return res.status(400).json({
                    success: false,
                    message: `The booking duration must be less than or equal to 3 nights (4 days)`,
                });
            }

            req.body.account_id = req.user.id;
        } else if (req.user.role === 'hotel_admin') {
            if (hotel.id.toString() !== req.user.hotel_id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: `Hotel Admin can only make bookings for their own hotel`,
                });
            }

            req.body.hotel_id = req.user.hotel_id;
        }

        // Fetch room and check its availability
        const room = await Room.findOne({ room_number, hotel_id });
        if (!room) {
            return res.status(404).json({
                success: false,
                message: `No room with room number ${room_number} in this hotel`,
            });
        }

        // Check if user already has a booking for the room
        const isAlreadyBooking = await Booking.findOne({
            account_id: req.body.account_id,
            hotel_id,
            room_id: room.id,
        });

        if (isAlreadyBooking) {
            return res.status(400).json({
                success: false,
                message: `You have already booked this room in this hotel`,
            });
        }

        // Check if room is available for the given dates
        if (!await isRoomAvailable(room.id, hotel.id, check_in_date, check_out_date)) {
            return res.status(400).json({
                success: false,
                message: `The room is not available for the selected dates`,
            });
        }

        // Check room capacity
        if (!await isRoomCapacityValid(room.id, num_people)) {
            return res.status(400).json({
                success: false,
                message: `The room with id ${room.id} cannot handle ${num_people} people`,
            });
        }

        // Create booking
        req.body.room_id = room.id;
        const booking = await Booking.create(req.body);

        res.status(200).json({
            success: true,
            message: "Booking created successfully",
            booking,
        });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({
            success: false,
            message: "Cannot create booking",
            error: err.stack,
        });
    }
};

export const updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking with the id of ${req.params.id}`
            });
        }

        if (req.user.role === 'user') {
            // Check if user is owner of booking
            if (booking.account_id.toString() !== req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: `The account with ID ${req.user.id} is not authorized to update this booking`
                });
            }

            // Handle hotel change - users cannot change hotel
            if (req.body.hotel_id && req.body.hotel_id !== booking.hotel_id) {
                return res.status(403).json({
                    success: false,
                    message: `To update hotel, you must delete this booking and create a new one`
                });
            }

            if(booking.status === 'accept' || booking.status === 'reject'){
                return res.status(403).json({
                    success: false,
                    message: `Cannot update booking status is ${booking.status} , you need to delete and create new booking`
                });
            }

            // Allow user to update these fields
            const { room_number, check_in_date, check_out_date, num_people } = req.body;
            let updateCheckInDate = check_in_date || booking.check_in_date;
            let updateCheckOutDate = check_out_date || booking.check_out_date;
            let updateNumPeople = num_people || booking.num_people;

            if (updateCheckInDate && updateCheckOutDate) {
                const checkInDate = new Date(updateCheckInDate);
                const checkOutDate = new Date(updateCheckOutDate);

                // Ensure check-out date is after check-in date
                if (checkOutDate <= checkInDate) {
                    return res.status(400).json({
                        success: false,
                        message: `The check-out date must be greater than check-in date`
                    });
                }

                // Ensure the booking duration is at most 3 nights (4 days)
                if (!isBookingDurationValid(updateCheckInDate, updateCheckOutDate)) {
                    return res.status(400).json({
                        success: false,
                        message: `The booking duration must be less than or equal to 3 nights (4 days)`
                    });
                }

                // Check if the room number in the current hotel is available for the new dates
                const room = await Room.findOne({ room_number, hotel_id: booking.hotel_id });
                if (!room) {
                    return res.status(404).json({
                        success: false,
                        message: `No room with room number ${room_number} in this hotel`
                    });
                }

                // Check if room is available for the new dates
                if (!await isRoomAvailable(room.id, booking.hotel_id, updateCheckInDate, updateCheckOutDate,booking._id)) {
                    return res.status(400).json({
                        success: false,
                        message: `The room is not available for the selected dates`
                    });
                }

                // Check room capacity
                if (!await isRoomCapacityValid(room.id, updateNumPeople)) {
                    return res.status(400).json({
                        success: false,
                        message: `The room with id ${room.id} cannot handle ${updateNumPeople} people`
                    });
                }

                // Update booking with new details
                booking.check_in_date = updateCheckInDate;
                booking.check_out_date = updateCheckOutDate;
                booking.room_id = room.id;
                booking.num_people = updateNumPeople;

            } else if (room_number) {
                // Check if room number is valid and available
                const room = await Room.findOne({ room_number, hotel_id: booking.hotel_id });
                if (!room) {
                    return res.status(404).json({
                        success: false,
                        message: `No room with room number ${room_number} in this hotel`
                    });

                }

                if (!await isRoomAvailable(room.id, booking.hotel_id, booking.check_in_date, booking.check_out_date,booking._id)) {
                    return res.status(400).json({
                        success: false,
                        message: `The room is not available for the selected dates`
                    });
                }

                // Update room number and check room capacity
                if (!await isRoomCapacityValid(room.id, booking.num_people)) {
                    return res.status(400).json({
                        success: false,
                        message: `The room with id ${room.id} cannot handle ${booking.num_people} people`
                    });
                }

                booking.room_id = room.id;
            }

            // If user is updating the number of people, check the room capacity
            if (updateNumPeople && !await isRoomCapacityValid(booking.room_id, updateNumPeople)) {
                return res.status(400).json({
                    success: false,
                    message: `The room with id ${booking.room_id} cannot handle ${updateNumPeople} people`
                });
            }

            await booking.save();
            return res.status(200).json({
                success: true,
                message: `Booking updated successfully`,
                booking
            });

        } else if (req.user.role === 'hotel_admin') {
            // Ensure hotel admin can only update bookings in their hotel
            if (booking.hotel_id.toString() !== req.user.hotel_id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: `Hotel Admin can only update bookings in their own hotel`
                });
            }

            // Hotel admins can update the booking status
            if (req.body.status) {
                if (!["pending", "accept", "reject"].includes(req.body.status)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid status value. Allowed values: pending, accept, reject`
                    });
                }
                booking.status = req.body.status;
            }

            // Allow hotel admin to update room number and check-in/check-out dates
            if (req.body.room_number) {
                const room = await Room.findOne({ room_number: req.body.room_number, hotel_id: req.user.hotel_id });
                if (!room) {
                    return res.status(404).json({
                        success: false,
                        message: `No room with room number ${req.body.room_number} in this hotel`
                    });
                }

                if (!await isRoomAvailable(room.id, req.user.hotel_id, booking.check_in_date, booking.check_out_date,booking._id)) {
                    return res.status(400).json({
                        success: false,
                        message: `The room is not available for the selected dates`
                    });
                }

                if(!await isRoomCapacityValid(room.id, booking.num_people)){
                    return res.status(400).json({
                        success: false,
                        message: `The room with id ${room.id} cannot handle ${booking.num_people} people`
                    });
                 }

                booking.room_id = room.id;
            }

            if (req.body.check_in_date && req.body.check_out_date) {
                const checkInDate = new Date(req.body.check_in_date);
                const checkOutDate = new Date(req.body.check_out_date);

                if (checkOutDate <= checkInDate) {
                    return res.status(400).json({
                        success: false,
                        message: `The check-out date must be greater than check-in date`
                    });
                }

                booking.check_in_date = req.body.check_in_date;
                booking.check_out_date = req.body.check_out_date;
            }

            await booking.save();
            return res.status(200).json({
                success: true,
                message: `Booking updated successfully`,
                booking
            });

        } else if (req.user.role === 'super_admin') {
            // Super admin can update freely
            if (req.body.check_in_date && req.body.check_out_date) {
                const checkInDate = new Date(req.body.check_in_date);
                const checkOutDate = new Date(req.body.check_out_date);

                if (checkOutDate <= checkInDate) {
                    return res.status(400).json({
                        success: false,
                        message: `The check-out date must be greater than check-in date`
                    });
                }

                booking.check_in_date = req.body.check_in_date;
                booking.check_out_date = req.body.check_out_date;
            }

            booking.status = req.body.status || booking.status;
            booking.num_people = req.body.num_people || booking.num_people;
            booking.hotel_id = req.body.hotel_id || booking.hotel_id;

            if (req.body.room_number) {
                const room = await Room.findOne({ room_number: req.body.room_number, hotel_id: booking.hotel_id });
                if (!room) {
                    return res.status(404).json({
                        success: false,
                        message: `No room with room number ${req.body.room_number} in this hotel`
                    });
                }

                if (!await isRoomAvailable(room.id, booking.hotel_id, booking.check_in_date, booking.check_out_date , booking._id)) {
                    return res.status(400).json({
                        success: false,
                        message: `The room is not available for the selected dates`
                    });
                }

                if(!await isRoomCapacityValid(room.id, booking.num_people)){
                     return res.status(400).json({
                          success: false,
                          message: `The room with id ${room.id} cannot handle ${booking.num_people} people`
                     });
                }

                booking.room_id = room.id;
            }

            await booking.save();
            return res.status(200).json({
                success: true,
                message: `Booking updated successfully`,
                booking
            });
        }

    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success: false,
            message: "Cannot update booking",
            error: err.stack
        });
    }
};

export const deleteBooking = async (req, res, next) => {
    try {
        // Find the booking
        let booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({
                success: false, 
                message: `No booking with the id of ${req.params.id}`
            });
        }

        if (req.user.role === 'user') {
            // Users can only delete their own bookings
            if (booking.account_id.toString() !== req.user.id) {
                return res.status(401).json({
                    success: false, 
                    message: `The account with ID ${req.user.id} is not authorized to delete this booking`
                });
            }
        } else if (req.user.role === 'hotel_admin') {
            // Hotel admins can only delete bookings in their own hotel
            if (booking.hotel_id.toString() !== req.user.hotel_id.toString()) {
                return res.status(403).json({
                    success: false, 
                    message: `Hotel Admin can only delete bookings in their own hotel`
                });
            }
        }
        // Delete the booking
        await Booking.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            message: `Booking deleted successfully`,
            deleted_booking: booking
        });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({
            success: false,
            message: "Cannot delete booking",
            error: err.stack
        });
    }
};

const isBookingDurationValid = (check_in , check_out) => {
    const check_in_date = new Date(check_in);
    const check_out_date = new Date(check_out);
    const diffTime = Math.abs(check_out_date - check_in_date);
    // for example have live at hotel day 1 - day 4 => 4-1 => 3 nights
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log("Nights :" , diffDays);
    return diffDays <= 3;
};

const isRoomCapacityValid = async (room_id , num_people)=>{
    const room = await Room.findById(room_id);
    if(!room){
        throw new Error(`No room with id ${room_id}`);
    }
    return num_people <= room.capacity;
};

const isRoomAvailable = async (room_id, hotel_id, check_in_date, check_out_date, bookingIdToExclude = null) => {
    const query = {
        room_id,
        hotel_id,
        $or: [
            { check_in_date: { $lt: check_out_date }, check_out_date: { $gt: check_in_date } }, // General overlap
        ],
    };

    // Exclude the current booking when updating
    if (bookingIdToExclude) {
        query._id = { $ne: bookingIdToExclude };
    }

    const conflictingBookings = await Booking.find(query);
    return conflictingBookings.length === 0; // If no conflicts, room is available
};
