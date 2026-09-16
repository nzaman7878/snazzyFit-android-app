import mongoose from "mongoose";


const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: { 
        type: String, 
        required: true,
        trim: true
    },
    price: { 
        type: Number, 
        required: true,
        min: [0, 'Price cannot be negative']
    },
   image: {
  type: [String],   
  required: true,
  validate: {
    validator: arr => arr.length > 0,
    message: 'At least one image is required',
  }
},
    category: { 
        type: String, 
        required: true,
        enum: ['Men', 'Women', 'Kids']
    },
    subCategory: { 
        type: String, 
        required: true,
        enum: ['Topwear', 'Bottomwear', 'Winterwear']
    },
    sizes: { 
        type: [String], 
        required: true,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    },
    stockQuantities: {
        type: Object,
        default: {}
    },
    bestseller: { 
        type: Boolean, 
        default: true 
    },
    outOfStock: {
        type: Boolean,
        default: false
    },
    date: { 
        type: Date, 
        default: Date.now,
        required: true 
    },
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Add indexes for better query performance
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ bestseller: -1 });
productSchema.index({ price: 1 });

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;