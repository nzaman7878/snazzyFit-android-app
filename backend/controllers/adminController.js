import productModel from '../models/productModel.js';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';

const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await productModel.countDocuments();
    const totalUsers = await userModel.countDocuments();
    const totalOrders = await orderModel.countDocuments();

    // Calculate total revenue from Delivered orders
    const revenueAggregation = await orderModel.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    // Get 5 most recent actionable orders
    const recentOrders = await orderModel.find({ 
      status: { $in: ['Order Placed', 'Packing'] } 
    })
    .sort({ date: -1 })
    .limit(5);

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue,
      },
      recentOrders
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.json({ success: false, message: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await userModel.find({}).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('List Users Error:', error);
    res.json({ success: false, message: error.message });
  }
};

const removeUser = async (req, res) => {
  try {
    const { userId } = req.body;
    await userModel.findByIdAndDelete(userId);
    res.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    console.error('Remove User Error:', error);
    res.json({ success: false, message: error.message });
  }
};

export { getDashboardStats, listUsers, removeUser };
