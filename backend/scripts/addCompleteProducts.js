// Script to add all complete products with all fields filled
// Run this: node backend/scripts/addCompleteProducts.js

import dotenv from 'dotenv';
import connectDB from '../config/databaseConnection.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const addCompleteProducts = async () => {
  try {
    await connectDB();
    console.log('Connected to database\n');

    // Read the complete product data file
    const dataPath = path.join(__dirname, '../data/completeProductData.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const productsData = JSON.parse(fileData);

    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    for (const productData of productsData) {
      try {
        // Find category
        const category = await Category.findOne({ slug: productData.categorySlug });
        
        if (!category) {
          console.log(`⚠️  Category "${productData.categorySlug}" not found. Skipping: ${productData.name}`);
          errorCount++;
          continue;
        }

        // Prepare product data
        const { categorySlug, ...productFields } = productData;
        const productToSave = {
          ...productFields,
          category: category._id,
          isActive: true
        };

        // Validate that all required fields are present
        const requiredFields = ['name', 'slug', 'category', 'price', 'images'];
        const missingFields = requiredFields.filter(field => !productToSave[field]);
        
        if (missingFields.length > 0) {
          console.log(`⚠️  Missing required fields (${missingFields.join(', ')}) for: ${productData.name}`);
          errorCount++;
          continue;
        }

        // Check if product exists
        const existingProduct = await Product.findOne({ slug: productToSave.slug });
        
        if (existingProduct) {
          // Use set to properly update nested objects
          await Product.findByIdAndUpdate(
            existingProduct._id,
            { $set: productToSave },
            { new: true, runValidators: true }
          );
          console.log(`✓ Updated: ${productData.name}`);
          console.log(`  - Specifications: ${Object.keys(productData.specifications || {}).length} fields`);
          updateCount++;
        } else {
          const product = new Product(productToSave);
          await product.save();
          console.log(`✓ Created: ${productData.name}`);
          console.log(`  - Price: ₹${productData.price} (Original: ₹${productData.originalPrice || 'N/A'})`);
          console.log(`  - Category: ${category.name}`);
          console.log(`  - Quantity: ${productData.quantity}`);
          console.log(`  - Bulk Offers: ${productData.bulkOffers?.length || 0}`);
          console.log(`  - Specifications: ${Object.keys(productData.specifications || {}).length} fields`);
          console.log(`  - Features: ${productData.features?.length || 0} features`);
          console.log(`  - Images: ${productData.images?.length || 0} images\n`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error adding ${productData.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Summary:');
    console.log(`   Created: ${successCount} products`);
    console.log(`   Updated: ${updateCount} products`);
    console.log(`   Errors: ${errorCount} products`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addCompleteProducts();

