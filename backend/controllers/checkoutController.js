import productModel from '../models/productModel.js';
import discountModel from '../models/discountModel.js';
import couponModel from '../models/couponModel.js';

// Helper function to calculate order totals
export const calculateOrderTotals = async (items, couponCode, userId) => {
    let baseTotal = 0;
    let discountAmount = 0;
    let finalItems = [];

    // Fetch active product discounts
    const currentDate = new Date();
    const lenientStart = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    const lenientEnd = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    
    const activeDiscounts = await discountModel.find({
        isActive: true,
        startDate: { $lte: lenientStart },
        endDate: { $gte: lenientEnd }
    });

    // Process each item
    for (const item of items) {
        // Fetch the real product from DB for security
        const product = await productModel.findById(item._id || item.itemId);
        
        if (!product) continue;

        const quantity = item.quantity || 1;
        const size = item.size;

        if (size) {
            const stockQuantities = product.stockQuantities || {};
            const availableStock = stockQuantities[size] || 0;
            if (quantity > availableStock) {
                return { stockError: `Insufficient stock for ${product.name} (Size: ${size}). Available: ${availableStock}, Requested: ${quantity}.` };
            }
        }

        const originalPrice = product.price;
        let itemDiscountAmount = 0;

        // Check if any product discount applies to this item
        for (const discount of activeDiscounts) {
            let applies = false;
            
            if (discount.targetType === 'sitewide') {
                applies = true;
            } else if (discount.targetType === 'category' && discount.targetIds.includes(product.category)) {
                applies = true;
            } else if (discount.targetType === 'subCategory' && discount.targetIds.includes(product.subCategory)) {
                applies = true;
            } else if (discount.targetType === 'product' && discount.targetIds.includes(String(product._id))) {
                applies = true;
            }

            if (applies) {
                if (discount.type === 'percentage') {
                    itemDiscountAmount = Math.max(itemDiscountAmount, (originalPrice * discount.value) / 100);
                } else if (discount.type === 'fixed') {
                    itemDiscountAmount = Math.max(itemDiscountAmount, discount.value);
                }
            }
        }

        const discountedPrice = Math.max(0, originalPrice - itemDiscountAmount);
        
        baseTotal += (originalPrice * quantity);
        discountAmount += (itemDiscountAmount * quantity);
        
        finalItems.push({
            ...item,
            _id: product._id, // Ensure we have the true ID
            name: product.name,
            originalPrice,
            price: discountedPrice, // Discounted unit price
            quantity,
            size
        });
    }

    let subtotal = baseTotal - discountAmount;
    let couponDiscount = 0;
    let couponApplied = null;
    let couponError = null;

    // Apply coupon if provided
    if (couponCode) {
        const coupon = await couponModel.findOne({ code: couponCode.toUpperCase() });

        if (!coupon) {
            couponError = 'Invalid coupon code';
        } else if (!coupon.isActive) {
            couponError = 'Coupon is not active';
        } else if (new Date(coupon.expirationDate) < lenientEnd) {
            couponError = 'Coupon has expired';
        } else if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            couponError = 'Coupon usage limit reached';
        } else if (subtotal < coupon.minOrderValue) {
            couponError = `Minimum order value of ${coupon.minOrderValue} required`;
        } else if (coupon.eligibleUsers && coupon.eligibleUsers.length > 0 && userId && !coupon.eligibleUsers.includes(String(userId))) {
            couponError = 'You are not eligible to use this coupon';
        } else {
            // Coupon is valid
            if (coupon.type === 'percentage') {
                couponDiscount = (subtotal * coupon.value) / 100;
            } else {
                couponDiscount = coupon.value;
            }
            
            // Ensure coupon discount doesn't exceed subtotal
            couponDiscount = Math.min(couponDiscount, subtotal);
            couponApplied = coupon;
        }
    }

    const finalTotal = subtotal - couponDiscount;

    return {
        baseTotal,
        discountAmount,
        subtotal,
        couponDiscount,
        finalTotal,
        finalItems,
        couponApplied,
        couponError,
        stockError: null
    };
};

// API Endpoint for frontend to calculate cart totals before checkout
export const calculateCartAPI = async (req, res) => {
    try {
        const { items, couponCode } = req.body;
        // user is available via req.user if we use authUser middleware, but the frontend currently doesn't send req.user reliably to non-auth routes, 
        // wait, let's just get userId from req.body (added by auth middleware)
        const userId = req.body.userId;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Invalid items array' });
        }

        const calculation = await calculateOrderTotals(items, couponCode, userId);

        res.json({
            success: true,
            calculation
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
