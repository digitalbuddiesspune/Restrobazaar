import Category from "../models/Category.js";

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get category by slug
const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug, isActive: true });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    // Generate slug if not provided
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Category slug or name already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Category slug or name already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Seed categories from frontend data
const seedCategories = async (req, res) => {
  try {
    const categoriesData = [
      {
        name: "Containers",
        slug: "containers",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765968834/fb302d74-dfe2-437a-811b-293e1f117d70.png",
        subcategories: [
          "Round Containers",
          "Rectangle Containers",
          "Aluminum Containers",
          "Paper Containers",
          "Premium Containers",
          "Hinged Containers",
          "Buckets with handle"
        ]
      },
      {
        name: "Plates & Bowls",
        slug: "plates-bowls",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969490/35ea9123-90d9-408e-98c3-09dbbd553dfa.png",
        subcategories: [
          "Meal Tray",
          "Plates",
          "Bowls"
        ]
      },
      {
        name: "Bags (Paper)",
        slug: "bags-paper",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969647/bb944066-f0bb-4b1d-91ae-2449d78fafce.png",
        subcategories: [
          "Handle Paper Bags",
          "Paper Square Bags",
          "Plastic LD Bags",
          "Silver Pouch",
          "Zip Lock Bags"
        ]
      },
      {
        name: "Spoon & Straw",
        slug: "spoon-straw",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969936/9cb72c90-349a-4925-9043-d198c085f055.png",
        subcategories: [
          "Spoon/Fork",
          "Straw",
          "Wooden Sticks"
        ]
      },
      {
        name: "Wrappers & Papers",
        slug: "wrappers-papers",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765970120/f53f7fcf-99a2-497a-9467-080ee54ae876.png",
        subcategories: [
          "Food Wrapping"
        ]
      },
      {
        name: "Glasses & Bottles",
        slug: "glasses-bottles",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972166/770db29a-4788-425a-b128-7c8b0a127401.png",
        subcategories: [
          "Paper Glass",
          "Ripple Glass",
          "Takeaway Glass",
          "Freyo Tower",
          "Glass Jars",
          "Pet Bottles",
          "Tray For Glass Takeaway"
        ]
      },
      {
        name: "House Keeping",
        slug: "house-keeping",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972358/4369232f-0a83-430e-ac92-4465abb9d1c7.png",
        subcategories: [
          "Garbage Bag",
          "Chemicals",
          "Cleaning Products"
        ]
      },
      {
        name: "Takeaway Boxes",
        slug: "takeaway-boxes",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972626/79aebae9-492c-4bf6-b270-ee8c15a2ad9d.png",
        subcategories: [
          "Pizza Box",
          "Snacks Box",
          "Burger/Sandwich Box",
          "Dosa/Roll Box",
          "Kraft Lunch box"
        ]
      },
      {
        name: "Gloves & Caps",
        slug: "gloves-caps",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972744/e17c9bba-8cc6-4f2d-8b3d-b1e988b21855.png",
        subcategories: [
          "Hand Gloves",
          "Caps"
        ]
      },
      {
        name: "Tissue Papers & Rolls",
        slug: "tissue-papers-rolls",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972776/95ccdc6f-d560-4256-8a4e-70d101a990fd.png",
        subcategories: [
          "Paper Napkins",
          "HRT/Kitchen Rolls"
        ]
      },
      {
        name: "Veg/Non-Veg Taps",
        slug: "veg-non-veg-taps",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973873/d1d0ad8e-9b12-4528-94cd-a3f6aa4d6291.png",
        subcategories: [
          "Veg/Nonveg Tap"
        ]
      },
      {
        name: "Bakery",
        slug: "bakery",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973212/3b4ce4e3-8f26-4774-a5fd-d1f799997cc8.png",
        subcategories: [
          "Box & Tray",
          "Cake Base",
          "Dessert Cups",
          "Glass Jars",
          "Cups & Liners",
          "Bake & Serve"
        ]
      },
      {
        name: "Handi & Kulhads",
        slug: "handi-kulhads",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973695/5d210c26-e213-4328-9509-bd36ccddfc01.png",
        subcategories: [
          "Biryani Handi",
          "Tea/Lassi Kulhad"
        ]
      },
      {
        name: "Sachet",
        slug: "sachet",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973749/71f88642-1956-4bd6-97be-df4ccea0217d.png",
        subcategories: []
      },
      {
        name: "Customize Printing Products",
        slug: "customize-printing-products",
        image: "https://res.cloudinary.com/debhhnzgh/image/upload/v1765974091/d7a83287-839b-4dc1-887f-8f37121c22d8.png",
        subcategories: []
      }
    ];

    // Use upsert to avoid duplicates
    const results = [];
    for (const catData of categoriesData) {
      const category = await Category.findOneAndUpdate(
        { slug: catData.slug },
        catData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(category);
    }

    res.status(200).json({
      success: true,
      message: `Successfully seeded ${results.length} categories`,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  seedCategories,
};

