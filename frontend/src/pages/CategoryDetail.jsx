import { useParams, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { productAPI } from '../utils/api';

const categoryCards = [
  {
    title: "Containers",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765968834/fb302d74-dfe2-437a-811b-293e1f117d70.png",
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
    title: "Plates & Bowls",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969490/35ea9123-90d9-408e-98c3-09dbbd553dfa.png",
    subcategories: [
      "Meal Tray",
      "Plates",
      "Bowls"
    ]
  },
  {
    title: "Bags (Paper)",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969647/bb944066-f0bb-4b1d-91ae-2449d78fafce.png",
    subcategories: [
      "Handle Paper Bags",
      "Paper Square Bags",
      "Plastic LD Bags",
      "Silver Pouch",
      "Zip Lock Bags"
    ]
  },
  {
    title: "Spoon & Straw",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765969936/9cb72c90-349a-4925-9043-d198c085f055.png",
    subcategories: [
      "Spoon/Fork",
      "Straw",
      "Wooden Sticks"
    ]
  },
  {
    title: "Wrappers & Papers",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765970120/f53f7fcf-99a2-497a-9467-080ee54ae876.png",
    subcategories: [
      "Food Wrapping"
    ]
  },
  {
    title: "Glasses & Bottles",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972166/770db29a-4788-425a-b128-7c8b0a127401.png",
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
    title: "House Keeping",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972358/4369232f-0a83-430e-ac92-4465abb9d1c7.png",
    subcategories: [
      "Garbage Bag",
      "Chemicals",
      "Cleaning Products"
    ]
  },
  {
    title: "Takeaway Boxes",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972626/79aebae9-492c-4bf6-b270-ee8c15a2ad9d.png",
    subcategories: [
      "Pizza Box",
      "Snacks Box",
      "Burger/Sandwich Box",
      "Dosa/Roll Box",
      "Kraft Lunch box"
    ]
  },
  {
    title: "Gloves & Caps",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972744/e17c9bba-8cc6-4f2d-8b3d-b1e988b21855.png",
    subcategories: [
      "Hand Gloves",
      "Caps"
    ]
  },
  {
    title: "Tissue Papers & Rolls",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765972776/95ccdc6f-d560-4256-8a4e-70d101a990fd.png",
    subcategories: [
      "Paper Napkins",
      "HRT/Kitchen Rolls"
    ]
  },
  {
    title: "Veg/Non-Veg Taps",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973873/d1d0ad8e-9b12-4528-94cd-a3f6aa4d6291.png",
    subcategories: [
      "Veg/Nonveg Tap"
    ]
  },
  {
    title: "Bakery",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973212/3b4ce4e3-8f26-4774-a5fd-d1f799997cc8.png",
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
    title: "Handi & Kulhads",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973695/5d210c26-e213-4328-9509-bd36ccddfc01.png",
    subcategories: [
      "Biryani Handi",
      "Tea/Lassi Kulhad"
    ]
  },
  {
    title: "Sachet",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765973749/71f88642-1956-4bd6-97be-df4ccea0217d.png",
    subcategories: []
  },
  {
    title: "Customize Printing Products",
    image:
      "https://res.cloudinary.com/debhhnzgh/image/upload/v1765974091/d7a83287-839b-4dc1-887f-8f37121c22d8.png",
    subcategories: []
  },
];

// Helper function to convert title to URL slug
const titleToSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const CategoryDetail = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const location = useLocation();
  const [category, setCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAllProductsPage = location.pathname === '/all-products';

  useEffect(() => {
    // Find the category by matching the slug
    const foundCategory = categoryCards.find(
      (cat) => titleToSlug(cat.title) === categorySlug
    );
    
    if (foundCategory) {
      setCategory(foundCategory);
      
      // If subcategory slug exists, find and set it
      if (subcategorySlug && foundCategory.subcategories && foundCategory.subcategories.length > 0) {
        const foundSubcategory = foundCategory.subcategories.find(
          (sub) => titleToSlug(sub) === subcategorySlug
        );
        if (foundSubcategory) {
          setSelectedSubcategory(foundSubcategory);
        }
      } else {
        setSelectedSubcategory(null);
      }
    }
  }, [categorySlug, subcategorySlug]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categorySlug) return;
      
      try {
        setLoading(true);
        const params = {};
        if (selectedSubcategory) {
          params.subcategory = selectedSubcategory;
        }
        
        const response = await productAPI.getProductsByCategory(categorySlug, params);
        if (response.success) {
          setProducts(response.data.products || []);
        } else {
          setError('Failed to fetch products');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug, selectedSubcategory]);

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h2>
          <Link
            to="/"
            className="text-red-600 hover:text-red-700 font-semibold"
          >
            Go back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-3 sm:py-4">
          <nav className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700 truncate">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/" className="text-gray-500 hover:text-gray-700 truncate">
              Categories
            </Link>
            <span className="text-gray-400">/</span>
            <Link 
              to={`/category/${categorySlug}`} 
              className="text-gray-500 hover:text-gray-700 truncate max-w-[120px] sm:max-w-none"
            >
              {category.title}
            </Link>
            {selectedSubcategory && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-semibold truncate max-w-[120px] sm:max-w-none">
                  {selectedSubcategory}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar - All Categories */}
          <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 order-2 lg:order-1">
            <div className="bg-gradient-to-br from-red-50 to-white lg:from-white rounded-lg sm:rounded-xl shadow-lg lg:shadow-sm border-2 lg:border border-red-200 lg:border-gray-200 overflow-hidden lg:sticky lg:top-[120px] lg:max-h-[calc(100vh-120px)] lg:flex lg:flex-col">
              {/* Sticky Header */}
              <div className="sticky top-0 z-30 bg-gradient-to-r from-red-600 to-red-500 lg:from-white lg:to-white border-b-2 lg:border-b border-red-300 lg:border-gray-200 px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-white lg:text-gray-900 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 lg:hidden"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  <span>All Categories</span>
                </h3>
              </div>
              
              {/* Scrollable Categories List */}
              <div className="p-3 sm:p-4 overflow-y-auto flex-1 max-h-[400px] lg:max-h-none">
                <nav className="space-y-1.5 sm:space-y-2">
                  {/* All Products Link */}
                  <Link
                    to="/all-products"
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors mb-2 ${
                      isAllProductsPage
                        ? 'bg-red-50 text-red-600 font-semibold border border-red-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-md overflow-hidden bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm font-medium flex-1">
                      All Products
                    </span>
                  </Link>
                  
                  {categoryCards.map((cat) => {
                    const isActive = titleToSlug(cat.title) === categorySlug;
                    return (
                      <Link
                        key={cat.title}
                        to={`/category/${titleToSlug(cat.title)}`}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-red-50 text-red-600 font-semibold border border-red-200'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                          <img
                            src={cat.image}
                            alt={cat.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs sm:text-sm font-medium flex-1 line-clamp-2">
                          {cat.title}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 order-1 lg:order-2">
            {/* Subcategories and Products Section */}
            <section>
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="mb-4 sm:mb-6 md:mb-8">
                  {/* Subcategories Grid */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/category/${categorySlug}`}
                      className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md border transition-all text-center cursor-pointer shadow-sm text-xs sm:text-xs md:text-sm ${
                        !selectedSubcategory
                          ? 'bg-red-600 text-white border-red-600 font-semibold'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-red-600 hover:bg-red-50 font-semibold'
                      }`}
                    >
                      All
                    </Link>
                    {category.subcategories.map((subcategory) => {
                      const isActive = selectedSubcategory === subcategory;
                      return (
                        <Link
                          key={subcategory}
                          to={`/category/${categorySlug}/${titleToSlug(subcategory)}`}
                          className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md border transition-all text-center cursor-pointer shadow-sm text-xs sm:text-xs md:text-sm ${
                            isActive
                              ? 'bg-red-600 text-white border-red-600 font-semibold'
                              : 'bg-white text-gray-900 border-gray-300 hover:border-red-600 hover:bg-red-50 font-semibold'
                          }`}
                        >
                          {subcategory}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Products Section */}
              <div className="mb-4 sm:mb-6 md:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {selectedSubcategory
                    ? `Products in ${selectedSubcategory}` 
                    : `Products in ${category.title}`
                  }
                </h2>
              </div>
              
              {/* Products Section */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-600">No products found in this category</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-5 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                  {products.map((product) => (
                    <Link
                      key={product._id}
                      to={`/product/${product.slug}`}
                      className="bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
                    >
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="h-full w-full flex items-center justify-center text-gray-400" style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                          <svg
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="p-2.5 sm:p-3 md:p-4">
                        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1 sm:mb-1.5 md:mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex flex-col sm:flex-col md:flex-row items-start md:items-center justify-between gap-1.5 sm:gap-2 md:gap-0">
                          <div className="flex flex-col">
                            <span className="text-sm sm:text-base md:text-lg font-bold text-black">
                              ₹{product.price}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-xs text-gray-500 line-through">
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              // Add to cart logic here
                            }}
                            className="w-full md:w-auto px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-red-50 text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-xs sm:text-xs md:text-sm font-semibold whitespace-nowrap"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;

