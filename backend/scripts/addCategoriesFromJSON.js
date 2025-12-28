// Script to add categories from JSON file to MongoDB
// Run this: node backend/scripts/addCategoriesFromJSON.js

import dotenv from 'dotenv';
import connectDB from '../config/databaseConnection.js';
import Category from '../models/Category.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addCategoriesFromJSON = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    // Read JSON file
    const jsonPath = path.join(__dirname, '../data/categoriesData.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const categoriesData = JSON.parse(jsonData);

    console.log(`\n📦 Found ${categoriesData.length} categories to add/update\n`);

    const results = [];
    for (const catData of categoriesData) {
      const category = await Category.findOneAndUpdate(
        { slug: catData.slug },
        catData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(category);
      console.log(`✓ ${category.name} - ${category.subcategories?.length || 0} subcategories`);
    }

    console.log(`\n✅ Successfully added/updated ${results.length} categories!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Total categories: ${results.length}`);
    console.log(`   - Total subcategories: ${results.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding categories:', error);
    process.exit(1);
  }
};

addCategoriesFromJSON();






