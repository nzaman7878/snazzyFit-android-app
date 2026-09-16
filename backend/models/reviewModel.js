import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    userId: {
        type: String, // String as used in orderModel
        required: true
    },
    productId: {
        type: String, // String to match typical usage in this codebase
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewText: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Enforce one review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

const reviewModel = mongoose.models.review || mongoose.model('review', reviewSchema);

export default reviewModel;
