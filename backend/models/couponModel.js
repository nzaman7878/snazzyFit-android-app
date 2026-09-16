import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    expirationDate: {
        type: Date,
        required: true
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    usageLimit: {
        type: Number,
        default: null // null means unlimited
    },
    usedCount: {
        type: Number,
        default: 0
    },
    eligibleUsers: {
        type: [String],
        default: [] // empty means all users are eligible
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const couponModel = mongoose.models.coupon || mongoose.model('coupon', couponSchema);

export default couponModel;
