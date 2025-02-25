import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
    account_id : {
        type : mongoose.Schema.ObjectId , 
        ref : 'Account',
        required: true
    },
    hotel_id : {
        type : mongoose.Schema.ObjectId , 
        ref : 'Hotel',
        required: true
    },
    room_id : {
        type : mongoose.Schema.ObjectId , 
        ref : 'Room',
        required: true
    },
    status : { 
        type : String , 
        enum : ["pending", "accpet", "reject"] , 
        required : true ,
        default : "pending"
    },
    check_in_date : {
        type: Date
    },
    check_out_date : {
        type: Date
    },
    created_at : {
        type: Date ,
        default: Date.now
    },
    updated_at : {
        type: Date ,
        default: Date.now
    }
});

const Booking = mongoose.model('Booking', bookSchema);
export default Booking;