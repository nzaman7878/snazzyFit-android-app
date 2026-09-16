import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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
    targetType: {
        type: String,
        enum: ['sitewide', 'category', 'subCategory', 'product'],
        required: true
    },
    targetIds: {
        type: [String],
        default: []
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const discountModel = mongoose.models.discount || mongoose.model('discount', discountSchema);

export default discountModel;
