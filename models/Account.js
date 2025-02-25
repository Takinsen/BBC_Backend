import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    first_name : {
        type : String , 
        required: true
    },
    last_name : {
        type : String , 
        required: true
    },
    tel: {
        type: String,
        required: [true, 'Please add a telephone number'],
        unique: true,
        match: [/^\d{10}$/, 'Telephone number must be exactly 10 digits']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },
    password : {
        type : Number ,
        required: [true, 'Please add a password']
    },
    role : { 
        type : String , 
        enum : ["user", "hotel_admin", "super_admin"] , 
        required : true 
    }  
});

const Account = mongoose.model('Account', accountSchema);
export default Account;