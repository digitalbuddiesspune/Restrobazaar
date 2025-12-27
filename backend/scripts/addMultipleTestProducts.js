// Script to add multiple test products for different categories
// Run this: node backend/scripts/addMultipleTestProducts.js

import dotenv from 'dotenv';
import connectDB from '../config/databaseConnection.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const testProducts = [
  {
    name: "Premium Round Container with Lid - 500ml",
    slug: "premium-round-container-500ml",
    categorySlug: "containers",
    price: 25,
    originalPrice: 30,
    bulkOffers: [
      { minQty: 50, pricePerPiece: 22 },
      { minQty: 100, pricePerPiece: 20 },
      { minQty: 500, pricePerPiece: 18 }
    ],
    quantity: 1000,
    images: [
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765968834/fb302d74-dfe2-437a-811b-293e1f117d70.png"
    ],
    description: "High-quality premium round container with secure lid. Perfect for food storage and takeaway.",
    specifications: {
      material: "Food Grade Plastic",
      lid: "Yes, Secure Snap-on Lid",
      color: "Clear/Transparent",
      type: "Round Containers",
      capacity: "500ml",
      shape: "Round",
      weight: "50g",
      size: { height: "8cm", width: "12cm", base: "12cm" }
    },
    features: [
      "Leak-proof design",
      "Microwave safe",
      "Dishwasher safe",
      "Stackable",
      "Food grade material"
    ]
  },
  {
    name: "Rectangle Container with Lid - 750ml",
    slug: "rectangle-container-750ml",
    categorySlug: "containers",
    price: 30,
    originalPrice: 35,
    bulkOffers: [
      { minQty: 50, pricePerPiece: 27 },
      { minQty: 100, pricePerPiece: 25 }
    ],
    quantity: 800,
    images: [
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765968834/fb302d74-dfe2-437a-811b-293e1f117d70.png"
    ],
    description: "Durable rectangle container perfect for meal packing. Leak-proof and microwave safe.",
    specifications: {
      material: "Food Grade Plastic",
      lid: "Yes",
      color: "Clear",
      type: "Rectangle Containers",
      capacity: "750ml",
      shape: "Rectangle",
      size: { height: "6cm", width: "15cm", base: "12cm" }
    },
    features: ["Leak-proof", "Microwave safe", "Stackable"]
  },
  {
    name: "Disposable Paper Plate - 9 inch",
    slug: "disposable-paper-plate-9inch",
    categorySlug: "plates-bowls",
    price: 2,
    originalPrice: 3,
    bulkOffers: [
      { minQty: 100, pricePerPiece: 1.8 },
      { minQty: 500, pricePerPiece: 1.5 }
    ],
    quantity: 5000,
    images: [
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969490/35ea9123-90d9-408e-98c3-09dbbd553dfa.png"
    ],
    description: "Eco-friendly disposable paper plate. Perfect for parties and events.",
    specifications: {
      material: "Paper",
      type: "Plates",
      capacity: "9 inch",
      shape: "Round"
    },
    features: ["Eco-friendly", "Disposable", "Biodegradable"]
  },
  {
    name: "Paper Bowl - 500ml",
    slug: "paper-bowl-500ml",
    categorySlug: "plates-bowls",
    price: 3,
    originalPrice: 4,
    bulkOffers: [
      { minQty: 100, pricePerPiece: 2.5 },
      { minQty: 500, pricePerPiece: 2 }
    ],
    quantity: 3000,
    images: [
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969490/35ea9123-90d9-408e-98c3-09dbbd553dfa.png"
    ],
    description: "Sturdy paper bowl for soups, curries, and other liquid foods.",
    specifications: {
      material: "Paper",
      type: "Bowls",
      capacity: "500ml",
      shape: "Round"
    },
    features: ["Eco-friendly", "Leak-resistant", "Disposable"]
  },
  {
    name: "Paper Bag with Handle - Medium",
    slug: "paper-bag-handle-medium",
    categorySlug: "bags-paper",
    price: 5,
    originalPrice: 6,
    bulkOffers: [
      { minQty: 100, pricePerPiece: 4.5 },
      { minQty: 500, pricePerPiece: 4 }
    ],
    quantity: 2000,
    images: [
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969647/bb944066-f0bb-4b1d-91ae-2449d78fafce.png"
    ],
    description: "Eco-friendly paper bag with sturdy handles. Perfect for shopping and takeaway.",
    specifications: {
      material: "Paper",
      type: "Handle Paper Bags",
      capacity: "Medium",
      size: { height: "30cm", width: "20cm", base: "10cm" }
    },
    features: ["Eco-friendly", "Sturdy handles", "Biodegradable"]
  },
  {
    name: "Disposable Spoon - Pack of 100",
    slug: "disposable-spoon-pack-100",
    categorySlug: "spoon-straw",
    price: 50,
    originalPrice: 60,
    bulkOffers: [
      { minQty: 10, pricePerPiece: 45 },
      { minQty: 50, pricePerPiece: 40 }
    ],
    quantity: 500,
    images: [
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969936/9cb72c90-349a-4925-9043-d198c085f055.png"
    ],
    description: "High-quality disposable spoons. Pack of 100 pieces.",
    specifications: {
      material: "Plastic",
      type: "Spoon/Fork",
      weight: "100 pieces"
    },
    features: ["Disposable", "Lightweight", "Hygienic"]
  },
  {
    name: "Paper Glass - 200ml",
    slug: "paper-glass-200ml",
    categorySlug: "glasses-bottles",
    price: 2,
    originalPrice: 3,
    bulkOffers: [
      { minQty: 100, pricePerPiece: 1.8 },
      { minQty: 500, pricePerPiece: 1.5 }
    ],
    quantity: 4000,
    images: [
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972166/770db29a-4788-425a-b128-7c8b0a127401.png"
    ],
    description: "Eco-friendly paper glass for hot and cold beverages.",
    specifications: {
      material: "Paper",
      type: "Paper Glass",
      capacity: "200ml"
    },
    features: ["Eco-friendly", "Leak-proof", "Disposable"]
  },
  {
    name: "Pizza Box - 12 inch",
    slug: "pizza-box-12inch",
    categorySlug: "takeaway-boxes",
    price: 15,
    originalPrice: 18,
    bulkOffers: [
      { minQty: 50, pricePerPiece: 13 },
      { minQty: 100, pricePerPiece: 12 }
    ],
    quantity: 600,
    images: [
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972626/79aebae9-492c-4bf6-b270-ee8c15a2ad9d.png"
    ],
    description: "Sturdy pizza box with ventilation holes. Perfect for 12 inch pizzas.",
    specifications: {
      material: "Cardboard",
      type: "Pizza Box",
      capacity: "12 inch",
      size: { height: "5cm", width: "30cm", base: "30cm" }
    },
    features: ["Ventilation holes", "Sturdy", "Eco-friendly"]
  }
];

const addMultipleTestProducts = async () => {
  try {
    await connectDB();
    console.log('Connected to database\n');

    let successCount = 0;
    let updateCount = 0;

    for (const productData of testProducts) {
      try {
        // Find category
        const category = await Category.findOne({ slug: productData.categorySlug });
        
        if (!category) {
          console.log(`⚠️  Category "${productData.categorySlug}" not found. Skipping: ${productData.name}`);
          continue;
        }

        // Prepare product data
        const { categorySlug, ...productFields } = productData;
        const productToSave = {
          ...productFields,
          category: category._id,
          isActive: true
        };

        // Check if product exists
        const existingProduct = await Product.findOne({ slug: productToSave.slug });
        
        if (existingProduct) {
          await Product.findByIdAndUpdate(existingProduct._id, productToSave, { new: true });
          console.log(`✓ Updated: ${productData.name}`);
          updateCount++;
        } else {
          const product = new Product(productToSave);
          await product.save();
          console.log(`✓ Created: ${productData.name} (₹${productData.price})`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error adding ${productData.name}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${successCount} products and updated ${updateCount} products!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addMultipleTestProducts();



