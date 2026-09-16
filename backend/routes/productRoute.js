import express from 'express'
import {listProducts, addProduct, removeProduct, singleProduct, updateProduct, getMultipleProducts, searchSuggestions} from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';


const productRouter = express.Router();


productRouter.post(
  '/add', adminAuth,
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
  ]),
  addProduct
);


productRouter.post('/remove',adminAuth, removeProduct);
productRouter.get('/single', singleProduct);
productRouter.post('/multiple', getMultipleProducts);
productRouter.get('/list', listProducts);
productRouter.get('/search-suggestions', searchSuggestions);

productRouter.post(
  '/update', adminAuth,
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
  ]),
  updateProduct
);

export default productRouter;