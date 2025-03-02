import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const accountSchema = new mongoose.Schema({
    first_name: {
        type: String, 
        required: true
    },
    last_name: {
        type: String, 
        required: true
    },
    tel: {
        type: String,
        required: [true, 'Please add a telephone number'],
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^(?![.-])[A-Za-z0-9._%+-]+(?:[A-Za-z0-9-]*[A-Za-z0-9])?@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
            'Please add a valid email'
        ]
    },
    password : {
        type : String ,
        required: [true, 'Please add a password'],
        minlenght: 6,
        select: false
    },
    role : { 
        type : String , 
        enum : ["user", "hotel_admin", "super_admin"] , 
        required : true 
    },
    hotel_id : {
        type : mongoose.Schema.ObjectId , 
        ref : 'Account',
        default : null 
    },
    create_at:{
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

accountSchema.virtual('bookings' , {
    ref : 'Booking',
    localField : '_id',
    foreignField : 'account_id',
    justOne : false
});

accountSchema.pre('save' , async function(next){
    // Format telephone number as xxx-xxx-xxxx
    if (this.tel) {
        // Remove all non-numeric characters
        this.tel = this.tel.replace(/\D/g, '');

        // If the number has 10 digits, format it as xxx-xxx-xxxx
        if (this.tel.length === 10) {
            this.tel = this.tel.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
        } else {
            next(new Error('Telephone number must contain exactly 10 digits.'));
            return;
        }
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
});

accountSchema.methods.getSignedJwtToken = function(){
    return jwt.sign({id:this._id , role: this.role , hotel_id:this.hotel_id} , process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE
    });
}

accountSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password , this.password);
}

const Account = mongoose.model('Account', accountSchema);
export default Account;