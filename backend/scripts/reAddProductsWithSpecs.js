// Script to delete and re-add products to ensure specifications are saved correctly
// Run this: node backend/scripts/reAddProductsWithSpecs.js

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

const reAddProducts = async () => {
  try {
    await connectDB();
    console.log('Connected to database\n');

    // Read the complete product data file
    const dataPath = path.join(__dirname, '../data/completeProductData.json');
    const fileData = fs.readFileSync(dataPath, 'utf8');
    const productsData = JSON.parse(fileData);

    let successCount = 0;
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

        // Delete existing product if exists
        await Product.deleteOne({ slug: productToSave.slug });

        // Create new product
        const product = new Product(productToSave);
        await product.save();
        
        // Verify specifications were saved
        const savedProduct = await Product.findById(product._id);
        const specsKeys = savedProduct.specifications ? Object.keys(savedProduct.specifications) : [];
        
        console.log(`✓ Created: ${productData.name}`);
        console.log(`  - Specifications saved: ${specsKeys.length} fields`);
        if (specsKeys.length > 0) {
          console.log(`  - Specs keys: ${specsKeys.join(', ')}`);
        } else {
          console.log(`  ⚠️  WARNING: No specifications found!`);
        }
        console.log('');
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error adding ${productData.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Summary:');
    console.log(`   Created: ${successCount} products`);
    console.log(`   Errors: ${errorCount} products`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

reAddProducts();








