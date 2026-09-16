import validator from 'validator';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordReset } from '../utils/mailer.js';

// Function to create JWT token
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};


// Route for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await userModel.findOne({ email }).select('+password'); 
    
    // If no user found
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      const token = createToken(user._id);
      res.json({
        success: true,
        token,
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      res.json({
        success: false,
        message: "Incorrect password"
      });
    }

  } catch (error) {
    console.log('Login error:', error);
    res.json({
      success: false,
      message: "Server Error"
    });
  }
};


// Route for user registration
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({
                success: false,
                message: "user already exists"
            });
        }

        // Validate email address
        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: "Please enter a valid email address"
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        // Hash user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        const user = await newUser.save();

        // Create a token and send it back to the user
        const token = createToken(user._id);
        res.json({ success: true, token });

    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Server Error"
        });
    }
};

// Route for admin Login


const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

   
    if (email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      
      const token = jwt.sign(
        { role: 'admin', email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      res.json({ success: true, token });
      
    
    } else {
      
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId).select('-password');
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.json({ success: false, message: 'Server Error' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId, name, email, password, phone, addresses } = req.body;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (addresses !== undefined) user.addresses = addresses;
    if (email) {
      if (!validator.isEmail(email)) {
        return res.json({ success: false, message: 'Please enter a valid email address' });
      }
      user.email = email;
    }
    if (password) {
      if (password.length < 8) {
        return res.json({ success: false, message: 'Password must be at least 8 characters long' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update profile error:', error);
    res.json({ success: false, message: 'Server Error' });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    let wishlist = user.wishlist || [];
    const index = wishlist.indexOf(productId);

    if (index > -1) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(productId);
    }

    user.wishlist = wishlist;
    await user.save();

    res.json({ success: true, message: 'Wishlist updated', wishlist });
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.json({ success: false, message: 'Server Error' });
  }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'There is no user with that email address.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Set expire time to 15 minutes
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const origin = req.headers.origin || 'http://localhost:5173';
        const resetUrl = `${origin}/reset-password/${resetToken}`;

        try {
            await sendPasswordReset(user.email, resetUrl);
            res.json({ success: true, message: 'Email sent with reset instructions' });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.json({ success: false, message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.json({ success: false, message: 'Server Error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await userModel.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.json({ success: false, message: 'Invalid or expired token' });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: 'Password must be at least 8 characters long' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.json({ success: false, message: 'Server Error' });
    }
};

export default { loginUser, registerUser, adminLogin, getUserProfile, updateUserProfile, toggleWishlist, forgotPassword, resetPassword };