import orderModel from '../models/orderModel.js'
import userModel from '../models/userModel.js' 
import productModel from '../models/productModel.js'
import couponModel from '../models/couponModel.js'
import Stripe from 'stripe'
import razorpay from 'razorpay'
import { calculateOrderTotals } from './checkoutController.js'
import crypto from 'crypto'
import { sendOrderConfirmation, sendShippingUpdate } from '../utils/mailer.js'

// global variables
const currency = 'inr'
const deliveryCharge = 10

// gateway initialize 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
})

// Helper to deduct stock
const deductStock = async (items) => {
    for (const item of items) {
        if (item.size && item.quantity > 0) {
            const field = `stockQuantities.${item.size}`;
            await productModel.findByIdAndUpdate(item._id, {
                $inc: { [field]: -item.quantity }
            });
        }
    }
}

// Helper to handle coupon usage
const incrementCouponUsage = async (couponApplied) => {
    if (couponApplied) {
        try {
            await couponModel.findByIdAndUpdate(couponApplied._id, { $inc: { usedCount: 1 } });
        } catch (error) {
            console.log("Error incrementing coupon usage:", error);
        }
    }
}

// Placing orders using COD method 
const placeOrder = async (req, res) => {
    try {
        const { userId, items, address, couponCode } = req.body;

        // Securely calculate the actual amount on the backend
        const calculation = await calculateOrderTotals(items, couponCode, userId);
        if (calculation.couponError) {
            return res.status(400).json({ success: false, message: calculation.couponError });
        }
        if (calculation.stockError) {
            return res.status(400).json({ success: false, message: calculation.stockError });
        }

        const finalAmount = calculation.finalTotal + deliveryCharge;

        const orderData = {
            userId,
            items: calculation.finalItems, // Save the items with their discounted prices
            amount: finalAmount, 
            address,
            status: 'Order Placed', 
            paymentMethod: 'COD',
            payment: false,
            date: Date.now()
        }
        
        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await incrementCouponUsage(calculation.couponApplied);
        await deductStock(calculation.finalItems);

        await userModel.findByIdAndUpdate(userId, {cartData: {}})

        const user = await userModel.findById(userId);
        if (user && user.email) {
            await sendOrderConfirmation(user.email, newOrder);
        }

        res.json({
            success: true,
            message: "Order Placed"
        })
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Placing orders using Stripe method 
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address, couponCode } = req.body;
        const { origin } = req.headers;

        const calculation = await calculateOrderTotals(items, couponCode, userId);
        if (calculation.couponError) {
            return res.status(400).json({ success: false, message: calculation.couponError });
        }
        if (calculation.stockError) {
            return res.status(400).json({ success: false, message: calculation.stockError });
        }

        const finalAmount = calculation.finalTotal + deliveryCharge;

        const orderData = {
            userId,
            items: calculation.finalItems,
            amount: finalAmount, 
            address,
            status: 'Order Placed', 
            paymentMethod: 'Stripe',
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()
        
        // Prepare Stripe line items using the securely discounted unit prices
        const line_items = calculation.finalItems.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }))

        // If a coupon was applied, we add it as a negative discount line item or just distribute the discount.
        // Stripe doesn't allow negative line items easily. 
        // A better approach is to create a Stripe Coupon on the fly, but for simplicity, 
        // if couponDiscount > 0, we can add a 'Coupon Applied' line item... wait, Stripe requires amount > 0.
        // To fix this without Stripe Coupons, we can apply the coupon proportionally to items or use Stripe discounts array.
        // For production-readiness, we'll use `discounts` if we want, or adjust `unit_amount` proportionally.
        // Let's adjust `unit_amount` proportionally to avoid complex Stripe Coupon syncs.
        
        if (calculation.couponDiscount > 0) {
            const discountRatio = calculation.finalTotal / calculation.subtotal;
            line_items.forEach(li => {
                li.price_data.unit_amount = Math.round(li.price_data.unit_amount * discountRatio);
            });
        }

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

        await incrementCouponUsage(calculation.couponApplied);

        res.json({success: true, session_url: session.url});

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// Placing orders using Razorpay method 
const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, address, couponCode } = req.body;

        const calculation = await calculateOrderTotals(items, couponCode, userId);
        if (calculation.couponError) {
            return res.status(400).json({ success: false, message: calculation.couponError });
        }
        if (calculation.stockError) {
            return res.status(400).json({ success: false, message: calculation.stockError });
        }

        const finalAmount = calculation.finalTotal + deliveryCharge;

        const orderData = {
            userId,
            items: calculation.finalItems,
            amount: finalAmount, 
            address,
            status: 'Order Placed', 
            paymentMethod: 'Razorpay',
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const options = {
            amount: finalAmount * 100, // Amount in paise (1 INR = 100 paise)
            currency: currency.toUpperCase(),
            receipt: newOrder._id.toString()
        }

        const razorpayOrder = await razorpayInstance.orders.create(options)

        await incrementCouponUsage(calculation.couponApplied);

        res.json({
            success: true,
            order: razorpayOrder
        })

    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}

// All orders data for Admin Panel 
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({success: true, orders})
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}

// User order Data for Frontend
const userOrders = async (req, res) => {
    try {
        const {userId} = req.body

        const orders = await orderModel.find({userId})
        res.json({success: true, orders})
        
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}

// update order Status from Admin Panel
const updateStatus = async (req, res) => {
    try {
        const {orderId, status} = req.body
        
        const updateData = {status}
        if (status === 'Delivered') {
            updateData.payment = true
        }
        
        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, updateData, {new: true})
        
        const user = await userModel.findById(updatedOrder.userId);
        if (user && user.email) {
            await sendShippingUpdate(user.email, updatedOrder);
        }

        res.json({success: true, message: 'Status Updated'})
        
    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: error.message
        })
    }
}

// Verify Stripe payment
const verifyStripe = async (req, res) => {
    try {
        const {orderId, success} = req.body;

        if (success === "true") {
            const updatedOrder = await orderModel.findByIdAndUpdate(orderId, {payment: true}, {new: true});
            await userModel.findByIdAndUpdate(req.body.userId, {cartData: {}});
            
            if (updatedOrder) {
                await deductStock(updatedOrder.items);
            }

            const user = await userModel.findById(req.body.userId);
            if (user && user.email && updatedOrder) {
                await sendOrderConfirmation(user.email, updatedOrder);
            }

            res.json({success: true, message: "Payment Successful"});
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({success: false, message: "Payment Failed"});
        }
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

// Verify Razorpay payment
const verifyRazorpay = async (req, res) => {
    try {
        const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const orderInfo = await orderModel.findById(req.body.receipt || req.body.orderId); // We pass order._id as receipt or orderId

        if (!orderInfo) {
             return res.json({ success: false, message: "Order not found" });
        }

        // Create expected signature
        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment verified
            const updatedOrder = await orderModel.findByIdAndUpdate(orderInfo._id, { payment: true }, {new: true});
            await userModel.findByIdAndUpdate(userId, { cartData: {} });
            
            if (updatedOrder) {
                await deductStock(updatedOrder.items);
            }

            const user = await userModel.findById(userId);
            if (user && user.email && updatedOrder) {
                await sendOrderConfirmation(user.email, updatedOrder);
            }

            res.json({ success: true, message: "Payment Successful" });
        } else {
            // Invalid signature
            res.json({ success: false, message: "Invalid Signature" });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { verifyStripe, placeOrder, placeOrderStripe, placeOrderRazorpay, verifyRazorpay, allOrders, userOrders, updateStatus }
