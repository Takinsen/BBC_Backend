import Account from '../models/Account.js';

export const getAccounts = async (req, res) => {
    try{
        const accounts = await Account.find();
        const {role,hotel_id} = req.user;

        // hotel_admin can get all account in their hotel
        if(role == 'hotel_admin'){
            const hotel_accounts = accounts.filter(account => account.hotel_id == hotel_id);
            return res.status(200).json({
                success: true,
                data: hotel_accounts
            });
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
        const account = await Account.findById(req.params.id);
        const {role,hotel_id} = req.user;

        if(!account){
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }
        
        if(role == 'hotel_admin' && account.hotel_id != hotel_id){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this account"
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

        const account_before = await Account.findById(req.params.id);
        const {_id} = req.body;
        const {role,hotel_id} = req.user;

        if(!account_before){
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        //role user must update himself
        if(role === 'user'){
            if(_id != req.user.id){
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this account"
                });
            }
        }

        //role hotel_admin ,can update himself and user in his hotel from booking
        if(role === 'hotel_admin'){
            // case user not in the same hotel
            // case that user is super_admin
            if(account_before.hotel_id != hotel_id || account_before.role === 'super_admin'){
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to update this account"
                });
            }
        }

        const account_after = await Account.findByIdAndUpdate(
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
    try{
        const account = await Account.findById(req.params.id);
        const {role,hotel_id} = req.user;

        if(!account){
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        if(role === 'user'){
            if(account._id != req.user.id){
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to delete this account"
                });
            }
        }

        if(role === 'hotel_admin'){
            if(account.hotel_id != hotel_id || account.role === 'super_admin'){
                return res.status(403).json({
                    success: false,
                    message: "You are not authorized to delete this account"
                });
            }
        }
        
        await account.remove();

        res.status(200).json({
            success: true,
            message: "Account deleted",
            data: {}
        });

    }catch(err){
        res.status(400).json({
            success: false,
            error: err.message
        });
        console.log(err.stack);
    }
};

 