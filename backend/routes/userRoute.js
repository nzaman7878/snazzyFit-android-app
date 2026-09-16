import express from 'express';
import userController from '../controllers/userController.js';
import authUser from '../middleware/authUser.js';

const userRouter = express.Router();

userRouter.post('/login', userController.loginUser);
userRouter.post('/register', userController.registerUser);
userRouter.post('/admin', userController.adminLogin);

// Profile routes
userRouter.post('/profile/get', authUser, userController.getUserProfile);
userRouter.post('/profile/update', authUser, userController.updateUserProfile);

// Wishlist route
userRouter.post('/wishlist/toggle', authUser, userController.toggleWishlist);

// Password Reset Routes
userRouter.post('/forgot-password', userController.forgotPassword);
userRouter.post('/reset-password', userController.resetPassword);

export default userRouter;
