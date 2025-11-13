import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skillconnect";
  try {
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined });
    const { host, name } = mongoose.connection;
    console.log(`✅ MongoDB Connected: ${host}/${name}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err?.message || err);
  }
}
