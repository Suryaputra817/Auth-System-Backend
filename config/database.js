import mongoose from "mongoose";
import config from "./config.js";
async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI)
    console.log("MongoDB connected");
    
  } catch (error) {
     console.log("MONGODB connection FAILED ", error);
     process.exit(1);
  }
}

export default connectDB
