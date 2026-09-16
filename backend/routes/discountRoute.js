import express from 'express';
import { addDiscount, updateDiscount, deleteDiscount, listDiscounts, activeDiscounts, getProductDiscount } from '../controllers/discountController.js';
import adminAuth from '../middleware/adminAuth.js';

const discountRouter = express.Router();

discountRouter.post('/add', adminAuth, addDiscount);
discountRouter.post('/update', adminAuth, updateDiscount);
discountRouter.post('/delete', adminAuth, deleteDiscount);
discountRouter.get('/list', adminAuth, listDiscounts);
discountRouter.get('/active', activeDiscounts);
discountRouter.get('/product/:id', adminAuth, getProductDiscount);

export default discountRouter;
