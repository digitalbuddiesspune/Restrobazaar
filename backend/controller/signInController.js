import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const signIn = async (req, res) => {
    try{
        const {email, password}= req.body;
        const user = await User.findOne({email}).select('+password');
        if(!user){
            return res.status(401).json({message: 'user not found'});
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(401).json({message: 'Invalid password'});
        }
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '1d'});
        res.status(200).json({message: 'Login successful', token});
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Login failed'});
    }
}
export default signIn;