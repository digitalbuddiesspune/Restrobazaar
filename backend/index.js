import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import connectDB from './config/databaseConnection.js';
import signInRouter from './routes/signInRoute.js';
import signUpRouter from './routes/signUpRoute.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/v1", signInRouter);
app.use("/api/v1", signUpRouter);

// Product routes
import productRouter from './routes/productRoute.js';
app.use("/api/v1", productRouter);

// Category routes
import categoryRouter from './routes/categoryRoute.js';
app.use("/api/v1", categoryRouter);

// Cart routes
import cartRouter from './routes/cartRoute.js';
app.use("/api/v1/cart", cartRouter);

// Wishlist routes
import wishlistRouter from './routes/wishlistRoute.js';
app.use("/api/v1/wishlist", wishlistRouter);

// City Admin routes
import cityAdminRouter from './routes/cityAdminRoute.js';
app.use("/api/v1", cityAdminRouter);

// User routes
import userRouter from './routes/userRoute.js';
app.use("/api/v1", userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});
