import mongoose from 'mongoose';
import DigitalProduct from './src/models/digitalProduct.js';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';

dotenv.config();

const run = async () => {
    await connectDB();
    console.log("Connected to DB");

    const products = await DigitalProduct.find({});
    console.log(`Found ${products.length} products`);

    products.forEach(p => {
        console.log(`- ID: ${p._id}`);
        console.log(`  Name: ${p.name}`);
        console.log(`  IsActive: ${p.isActive}`);
        console.log(`  ProviderId: ${p.providerId}`);
        console.log(`  Stats: sales=${p.salesCount}`);
        console.log("-------------------");
    });

    process.exit();
};

run();
