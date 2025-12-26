import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { productAPI } from '../utils/api';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getProductBySlug(slug);
        if (response.success) {
          console.log('Product data:', response.data);
          console.log('Specifications:', response.data.specifications);
          setProduct(response.data);
          setSelectedImage(0);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleAddToCart = () => {
    // Add to cart logic here
    console.log('Add to cart:', product, quantity);
  };

  const handleQuantityChange = (change) => {
    setQuantity((prev) => {
      const newQty = prev + change;
      return newQty < 1 ? 1 : newQty;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Find the best bulk offer (highest minQty that user qualifies for)
  const bulkOffer = product.bulkOffers
    ?.filter((offer) => quantity >= offer.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-3 sm:py-4">
          <nav className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            {product.category && (
              <>
                <Link
                  to={`/category/${product.category.slug}`}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {product.category.name}
                </Link>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-900 font-semibold">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-4">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-contain max-w-full max-h-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-24 h-24"
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
                )}
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 bg-gray-100 flex items-center justify-center p-1 ${
                        selectedImage === index
                          ? 'border-red-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                {product.category && (
                  <Link
                    to={`/category/${product.category.slug}`}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    {product.category.name}
                  </Link>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{product.originalPrice}
                      </span>
                      <span className="text-sm font-semibold text-red-600">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                {/* All Bulk Offers */}
                {product.bulkOffers && product.bulkOffers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900">Bulk Offers:</h4>
                    {product.bulkOffers
                      .sort((a, b) => b.minQty - a.minQty)
                      .map((offer, index) => {
                        const isActive = quantity >= offer.minQty;
                        return (
                          <div
                            key={index}
                            className={`border rounded-lg p-3 ${
                              isActive
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <p className={`text-sm ${isActive ? 'text-green-800' : 'text-gray-700'}`}>
                              <span className="font-semibold">
                                Buy {offer.minQty} Pieces or more
                              </span>
                              {' at '}
                              <span className="font-bold">₹{offer.pricePerPiece}/Piece</span>
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Description with Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                
                {/* Product Description */}
                {product.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}
                
                {/* Specifications inside Description */}
                {product.specifications && (
                  <div className="space-y-2 text-sm mb-4">
                    {/* Standard Fields */}
                    {product.specifications.material && (
                      <div className="flex">
                        <span className="text-gray-600 font-medium min-w-[140px]">Material:</span>
                        <span className="text-gray-900">{product.specifications.material}</span>
                      </div>
                    )}
                    
                    {product.specifications.lid && (
                      <div className="flex">
                        <span className="text-gray-600 font-medium min-w-[140px]">Lid:</span>
                        <span className="text-gray-900">{product.specifications.lid}</span>
                      </div>
                    )}
                    
                    {product.specifications.color && (
                      <div className="flex">
                        <span className="text-gray-600 font-medium min-w-[140px]">Color:</span>
                        <span className="text-gray-900">{product.specifications.color}</span>
                      </div>
                    )}
                    
                    {product.specifications.type && (
                      <div className="flex">
                        <span className="text-gray-600 font-medium min-w-[140px]">Type:</span>
                        <span className="text-gray-900">{product.specifications.type}</span>
                      </div>
                    )}
                    
                    {product.specifications.capacity && (
                      <div className="flex">
                        <span className="text-gray-600 font-medium min-w-[140px]">Capacity:</span>
                        <span className="text-gray-900">{product.specifications.capacity}</span>
                      </div>
                    )}
                    
                    {product.specifications.shape && (
                      <div className="flex">
                        <span className="text-gray-600 font-medium min-w-[140px]">Shape:</span>
                        <span className="text-gray-900">{product.specifications.shape}</span>
                      </div>
                    )}
                    
                    {product.specifications.weight && (
                      <div className="flex">
                        <span className="text-gray-600 font-medium min-w-[140px]">Product Weight:</span>
                        <span className="text-gray-900">{product.specifications.weight}</span>
                      </div>
                    )}

                    {/* Dynamic Custom Fields - Display all fields that are not 'size' and not empty */}
                    {Object.keys(product.specifications)
                      .filter(key => {
                        const value = product.specifications[key];
                        const standardFields = ['material', 'lid', 'color', 'type', 'capacity', 'shape', 'weight', 'size'];
                        return !standardFields.includes(key) && value && typeof value !== 'object' && value.trim() !== '';
                      })
                      .map(key => (
                        <div key={key} className="flex">
                          <span className="text-gray-600 font-medium min-w-[140px] capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-gray-900">{product.specifications[key]}</span>
                        </div>
                      ))}
                    
                    {/* Size Section */}
                    {product.specifications.size && (
                      <div className="mt-3">
                        <div className="text-gray-600 font-medium mb-2">Size (In cm):</div>
                        <div className="pl-4 space-y-1">
                          {product.specifications.size.height && (
                            <div className="flex">
                              <span className="text-gray-600 min-w-[80px]">Height:</span>
                              <span className="text-gray-900">{product.specifications.size.height}</span>
                            </div>
                          )}
                          {product.specifications.size.width && (
                            <div className="flex">
                              <span className="text-gray-600 min-w-[80px]">Width:</span>
                              <span className="text-gray-900">{product.specifications.size.width}</span>
                            </div>
                          )}
                          {product.specifications.size.base && (
                            <div className="flex">
                              <span className="text-gray-600 min-w-[80px]">Base:</span>
                              <span className="text-gray-900">{product.specifications.size.base}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">Sizes may vary</p>
                      </div>
                    )}
                  </div>
                )}
                

                {/* Other Features */}
                {product.features && product.features.length > 0 && (
                  <div className="mt-4">
                    <div className="text-gray-600 font-medium mb-2 text-sm">Other Features:</div>
                    <ul className="space-y-1.5 pl-4">
                      {product.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Qty:</span>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">Pieces</span>
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Price: </span>
                  <span className="font-bold text-lg">₹{bulkOffer ? (bulkOffer.pricePerPiece * quantity).toFixed(2) : (product.price * quantity).toFixed(2)}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>ADD +</span>
                  </button>
                  <button className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>Add To Wishlist</span>
                  </button>
                </div>

                {product.quantity !== undefined && (
                  <p className="text-sm text-gray-600">
                    {product.quantity > 0 ? (
                      <span className="text-green-600 font-medium">In Stock ({product.quantity} available)</span>
                    ) : (
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    )}
                  </p>
                )}
              </div>

              {/* Note Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Note:</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-semibold">Return or Replacement:</span> This item is eligible for free replacement/return within 3 days of delivery in an unlikely event of the delivered item being damaged/defective or different from what you had ordered. We may contact you to ascertain the damage or defect in the product prior to issuing refund/replacement. Product Size, Weight & Colour may vary.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

