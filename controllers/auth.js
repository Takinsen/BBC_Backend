// Import model
import Account from "../models/Account.js";

export const register = async (req, res) => {
    try{

        // Check if email and tel already exists
        const { email , tel } = req.body;

        // Validation

        const checkEmail = await Account.findOne({ email });
        const checkTel = await Account.findOne({ tel });

        if(checkEmail || checkTel) return res.status(400).json({
            success: false,
            message: "Email or tel already exists , please try again"
        });

        // Create account

        const account = await Account.create(req.body);

        sendTokenResponse(account , 200 , "Register successfully" , res);

    } catch(err){
        res.status(400).json({
            success: false,
            message: "Register failed!",
            error: err.message
        });
        console.log(err.stack);
    }
};

export const login = async (req, res) => {
    try{
        const { email , password } = req.body;

        if(!email || !password)
            return res.status(401).json({
                success : false,
                message : 'Please provide an email and password'
            });

        const account = await Account.findOne({ email }).select('+password');

        if(!account) return res.status(401).json({ success : false, message: 'Invalid credentials'});

        const isMatch = await account.matchPassword(password);

        if(!isMatch) return res.status(401).json({ success : false, message: 'Invalid credentials'});

        sendTokenResponse(account , 200 , "Login successfully", res);

    } catch(err){
        res.status(400).json({
            success: false,
            error: err.message
        });
        console.log(err.stack);
    }
};
export const getMe = async(req,res,next)=>{
    console.log(req.user);
    const account = await Account.findById(req.user.id);
    res.status(200).json({
        success : true,
        message : "Get your account information successfully",
        role : account.role,
        account
    })
}

const sendTokenResponse = (account, statusCode, message , res) => {

    const token = account.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    }

    if(process.env.NODE_ENV === 'production')
        options.secure = true;

    res.status(statusCode).cookie('token',token,options).json({
        success: true,
        message,
        role : account.role,
        account,
        token
    });
};

export const logout = async (req, res) => {
    // make token null and set expired
    res.cookie('token','none',{
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Logout successfully'
    });
};