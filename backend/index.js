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
import vendorOrderRouter from "./routes/vendor/vendorOrderRoute.js";
import couponRouter from "./routes/vendor/couponRoute.js";
import userRouter from "./routes/users/userRoute.js";
import addressRouter from "./routes/users/addressRoute.js";
import orderRouter from "./routes/users/orderRoute.js";
dotenv.config();
const app = express();

// CORS configuration - support multiple origins
const allowedOrigins = [
  "https://restrobazaar.in",
  "https://www.restrobazaar.in",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
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
app.use("/api/v1", vendorOrderRouter);
app.use("/api/v1", couponRouter);
app.use("/api/v1", userRouter);
app.use("/api/v1", addressRouter);
app.use("/api/v1", orderRouter);



app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});