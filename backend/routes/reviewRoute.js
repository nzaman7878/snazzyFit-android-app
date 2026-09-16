import express from 'express';
import { addReview, updateReview, deleteReview, getProductReviews, canReview, getAllReviews, adminDeleteReview } from '../controllers/reviewController.js';
import authUser from '../middleware/authUser.js';
import adminAuth from '../middleware/adminAuth.js'; // Assuming you have this middleware

const reviewRouter = express.Router();

// Public routes
reviewRouter.get('/product/:productId', getProductReviews);

// User routes
reviewRouter.post('/can-review', authUser, canReview);
reviewRouter.post('/add', authUser, addReview);
reviewRouter.post('/update', authUser, updateReview);
reviewRouter.post('/delete', authUser, deleteReview);

// Admin routes
reviewRouter.post('/admin/all', adminAuth, getAllReviews);
reviewRouter.post('/admin/delete', adminAuth, adminDeleteReview);

export default reviewRouter;
