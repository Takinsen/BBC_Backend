// -------------------------- Import -------------------------- //

// Library
import express from 'express';
import dotenv from 'dotenv';

// Function
import { connectDB } from './config/db.js';

// API

// -------------------------- Setting -------------------------- //

// Config
dotenv.config();

// Initialize app
const app = express();

// Body parser
app.use(express.json());

// API Routes 

// -------------------------- Start the Server -------------------------- //

const PORT = process.env.PORT || 8000;

const initializeServer = async () =>{
    try{
        console.log('Backend server is starting...');
        connectDB();
        app.listen(PORT, () => { console.log(`Backend server is ready at http://localhost:${PORT}`);});
    }
    catch(err){
        console.log("Failed to start backend server:" , err);
    }
}

initializeServer();

// -------------------------- Handle Error -------------------------- //

process.on('unhandledRejection' , (err , promise)=> {
    console.log(`Error : ${err.message}`);
    server.close(()=>process.exit);
});