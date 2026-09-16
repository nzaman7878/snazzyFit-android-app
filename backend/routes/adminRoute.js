import express from 'express';
import { getDashboardStats, listUsers, removeUser } from '../controllers/adminController.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

adminRouter.get('/dashboard', adminAuth, getDashboardStats);
adminRouter.get('/users', adminAuth, listUsers);
adminRouter.post('/user/remove', adminAuth, removeUser);

export default adminRouter;
