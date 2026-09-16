import categoryModel from '../models/categoryModel.js';

// Add a category or subcategory
const addCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.json({ success: false, message: 'Name and Type are required' });
    }

    const category = new categoryModel({ name, type });
    await category.save();

    res.json({ success: true, message: `${type} added successfully`, category });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.json({ success: false, message: 'This item already exists' });
    }
    res.json({ success: false, message: error.message });
  }
};

// Remove a category or subcategory
const removeCategory = async (req, res) => {
  try {
    const { id } = req.body;
    await categoryModel.findByIdAndDelete(id);
    res.json({ success: true, message: 'Item removed successfully' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// List all categories and subcategories
const listCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({});
    res.json({ success: true, categories });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export { addCategory, removeCategory, listCategories };
