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
        required: [true , 'Please add hotel id']
    },
    room_id : {
        type : mongoose.Schema.ObjectId , 
        ref : 'Room',
        required: true
    },
    status : { 
        type : String , 
        enum : ["pending", "accept", "reject"],
        required : true ,
        default : "pending"
    },
    num_people : {
        type: Number,
        required: [true , 'Please add number of people'],
        min: [1, 'Number of people must be at least 1']
    },
    check_in_date : {
        type: Date,
        required: [true , 'Format date is YYYY-MM-DD']
    },
    check_out_date : {
        type: Date
    },
} , { timestamps : true });

const Booking = mongoose.model('Booking', bookSchema);
export default Booking;