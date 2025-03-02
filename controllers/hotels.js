// Import model
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';

export const getHotels = async(req , res , next) => {
    let query;

    // Copy req.query
    const reqQuery = {...req.query};
    console.log(reqQuery);

    // Fields to exclude
    const removeFields = ['select' , 'sort' , 'page' , 'limit'];

    // Loop over remove fields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    console.log(reqQuery);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g , match => `$${match}`);
    
    query = Hotel.find(JSON.parse(queryStr)).populate('bookings');

    // Select Fields
    if(req.query.select){
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort Fields
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else{
        query = query.sort('-created_at');
    }

    // Pagination
    const page = parseInt(req.query.page , 10) || 1;
    const limit = parseInt(req.query.limit , 10) || 25;
    const startIndex = ( page - 1 ) * limit;
    const endIndex = page * limit;
    const total = await Hotel.countDocuments();

    query = query.skip(startIndex).limit(limit);
    try{
        // Executing query
        const hotels = await query;
        // Pagination
        const pagination = {};

        if(endIndex < total){
            pagination.next = {
                page: page + 1,
                limit
            }
        }
        if(startIndex > 0){
            pagination.prev = {
                page: page - 1,
                limit
            }
        }

        res.status(200).json({
            success: true,
            count: hotels.length,
            pagination,
            hotels
        }); 
    } catch(err){
        res.status(500).json({success: false , error : err.stack});
    }
}

export const getHotel = async (req , res , next) => {
    try{
        const hotel = await Hotel.findById(req.params.id);

        if(!hotel) 
            return res.status(400).json({
                success: false , 
                message : `Cannot find hotel with the id : ${req.params.id}`
            });

        res.status(200).json({
            success: true,
            hotel
        }); 

    } catch(err){
        res.status(500).json({success: false , error : err.stack});
    }
}

export const getRoomInHotel = async (req , res , next) => {
    try{
        const hotel = await Hotel.findById(req.params.id).populate('bookings');

        if(!hotel) 
            return res.status(400).json({
                success: false , 
                message : `Cannot find hotel with the id : ${req.params.id}`
            });

        const room = await Room.find({ hotel_id : req.params.id });

        res.status(200).json({
            success: true,
            hotel,
            room
        });

    } catch(err){
        res.status(500).json({success: false , error : err.stack});
    }
};

export const createHotel = async (req , res , next) => {
    try{
        const hotel = await Hotel.create(req.body);
        res.status(201).json({ success: true , new_hotel : hotel });
    } catch (err){
        res.status(500).json({success: false , error : err.stack});
    }
}

export const updateHotel = async(req , res , next) => {
    try{
        // เช็คว่ามี hotel ตาม id ทีระบุหรือไม่
        const hotel_before = await Hotel.findById(req.params.id);

        if(!hotel_before) 
            return res.status(404).json({
                success: false , 
                message : `Cannot find hotel with the id : ${req.params.id}`
            });
        
        // อัพเดท hotel ตาม id ทีระบุ
        const hotel_after = await Hotel.findByIdAndUpdate(
            req.params.id , 
            req.body , 
            { new: true , runValidators: true }
        );

        res.status(200).json({
            success: true ,
            before : hotel_before ,
            after : hotel_after
        }); 

    } catch(err){
        res.status(500).json({success: false , error : err.stack});
    }
}

export const deleteHotel = async(req , res , next) => {
    try{
        // เช็คว่ามี hotel ตาม id ทีระบุหรือไม่
        const hotel = await Hotel.findById(req.params.id);

        if(!hotel)
            return res.status(404).json({
                success: false , 
                message : `Cannot find hotel with the id : ${req.params.id}`
            });
        
        // ลบ Booking ที่มี hotel_id ตรงกับ id ที่ระบุ ( Cascade delete )
        await Booking.deleteMany({ hotel_id : req.params.id });

        // ลบ hotel ตาม id ทีระบุ
        await Hotel.deleteOne({ _id : req.params.id });

        res.status(200).json({
            success: true,
            Deleted_hotel : hotel
        }); 

    } catch(err){
        res.status(500).json({success: false , error : err.stack});
    }
}