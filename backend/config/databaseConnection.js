import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const MONGO_URI = process.env.MONGO_URL;
if(!(MONGO_URI)){
  throw new Error('MONGO_URI is not defined');
}
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB: ${connection.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
export default connectDB;