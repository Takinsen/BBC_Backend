import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    hotel_id : {
        type : mongoose.Schema.ObjectId , 
        ref : 'Hotel',
        required: true
    },
    room_number : {
        type : String ,
        required : true ,
        unique : true
    },
    capacity : {
        type : Number ,
        required : true
    },
    price_per_night : {
        type : Number ,
        required : true
    },
    status : { 
        type : String , 
        enum : ["available", "unavailable", "abandoned"] , 
        required : true ,
        default : "available"
    }  
});

const Room = mongoose.model('Room', roomSchema);
export default Room;