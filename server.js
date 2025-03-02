// -------------------------- Import -------------------------- //

// Library
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { xss } from 'express-xss-sanitizer';
import helmet from 'helmet';

// Function
import { connectDB } from './config/db.js';

// API
import auth from './routes/auth.js';
import hotels from './routes/hotels.js';
import rooms from './routes/rooms.js';
import bookings from './routes/bookings.js';
import accounts from './routes/accounts.js';

// -------------------------- Setting -------------------------- //

// Config
dotenv.config();

// Initialize app
const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

//Prevent XSS attacks
app.use(xss());

// API Routes 
app.use('/api/auth' , auth);
app.use('/api/hotels' , hotels);
app.use('/api/rooms' , rooms);
app.use('/api/bookings' , bookings);
app.use('/api/auth', auth);
app.use('/api/accounts', accounts);

// -------------------------- Start the Server -------------------------- //

const PORT = process.env.PORT || 5000;

const initializeServer = async () => {
    try {
        console.log('Backend server is starting...');
        await connectDB();
        const server = app.listen(PORT, () => { console.log(`Backend server is ready at http://localhost:${PORT}`);});

        // -------------------------- Handle Error -------------------------- //
        process.on('unhandledRejection' , (err , promise)=> {
            console.log(`Error : ${err.message}`);
            server.close(() => process.exit);
        });

    }
    catch(err){
        console.log("Failed to start backend server:" , err);
    }
}

initializeServer();