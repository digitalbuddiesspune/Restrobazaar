import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import connectDB from './config/databaseConnection.js';
import signInRouter from './routes/signInRoute.js';
import signUpRouter from './routes/signUpRoute.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
import conectDB from './config/databaseConnection.js';
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/v1", signInRouter);
app.use("/api/v1", signUpRouter);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
  res.send("Hello World");
});
