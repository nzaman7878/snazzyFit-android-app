import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongoDB.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import adminRouter from './routes/adminRoute.js';
import reviewRouter from './routes/reviewRoute.js';
import discountRouter from './routes/discountRoute.js';
import couponRouter from './routes/couponRoute.js';

// Security Middlewares
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// xss-clean replaced with custom middleware import below

// App config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// Middlewares
app.use(express.json());
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}));

// Set security HTTP headers
app.use(helmet());

// Data sanitization against NoSQL query injection
// Using custom middleware because express-mongo-sanitize reassigns req.query which throws in Express 5
app.use((req, res, next) => {
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key]);
    }
  });
  next();
});

import { clean } from 'xss-clean/lib/xss.js';

// Data sanitization against XSS
// Using custom middleware because xss-clean reassigns req.query which throws in Express 5
app.use((req, res, next) => {
  if (req.body) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  if (req.query) {
    const cleanedQuery = clean(req.query);
    for (const key in req.query) {
      delete req.query[key];
    }
    for (const key in cleanedQuery) {
      req.query[key] = cleanedQuery[key];
    }
  }
  next();
});

// Rate limiting (limit each IP to 500 requests per 15 mins)
const limiter = rateLimit({
    max: 500,
    windowMs: 15 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in 15 minutes!'
});
app.use('/api', limiter);



// API endpoints

app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/category', categoryRouter);
app.use('/api/cart', cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/admin', adminRouter)
app.use('/api/reviews', reviewRouter)
app.use('/api/discounts', discountRouter)
app.use('/api/coupons', couponRouter)
app.get('/', (req, res) => {
    res.send('API Working');
});

// Start server
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
