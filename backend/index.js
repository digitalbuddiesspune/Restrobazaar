import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/databaseConnection.js";
import superAdminRouter from "./routes/admin/superAdminRoute.js";
import categoryRouter from "./routes/admin/categoryRoute.js";
import cityRouter from "./routes/admin/cityRoute.js";
import globalProductRouter from "./routes/admin/globalProductRoute.js";
import vendorRouter from "./routes/admin/vendorRoute.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
await connectDB();

//admin routes 
app.use("/api/v1", superAdminRouter);
app.use("/api/v1", categoryRouter);
app.use("/api/v1", cityRouter);
app.use("/api/v1", globalProductRouter);
app.use("/api/v1", vendorRouter);



app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});