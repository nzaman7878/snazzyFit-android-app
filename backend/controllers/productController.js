import {v2 as cloudinary} from 'cloudinary';

import productModel from '../models/productModel.js';
import discountModel from '../models/discountModel.js';

// Helper to apply active discounts to products
const applyDiscountsToProducts = async (products) => {
    const currentDate = new Date();
    // Use lenient timezone check (allow 24 hours leeway)
    const lenientStart = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    const lenientEnd = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    
    const activeDiscounts = await discountModel.find({
        isActive: true,
        startDate: { $lte: lenientStart },
        endDate: { $gte: lenientEnd }
    });

    const isArray = Array.isArray(products);
    const productsList = isArray ? products : [products];

    const updatedProducts = productsList.map(product => {
        let itemDiscountAmount = 0;
        let bestDiscount = null;
        const originalPrice = product.price;

        for (const discount of activeDiscounts) {
            let applies = false;
            if (discount.targetType === 'sitewide') applies = true;
            else if (discount.targetType === 'category' && discount.targetIds.includes(product.category)) applies = true;
            else if (discount.targetType === 'subCategory' && discount.targetIds.includes(product.subCategory)) applies = true;
            else if (discount.targetType === 'product' && discount.targetIds.includes(String(product._id))) applies = true;

            if (applies) {
                let currentDiscountAmt = 0;
                if (discount.type === 'percentage') {
                    currentDiscountAmt = (originalPrice * discount.value) / 100;
                } else if (discount.type === 'fixed') {
                    currentDiscountAmt = discount.value;
                }

                if (currentDiscountAmt > itemDiscountAmount) {
                    itemDiscountAmount = currentDiscountAmt;
                    bestDiscount = discount;
                }
            }
        }

        const discountedPrice = Math.max(0, originalPrice - itemDiscountAmount);
        
        let productObj = product.toObject ? product.toObject() : { ...product };
        
        if (itemDiscountAmount > 0) {
            productObj.originalPrice = originalPrice;
            productObj.price = discountedPrice;
            productObj.discountInfo = {
                type: bestDiscount.type,
                value: bestDiscount.value,
                amountSaved: itemDiscountAmount,
                percentageSaved: Math.round((itemDiscountAmount / originalPrice) * 100)
            };
        }
        
        return productObj;
    });

    return isArray ? updatedProducts : updatedProducts[0];
};

// Function to add a new product
const addProduct = async (req, res) => {
  try {
    
    const { name, description, price, category, subCategory, sizes, stockQuantities, bestseller, outOfStock, discountType, discountValue, discountStartDate, discountEndDate } = req.body;

    
    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    // Filter out undefined images
    const images = [image1, image2, image3, image4].filter(item => item !== undefined);

    if (images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required.' });
    }

    // Upload all valid images to Cloudinary
    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: 'image'
        });
        return result.secure_url;
      })
    );

    // Create product data object
    const productData = {
      name,
      description,
      price: Number(price),
      bestseller: bestseller === 'true' || bestseller === true, 
      outOfStock: outOfStock === 'true' || outOfStock === true,
      category,
      subCategory,
      sizes: JSON.parse(sizes), 
      stockQuantities: stockQuantities ? JSON.parse(stockQuantities) : {},
      image: imagesUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save product to the database
    const product = new productModel(productData);
    await product.save();

    // Handle Discount
    if (discountType && discountValue && discountStartDate && discountEndDate) {
        const newDiscount = new discountModel({
            name: `${name} Special Discount`,
            type: discountType,
            value: Number(discountValue),
            targetType: 'product',
            targetIds: [String(product._id)],
            startDate: new Date(discountStartDate),
            endDate: new Date(discountEndDate),
            isActive: true
        });
        await newDiscount.save();
    }

    res.json({
      success: true,
      message: 'Product added successfully',
      productId: product._id
    });

  } catch (error) {
    console.error('Error in List Product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while adding product'
    });
  }
};




//Function for list product

//Function for list product

const listProducts = async (req, res) => {
  try {
    const { page, limit, search, category, subCategory, sortType, bestseller } = req.query;
    
    let query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    
    // Support category and subCategory as arrays or comma-separated strings
    if (category) {
      const catArray = Array.isArray(category) ? category : category.split(',');
      if (catArray.length > 0 && catArray[0] !== '') {
        query.category = { $in: catArray };
      }
    }
    
    if (subCategory) {
      const subCatArray = Array.isArray(subCategory) ? subCategory : subCategory.split(',');
      if (subCatArray.length > 0 && subCatArray[0] !== '') {
        query.subCategory = { $in: subCatArray };
      }
    }
    
    if (bestseller === 'true') query.bestseller = true;

    let sortOption = {};
    if (sortType === 'low - high') sortOption.price = 1;
    else if (sortType === 'high - low') sortOption.price = -1;
    else sortOption.createdAt = -1; // Default sort

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 0; // If 0, fetches all matching
    
    let productsQuery = productModel.find(query).sort(sortOption);
    
    if (limitNum > 0) {
      productsQuery = productsQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }
    
    const products = await productsQuery;
    const totalProducts = await productModel.countDocuments(query);
    const totalPages = limitNum > 0 ? Math.ceil(totalProducts / limitNum) : 1;
    
    const productsWithDiscounts = await applyDiscountsToProducts(products);

    res.json({
      success: true,
      message: 'Products fetched successfully',
      products: productsWithDiscounts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error in listProducts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while listing products'
    });
  }
};


// function for removing  product


const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.',
      });
    }

    const deletedProduct = await productModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product removed successfully',
    });
  } catch (error) {
    console.error('Error in removeProduct:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while removing the product',
    });
  }
};



// function for single product info

const singleProduct = async (req, res) => {
  try {
    const productId = req.body?.productId || req.query?.productId;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
    }

    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const productWithDiscount = await applyDiscountsToProducts(product);

    res.json({
      success: true,
      message: 'Product fetched successfully',
      product: productWithDiscount,
    });
  } catch (error) {
    console.error('Error in singleProduct:', error); 
    res.status(500).json({
      success: false,
      message: 'Something went wrong while fetching product',
    });
  }
};

// Function to update a product
const updateProduct = async (req, res) => {
  try {
    const { id, name, description, price, category, subCategory, sizes, stockQuantities, bestseller, outOfStock, discountType, discountValue, discountStartDate, discountEndDate } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const image1 = req.files && req.files.image1 && req.files.image1[0];
    const image2 = req.files && req.files.image2 && req.files.image2[0];
    const image3 = req.files && req.files.image3 && req.files.image3[0];
    const image4 = req.files && req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(item => item !== undefined);

    let productData = {
      name,
      description,
      price: Number(price),
      bestseller: bestseller === 'true' || bestseller === true,
      outOfStock: outOfStock === 'true' || outOfStock === true,
      category,
      subCategory,
      sizes: sizes ? JSON.parse(sizes) : [],
      stockQuantities: stockQuantities ? JSON.parse(stockQuantities) : {},
      updatedAt: new Date()
    };

    if (images.length > 0) {
      const imagesUrl = await Promise.all(
        images.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, {
            resource_type: 'image'
          });
          return result.secure_url;
        })
      );
      productData.image = imagesUrl;
    }

    const updatedProduct = await productModel.findByIdAndUpdate(id, productData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Handle Discount
    if (discountType && discountValue && discountStartDate && discountEndDate) {
        const discountPayload = {
            name: `${name} Special Discount`,
            type: discountType,
            value: Number(discountValue),
            targetType: 'product',
            targetIds: [String(id)],
            startDate: new Date(discountStartDate),
            endDate: new Date(discountEndDate),
            isActive: true
        };

        const existingDiscount = await discountModel.findOne({ targetType: 'product', targetIds: String(id) });
        if (existingDiscount) {
            await discountModel.findByIdAndUpdate(existingDiscount._id, discountPayload);
        } else {
            await (new discountModel(discountPayload)).save();
        }
    } else {
        // If discount fields are empty, remove existing specific discount if any
        await discountModel.findOneAndDelete({ targetType: 'product', targetIds: String(id) });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error in Update Product:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while updating product'
    });
  }
};


// Function to get multiple products by IDs (used for Cart/Orders)
const getMultipleProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid product IDs array' });
    }
    const products = await productModel.find({ _id: { $in: ids } });
    const productsWithDiscounts = await applyDiscountsToProducts(products);
    
    res.json({
      success: true,
      products: productsWithDiscounts
    });
  } catch (error) {
    console.error('Error in getMultipleProducts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Function for search suggestions
const searchSuggestions = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.json({ success: true, suggestions: [] });
        }
        
        // Search by name using regex (case-insensitive)
        const products = await productModel.find({
            name: { $regex: query, $options: 'i' }
        })
        .select('name _id image price') // Only fetch necessary fields
        .limit(5); // Limit suggestions to 5 items
        
        // Apply discounts to these products if any
        const suggestions = await applyDiscountsToProducts(products);

        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}


export {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  updateProduct,
  getMultipleProducts,
  searchSuggestions
};