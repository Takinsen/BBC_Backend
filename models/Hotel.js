import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
    hotel_name : {
        type : String , 
        require : [true , 'Please add a name'] , 
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    tel: {
        type: String,
        required: [true, 'Please add a telephone number'],
        match: [/^\d{10}$/, 'Telephone number must be exactly 10 digits']
    },
    province: {
        type: String,
        required: [true, 'Please add a province']    
    },
    district: {
        type: String,
        required: [true, 'Please add a district']
    },
    street: {
        type: String,
        required: [true, 'Please add a street']
    },
    location_number: {
        type: Number,
        required: [true, 'Please add a number'],
        min: [1, 'location_number must be at least 1'],
        max: [999, 'location_number must be at most 999']
    },
    zipcode: {
        type: String,
        required: [true, 'Please add a postal'] ,
        match: [/^\d{1,5}$/, 'Zipcode must be at most 5 digits']
    },
});

const Hotel = mongoose.model('Hotel', hotelSchema);
export default Hotel;