import express from 'express'
import { addToCart, getUserCart, updateCart } from '../controllers/cartController.js';
import { calculateCartAPI } from '../controllers/checkoutController.js';
import authUser from '../middleware/authUser.js'

const cartRouter = express.Router()

cartRouter.post('/get',authUser,  getUserCart)
cartRouter.post('/add',authUser, addToCart)
cartRouter.post('/update',authUser, updateCart)
cartRouter.post('/calculate', authUser, calculateCartAPI)

export default cartRouter;