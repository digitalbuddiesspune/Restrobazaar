// Script to add test product for Round Containers
// Run this: node backend/scripts/addTestProduct.js

import dotenv from 'dotenv';
import connectDB from '../config/databaseConnection.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const addTestProduct = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find the Containers category
    const containersCategory = await Category.findOne({ slug: 'containers' });
    
    if (!containersCategory) {
      console.error('❌ Containers category not found! Please run seedCategories first.');
      process.exit(1);
    }

    console.log(`✓ Found category: ${containersCategory.name}`);

    // Test product data for Round Containers
    const testProduct = {
      name: "Premium Round Container with Lid - 500ml",
      slug: "premium-round-container-500ml",
      category: containersCategory._id,
      price: 25,
      originalPrice: 30,
      bulkOffers: [
        {
          minQty: 50,
          pricePerPiece: 22
        },
        {
          minQty: 100,
          pricePerPiece: 20
        },
        {
          minQty: 500,
          pricePerPiece: 18
        }
      ],
      quantity: 1000,
      images: [
        "https://res.cloudinary.com/debhhnzgh/image/upload/v1765968834/fb302d74-dfe2-437a-811b-293e1f117d70.png",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500"
      ],
      description: "High-quality premium round container with secure lid. Perfect for food storage and takeaway. Made from food-grade material, leak-proof design. Ideal for restaurants, cafes, and catering services.",
      specifications: {
        material: "Food Grade Plastic",
        lid: "Yes, Secure Snap-on Lid",
        color: "Clear/Transparent",
        type: "Round Containers",
        capacity: "500ml",
        shape: "Round",
        weight: "50g",
        size: {
          height: "8cm",
          width: "12cm",
          base: "12cm"
        }
      },
      features: [
        "Leak-proof design",
        "Microwave safe",
        "Dishwasher safe",
        "Stackable",
        "Food grade material",
        "BPA free",
        "Reusable",
        "Freezer safe"
      ],
      isActive: true
    };

    // Check if product already exists
    const existingProduct = await Product.findOne({ slug: testProduct.slug });
    
    if (existingProduct) {
      console.log('⚠️  Product already exists. Updating...');
      const updated = await Product.findByIdAndUpdate(existingProduct._id, testProduct, { new: true });
      console.log(`✅ Product updated: ${updated.name}`);
    } else {
      const product = new Product(testProduct);
      await product.save();
      console.log(`✅ Product created: ${product.name}`);
      console.log(`   Price: ₹${product.price}`);
      console.log(`   Category: ${containersCategory.name}`);
      console.log(`   Quantity: ${product.quantity}`);
    }

    console.log('\n✅ Test product added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test product:', error);
    process.exit(1);
  }
};

addTestProduct();

