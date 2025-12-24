import express from "express";
const signUpRouter = express.Router();
import signUp from "../controller/signUpController.js";

signUpRouter.route("/auth/sign-up").post(signUp);
export default signUpRouter;
