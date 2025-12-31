import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./config/databaseConnection.js";
import superAdminRouter from "./routes/admin/superAdminRoute.js";
import categoryRouter from "./routes/admin/categoryRoute.js";
import cityRouter from "./routes/admin/cityRoute.js";
import globalProductRouter from "./routes/admin/globalProductRoute.js";
import vendorRouter from "./routes/admin/vendorRoute.js";
import vendorProductRouter from "./routes/vendor/vendorProductRoute.js";
import userRouter from "./routes/users/userRoute.js";
dotenv.config();
const app = express();

// CORS configuration - allow credentials for cookie-based auth
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Update with your frontend URL
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies from request
await connectDB();

//admin routes 
app.use("/api/v1", superAdminRouter);
app.use("/api/v1", categoryRouter);
app.use("/api/v1", cityRouter);
app.use("/api/v1", globalProductRouter);
app.use("/api/v1", vendorRouter);
app.use("/api/v1", vendorProductRouter);
app.use("/api/v1", userRouter);



app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});