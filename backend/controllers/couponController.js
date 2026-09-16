import couponModel from '../models/couponModel.js';

// Add new coupon
const addCoupon = async (req, res) => {
    try {
        const { code, type, value, expirationDate, minOrderValue, usageLimit, eligibleUsers, isActive } = req.body;
        
        // Check if code already exists
        const existingCoupon = await couponModel.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }
        
        const newCoupon = new couponModel({
            code: code.toUpperCase(),
            type,
            value,
            expirationDate,
            minOrderValue,
            usageLimit,
            eligibleUsers,
            isActive
        });
        
        await newCoupon.save();
        res.json({ success: true, message: 'Coupon added successfully', coupon: newCoupon });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update coupon
const updateCoupon = async (req, res) => {
    try {
        const { id, code, type, value, expirationDate, minOrderValue, usageLimit, eligibleUsers, isActive } = req.body;
        
        const coupon = await couponModel.findByIdAndUpdate(id, {
            code: code.toUpperCase(),
            type,
            value,
            expirationDate,
            minOrderValue,
            usageLimit,
            eligibleUsers,
            isActive
        }, { new: true });
        
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        
        res.json({ success: true, message: 'Coupon updated successfully', coupon });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete coupon
const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.body;
        await couponModel.findByIdAndDelete(id);
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// List all coupons (Admin)
const listCoupons = async (req, res) => {
    try {
        const coupons = await couponModel.find({});
        res.json({ success: true, coupons });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addCoupon, updateCoupon, deleteCoupon, listCoupons };
