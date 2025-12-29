import User from '../models/user.js';
import Cart from '../models/cart.js';
import Wishlist from '../models/Wishlist.js';
import bcrypt from "bcryptjs";

const signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    // 2. Create empty cart for user
    const cart = await Cart.create({
      user: user._id,
      items: [],
      totalPrice: 0,
    });

    // 3. Create empty wishlist for user
    const wishlist = await Wishlist.create({
      user: user._id,
      products: [],
    });

    // 4. Attach cart to user
    user.cart = cart._id;
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      cartId: cart._id,
      wishlistId: wishlist._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed" });
  }
};
export default signup;