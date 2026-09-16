import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
    try {
        const {token} = req.headers;
        if (!token) {
            return res.json({success:false, message:"Not authorized Login Again"})
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        if (token_decode.role !== 'admin') {
            return res.json({success:false, message:"Not authorized Login Again"})
            
        }
        next() 
    } catch (error) {
        console.log(error)
        res.json({success:false, message: error.message || "Server Error" })
    }
}


export default adminAuth;