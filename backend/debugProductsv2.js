import mongoose from 'mongoose';
import DigitalProduct from './src/models/digitalProduct.js';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';

dotenv.config();

const run = async () => {
    try {
        await connectDB();
        console.log("DB_CONNECTED");

        const products = await DigitalProduct.find({});
        console.log("PRODUCTS_START");
        console.log(JSON.stringify(products, null, 2));
        console.log("PRODUCTS_END");

    } catch (e) {
        console.error(e);
    } finally {
        // Allow time for logs
        setTimeout(() => process.exit(0), 1000);
    }
};

run();
