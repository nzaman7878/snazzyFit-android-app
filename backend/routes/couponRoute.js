import express from 'express';
import { addCoupon, updateCoupon, deleteCoupon, listCoupons } from '../controllers/couponController.js';
import adminAuth from '../middleware/adminAuth.js';

const couponRouter = express.Router();

// Admin routes
couponRouter.post('/add', adminAuth, addCoupon);
couponRouter.post('/update', adminAuth, updateCoupon);
couponRouter.post('/delete', adminAuth, deleteCoupon);
couponRouter.get('/list', adminAuth, listCoupons);

export default couponRouter;
