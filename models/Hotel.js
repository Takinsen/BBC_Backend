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
        unique: true
    },
    address: {
        city: {
            type: String,
            required: [true, 'Please add a city']
        },
        street_name: {
            type: String,
            required: [true, 'Please add a street name']
        },
        street_address: {
            type: String,
            required: [true, 'Please add a street address']
        },
        zipcode: {
            type: String,
            required: [true, 'Please add a zipcode'] ,
            match: [/^\d{1,5}$/, 'Zipcode must be at most 5 digits']
        }
    },
    location: {
        latitude: {
            type: Number,
            required: [true, 'Please add a latitude']
        },
        longtitude: {
            type: Number,
            required: [true, 'Please add a longtitude']
        }
    }
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

hotelSchema.virtual('bookings' , {
    ref : 'Booking',
    localField : '_id',
    foreignField : 'hotel_id',
    justOne : false
});

const Hotel = mongoose.model('Hotel', hotelSchema);
export default Hotel;