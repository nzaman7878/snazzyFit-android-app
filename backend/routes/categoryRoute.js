import express from 'express';
import { addCategory, listCategories, removeCategory } from '../controllers/categoryController.js';
import adminAuth from '../middleware/adminAuth.js';

const categoryRouter = express.Router();

categoryRouter.get('/list', listCategories); // Open for frontend to fetch
categoryRouter.post('/add', adminAuth, addCategory);
categoryRouter.post('/remove', adminAuth, removeCategory);

export default categoryRouter;
