import Product from "../models/ProductV2.js";
import mongoose from "mongoose";
/* =====================================
   CREATE PRODUCT
   ===================================== */

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================
   GET PRODUCTS (Category + City)
   ===================================== */
export const getProducts = async (req, res) => {
  try {
    const { category, city } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (city) filter.city = city.toLowerCase();

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================
   GET SINGLE PRODUCT
   ===================================== */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================
   CALCULATE PRICE (SINGLE / BULK)
   ===================================== */
export const calculateProductPrice = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);

    if (!product || !product.status) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let finalPrice = 0;
    let appliedTier = null;

    // SINGLE PRICE
    if (product.priceType === "single") {
      finalPrice = product.singlePrice * quantity;
    }

    // BULK PRICE
    if (product.priceType === "bulk" || product.priceType === "both") {
      const tier = product.bulkPrices
        .filter((t) => quantity >= t.minQty)
        .sort((a, b) => b.minQty - a.minQty)[0];

      if (tier) {
        finalPrice = tier.pricePerUnit * quantity;
        appliedTier = tier;
      } else if (product.singlePrice) {
        finalPrice = product.singlePrice * quantity;
      }
    }

    res.status(200).json({
      success: true,
      productId,
      quantity,
      pricePerUnit: appliedTier?.pricePerUnit || product.singlePrice,
      totalPrice: finalPrice,
      appliedTier,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================
   UPDATE PRODUCT
   ===================================== */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================
   DELETE PRODUCT (SOFT DELETE)
   ===================================== */
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
  }
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or already deleted",
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
