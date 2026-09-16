import reviewModel from '../models/reviewModel.js';
import productModel from '../models/productModel.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

// Helper to update product averages
const updateProductAverages = async (productId) => {
    try {
        const reviews = await reviewModel.find({ productId });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
            ? reviews.reduce((acc, item) => item.rating + acc, 0) / totalReviews 
            : 0;

        await productModel.findByIdAndUpdate(productId, {
            averageRating: Number(averageRating.toFixed(1)),
            totalReviews
        });
    } catch (error) {
        console.log('Error updating product averages:', error);
    }
};

// Add a new review
const addReview = async (req, res) => {
    try {
        const { userId, productId, rating, reviewText } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5' });
        }

        // Check if user has already reviewed
        const existingReview = await reviewModel.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }

        // Check if user ordered this product and if it's delivered
        const userOrders = await orderModel.find({ userId, status: 'Delivered' });
        
        let hasPurchased = false;
        for (const order of userOrders) {
            if (order.items.some(item => String(item._id) === String(productId))) {
                hasPurchased = true;
                break;
            }
        }

        if (!hasPurchased) {
            return res.status(403).json({ success: false, message: 'You can only review products you have purchased and received' });
        }

        // Get userName
        const user = await userModel.findById(userId);
        const userName = user ? user.name : 'Verified Buyer';

        const review = new reviewModel({
            userId,
            productId,
            userName,
            rating: Number(rating),
            reviewText
        });

        await review.save();
        await updateProductAverages(productId);

        res.json({ success: true, message: 'Review added successfully', review });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update an existing review
const updateReview = async (req, res) => {
    try {
        const { reviewId, userId, rating, reviewText } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5' });
        }

        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
        }

        review.rating = Number(rating);
        review.reviewText = reviewText;
        await review.save();

        await updateProductAverages(review.productId);

        res.json({ success: true, message: 'Review updated successfully', review });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a review (by User)
const deleteReview = async (req, res) => {
    try {
        const { reviewId, userId } = req.body;

        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
        }

        const productId = review.productId;
        await reviewModel.findByIdAndDelete(reviewId);

        await updateProductAverages(productId);

        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get reviews for a product
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await reviewModel.find({ productId }).sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Check if a user can review a product
const canReview = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        
        if (!userId) {
             return res.json({ success: true, canReview: false, hasReviewed: false });
        }

        const existingReview = await reviewModel.findOne({ userId, productId });
        if (existingReview) {
            return res.json({ success: true, canReview: false, hasReviewed: true, review: existingReview });
        }

        const userOrders = await orderModel.find({ userId, status: 'Delivered' });
        let hasPurchased = false;
        
        for (const order of userOrders) {
            if (order.items.some(item => String(item._id) === String(productId))) {
                hasPurchased = true;
                break;
            }
        }

        res.json({ success: true, canReview: hasPurchased, hasReviewed: false });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- Admin Endpoints ---

// Get all reviews for admin panel
const getAllReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.find({}).sort({ createdAt: -1 });
        // Optionally populate product details or fetch them if needed
        res.json({ success: true, reviews });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin delete review (moderation)
const adminDeleteReview = async (req, res) => {
    try {
        const { reviewId } = req.body;

        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const productId = review.productId;
        await reviewModel.findByIdAndDelete(reviewId);

        await updateProductAverages(productId);

        res.json({ success: true, message: 'Review deleted by admin successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addReview, updateReview, deleteReview, getProductReviews, canReview, getAllReviews, adminDeleteReview };
