// Import model
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';

export const getRooms = async(req , res , next) => {
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
    
    query = Room.find(JSON.parse(queryStr));

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
        query = query.sort('-price_per_night');
    }

    // Pagination
    const page = parseInt(req.query.page , 10) || 1;
    const limit = parseInt(req.query.limit , 10) || 25;
    const startIndex = ( page - 1 ) * limit;
    const endIndex = page * limit;
    const total = await Room.countDocuments();

    query = query.skip(startIndex).limit(limit);
    try{
        // Executing query
        const rooms = await query;
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
            count: rooms.length,
            pagination,
            rooms
        }); 
    } catch(err){
        res.status(500).json({success: false , error : err.stack});
    }
}

export const getRoom = async (req , res , next) => {
    try{
        const room = await Room.findById(req.params.id);

        if(!room) 
            return res.status(400).json({
                success: false , 
                message : `Cannot find room with the id : ${req.params.id}`
            });

        res.status(200).json({
            success: true,
            room
        }); 

    } catch(err){
        res.status(500).json({success: false , error : err.stack});
    }
}

export const createRoom = async (req , res , next) => {
    try{
        const {role,hotel_id} = req.user ;

        // if role is hotel_admin
        // check if hotel_id from hotel_admin and hotel_id from body is match
        if(role === 'hotel_admin'){
            if (String(req.body.hotel_id) !== String(hotel_id)) {
                return res.status(403).json({
                    success: false,
                    message: `You are not authorized to create a room for this hotel`
                });
            }
        }

        const room = await Room.create(req.body);
        res.status(201).json({ success: true , new_room : room });
    } catch (err){
        res.status(500).json({success: false , error : err.stack});
    }
}

export const updateRoom = async(req , res , next) => {
    try{
        // เช็คว่ามี room ตาม id ทีระบุหรือไม่
        const room_before = await Room.findById(req.params.id);
        const {role,hotel_id} = req.user ;

        if(!room_before) 
            return res.status(404).json({
                success: false , 
                message : `Cannot find room with the id : ${req.params.id}`
            });

        if (role === 'hotel_admin') {
            console.log(room_before.hotel_id);
            console.log(hotel_id);
            if (String(room_before.hotel_id) !== String(hotel_id)) {
                return res.status(403).json({
                    success: false,
                    message: `You are not authorized to update this room`
                });
            }
        }
        
        // อัพเดท room ตาม id ทีระบุ
        const room_after = await Room.findByIdAndUpdate(
            req.params.id , 
            req.body , 
            { new: true , runValidators: true }
        );

        res.status(200).json({
            success: true ,
            before : room_before ,
            after : room_after
        }); 

    } catch(err){
        res.status(500).json({success: false , error : err.stack});
    }
}

export const deleteRoom = async(req , res , next) => {
    try{
        // เช็คว่ามี room ตาม id ทีระบุหรือไม่
        const room = await Room.findById(req.params.id);
        const {role,hotel_id} = req.user ;

        if(!room)
            return res.status(404).json({
                success: false , 
                message : `Cannot find room with the id : ${req.params.id}`
            });

        if (role === 'hotel_admin') {
            if (String(room.hotel_id) !== String(hotel_id)) {
                return res.status(403).json({
                    success: false,
                    message: `You are not authorized to delete this room`
                });
            }
        }
            
        // ลบ Booking ที่มี room_id ตรงกับ id ที่ระบุ ( Cascade delete )
        await Booking.deleteMany({ room_id : req.params.id });

        // ลบ room ตาม id ทีระบุ
        await room.deleteOne({ _id : req.params.id });

        res.status(200).json({
            success: true,
            Deleted_room : room
        }); 

    } catch(err){
        res.status(500).json({success: false , error : err.stack});
    }
}