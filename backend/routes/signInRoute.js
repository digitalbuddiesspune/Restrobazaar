import express from 'express';
const signInRouter = express.Router();
import signIn from '../controller/signInController.js';

signInRouter.route('/auth/sign-in').post(signIn);
export default signInRouter;