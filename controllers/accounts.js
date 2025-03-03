import Account from '../models/Account.js';
import Booking from '../models/Booking.js';

export const getAccounts = async (req, res) => {
    try{
        let accounts;
        // hotel_admin can get all account in their hotel
        if(req.user.role == 'hotel_admin'){
            // hotel_admin must have hotel_id
            if(!req.user.hotel_id){
                return res.status(400).json({
                    success: false,
                    message: "Only hotel admin with hotel_id can view hotel's account"
                });
            }
            const booking = await Booking.find({hotel_id : req.user.hotel_id}).select('account_id');
            const account_ids = await Booking.map(booking => booking.account_id);

            accounts = await Account.find({_id : {$in : account_ids}}).select('first_name last_name tel email');
        }
        else{
            accounts = await Account.find().select('first_name last_name tel email');
        }
        res.status(200).json({
            success: true,
            data: accounts
        });
    }catch(err){
        res.status(400).json({
            success: false,
            error: err.message
        });
        console.log(err.stack);
    }
};

export const getAccount = async (req, res) => {
    try{
        let account;

        if(req.user.role == 'hotel_admin'){
            if(!req.user.hotel_id){
                return res.status(400).json({
                    success: false,
                    message: "Only hotel admin with hotel_id can view hotel's account"
                });
            }
            const booking = await Booking.findOne({
                account_id : req.params.id,
            });
            //if not found
            if(!booking){
                return res.status(404).json({
                    success: false,
                    message: "Account not found"
                });
            }
            //if account is other hotel
            if(booking.hotel_id != req.user.hotel_id){
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to view this account"
                });
            }
        }

        account = await Account.findById(req.params.id).select('first_name last_name tel email');
        if(!account){
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });

    }catch(err){
        res.status(400).json({
            success: false,
            error: err.message
        });
        console.log(err.stack);
    }
};

export const updateAccount = async (req, res) => {
    try{
        const {role,hotel_id} = req.user;
        let account_before;

        account_before = await Account.findById(req.params.id);
        if(!account_before){
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        //User role
        if(role === 'user' && req.params.id !== req.user.id){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this account"
            });
        }

        //Hotel admin role
        if(role === 'hotel_admin'){
            if(!hotel_id){
                return res.status(400).json({
                    success: false,
                    message: "Only hotel admin with hotel_id can update hotel's account"
                });
            }
            // hotel admin cannot update super admin account
            if(account_before.role === 'super_admin'){
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this account"
                });
            }
            const booking = await Booking.findOne({
                account_id : req.params.id,
            });
            if(!booking){
                return res.status(404).json({
                    success: false,
                    message: "Account not found"
                });
            }
            if(booking.hotel_id != hotel_id){
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this account"
                });
            }
        }

        account_after = await Account.findByIdAndUpdate(
            req.params.id,
            req.body,
            {new: true, runValidators: true}
        );

        res.status(200).json({
            success: true,
            before: account_before,
            after: account_after
        });

    }catch(err){
        res.status(400).json({
            success: false,
            error: err.message
        });
        console.log(err.stack);
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const { role, hotel_id} = req.user; // Extract user details
        let account = await Account.findById(req.params.id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        // User can only delete their own account
        if (role === 'user' && req.params.id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this account"
            });
        }

        // Hotel Admin Logic
        if (role === 'hotel_admin') {
            if (!hotel_id) {
                return res.status(400).json({
                    success: false,
                    message: "Only hotel admins with a hotel_id can delete accounts"
                });
            }

            // Hotel admin cannot delete a super admin account
            if (account.role === 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to delete a super admin"
                });
            }

            // Check if the user has a booking in this hotel
            const booking = await Booking.findOne({
                account_id: req.params.id,
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Account not found"
                });
            }

            if (booking.hotel_id != hotel_id) {
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to delete this account"
                });
            }
        }

        // Delete the account
        await account.remove();

        res.status(200).json({
            success: true,
            message: "Account deleted",
            data: {}
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
        console.log(err.stack);
    }
};

 