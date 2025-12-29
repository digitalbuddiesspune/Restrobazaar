// Script to add detailed product with all fields (like the 25ml container)
// Run this: node backend/scripts/addDetailedProduct.js

import dotenv from 'dotenv';
import connectDB from '../config/databaseConnection.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const addDetailedProduct = async () => {
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

    // Detailed product data matching the image
    const detailedProduct = {
      name: "25ml Round Transparent Plastic Container Attached Lid",
      slug: "25ml-round-transparent-plastic-container-attached-lid",
      category: containersCategory._id,
      price: 0.86,
      originalPrice: 0.96,
      bulkOffers: [
        {
          minQty: 50,
          pricePerPiece: 0.91
        },
        {
          minQty: 200,
          pricePerPiece: 0.88
        },
        {
          minQty: 500,
          pricePerPiece: 0.86
        }
      ],
      quantity: 10000,
      images: [
        "https://res.cloudinary.com/debhhnzgh/image/upload/v1765968834/fb302d74-dfe2-437a-811b-293e1f117d70.png",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500"
      ],
      description: "25ml Round Transparent Plastic Container with Attached Lid - Perfect for chutney and dip container. Ideal for restaurants, cafes, and food packaging. Made of BPA free plastic, reusable and sturdy. Air-tight lid ensures zero spillage. Stackable design allows containers to fit inside each other for easy storage.",
      specifications: {
        material: "Plastic",
        lid: "Attached Lid",
        color: "Transparent",
        type: "Food Container",
        capacity: "25ml",
        shape: "Round",
        weight: "3 Grams",
        size: {
          height: "3cm",
          width: "4cm",
          base: "3cm"
        }
      },
      features: [
        "Ideal for Chutney, Sauces, Dips",
        "Reusable and Sturdy",
        "Made of BPA free plastic",
        "Freezer Safe",
        "Microwave Safe",
        "Air-tight lid ensures zero spillage",
        "Stackable as the containers fit inside each other"
      ],
      isActive: true
    };

    // Check if product already exists
    const existingProduct = await Product.findOne({ slug: detailedProduct.slug });
    
    if (existingProduct) {
      console.log('⚠️  Product already exists. Updating...');
      const updated = await Product.findByIdAndUpdate(existingProduct._id, detailedProduct, { new: true });
      console.log(`✅ Product updated: ${updated.name}`);
      console.log(`   Price: ₹${updated.price} (Original: ₹${updated.originalPrice})`);
      console.log(`   Bulk Offers: ${updated.bulkOffers.length} offers available`);
    } else {
      const product = new Product(detailedProduct);
      await product.save();
      console.log(`✅ Product created: ${product.name}`);
      console.log(`   Price: ₹${product.price} (Original: ₹${product.originalPrice})`);
      console.log(`   Category: ${containersCategory.name}`);
      console.log(`   Quantity: ${product.quantity}`);
      console.log(`   Bulk Offers: ${product.bulkOffers.length} offers available`);
      console.log(`   Features: ${product.features.length} features`);
      console.log(`   Specifications: Complete`);
    }

    console.log('\n✅ Detailed product added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding detailed product:', error);
    process.exit(1);
  }
};

addDetailedProduct();









