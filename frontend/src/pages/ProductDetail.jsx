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
          // Set initial quantity based on minimumOrderableQuantity
          const minQty = response.data.minimumOrderableQuantity || 1;
          setQuantity(minQty);
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
    if (!product) return;
    
    const incrementor = product.incrementor || 1;
    const minQty = product.minimumOrderableQuantity || 1;
    
    setQuantity((prev) => {
      // Calculate change based on incrementor
      const changeAmount = change * incrementor;
      let newQty = prev + changeAmount;
      
      // Ensure quantity is at least minimumOrderableQuantity
      if (newQty < minQty) {
        newQty = minQty;
      }
      
      // Ensure quantity is a multiple of incrementor (if incrementor > 1)
      if (incrementor > 1) {
        // Round to nearest multiple of incrementor
        newQty = Math.max(minQty, Math.round(newQty / incrementor) * incrementor);
      }
      
      return newQty;
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on RestroBazaar!`,
      url: url,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      // User cancelled or error occurred, try fallback
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          alert('Link copied to clipboard!');
        } catch (clipboardErr) {
          console.error('Failed to copy link:', clipboardErr);
        }
      }
    }
  };

  // Calculate minimum quantity and check if at minimum
  const minQuantity = product?.minimumOrderableQuantity || 1;
  const isMinQuantity = quantity <= minQuantity;
  const incrementor = product?.incrementor || 1;

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

  // Calculate total price with tax
  const calculateTotalPrice = () => {
    if (!product) return { basePrice: 0, tax: 0, total: 0, taxDetails: { type: '', rate: 0, breakdown: '', cgstAmount: 0, sgstAmount: 0, igstAmount: 0 } };
    
    // Calculate base price (with bulk offer if available)
    let basePrice = 0;
    if (bulkOffer && quantity >= bulkOffer.minQty) {
      basePrice = bulkOffer.pricePerPiece * quantity;
    } else {
      basePrice = product.price * quantity;
    }
    
    // Calculate tax according to Indian GST system
    let tax = 0;
    let taxDetails = {
      type: '',
      rate: 0,
      breakdown: '',
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0
    };
    
    // Priority 1: If IGST is set (for inter-state sales)
    if (product.igst && parseFloat(product.igst) > 0) {
      const igstRate = parseFloat(product.igst);
      tax = (basePrice * igstRate) / 100;
      taxDetails = {
        type: 'IGST',
        rate: igstRate,
        breakdown: `IGST ${igstRate}%`,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: tax
      };
    }
    // Priority 2: If CGST and SGST are set (for intra-state sales)
    else if (product.cgst && product.sgst && (parseFloat(product.cgst) > 0 || parseFloat(product.sgst) > 0)) {
      const cgstRate = parseFloat(product.cgst) || 0;
      const sgstRate = parseFloat(product.sgst) || 0;
      const cgstAmount = (basePrice * cgstRate) / 100;
      const sgstAmount = (basePrice * sgstRate) / 100;
      tax = cgstAmount + sgstAmount;
      const totalGstRate = cgstRate + sgstRate;
      taxDetails = {
        type: 'CGST+SGST',
        rate: totalGstRate,
        breakdown: `CGST ${cgstRate}% + SGST ${sgstRate}%`,
        cgstAmount: cgstAmount,
        sgstAmount: sgstAmount,
        igstAmount: 0
      };
    }
    // Priority 3: If only CGST is set
    else if (product.cgst && parseFloat(product.cgst) > 0) {
      const cgstRate = parseFloat(product.cgst);
      tax = (basePrice * cgstRate) / 100;
      taxDetails = {
        type: 'CGST',
        rate: cgstRate,
        breakdown: `CGST ${cgstRate}%`,
        cgstAmount: tax,
        sgstAmount: 0,
        igstAmount: 0
      };
    }
    // Priority 4: If only SGST is set
    else if (product.sgst && parseFloat(product.sgst) > 0) {
      const sgstRate = parseFloat(product.sgst);
      tax = (basePrice * sgstRate) / 100;
      taxDetails = {
        type: 'SGST',
        rate: sgstRate,
        breakdown: `SGST ${sgstRate}%`,
        cgstAmount: 0,
        sgstAmount: tax,
        igstAmount: 0
      };
    }
    // Priority 5: If gstOrTaxPercent is set (general GST)
    else if (product.gstOrTaxPercent && parseFloat(product.gstOrTaxPercent) > 0) {
      const gstRate = parseFloat(product.gstOrTaxPercent);
      tax = (basePrice * gstRate) / 100;
      taxDetails = {
        type: 'GST',
        rate: gstRate,
        breakdown: `GST ${gstRate}%`,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0
      };
    }
    
    const total = basePrice + tax;
    
    return { basePrice, tax, total, taxDetails };
  };

  const priceDetails = calculateTotalPrice();
  const totalPrice = priceDetails.total;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-3 sm:py-4">
          <nav className="flex items-center flex-wrap gap-2 text-xs sm:text-sm">
            <Link to="/" className="text-gray-500 hover:text-red-600 transition-colors font-medium">
              Home
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {product.category && (
              <>
                <Link
                  to={`/category/${product.category.slug}`}
                  className="text-gray-500 hover:text-red-600 transition-colors font-medium"
                >
                  {product.category.name}
                </Link>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
            <span className="text-gray-900 font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 lg:gap-3 p-4 sm:p-6 lg:p-6">
            {/* Product Images - Sticky on desktop */}
            <div className="space-y-3 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-2 lg:pb-4 max-w-full lg:max-w-sm mx-auto lg:mx-0">
              {/* Main Image */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden relative shadow-inner border border-gray-200 transition-all hover:shadow-md flex-shrink-0 group">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400">
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
                
                {/* Wishlist and Share Icons */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-row gap-1.5 sm:gap-2 z-10">
                  {/* Wishlist Button */}
                  <button
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors border border-gray-200"
                    aria-label="Add to Wishlist"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 hover:text-red-600"
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
                  </button>
                  
                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                    aria-label="Share Product"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 hover:text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 flex-shrink-0 max-w-full lg:max-w-md mx-auto lg:mx-0">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-md overflow-hidden border-2 bg-gray-50 flex items-center justify-center p-1 transition-all duration-200 ${
                        selectedImage === index
                          ? 'border-red-600 ring-1 ring-red-200 shadow-sm'
                          : 'border-gray-200 hover:border-red-300'
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
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {product.name}
                </h1>
                {product.category && (
                  <Link
                    to={`/category/${product.category.slug}`}
                    className="inline-flex items-center text-red-600 hover:text-red-700 text-xs font-medium transition-colors"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {product.category.name}
                  </Link>
                )}
              </div>

              {/* Price */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        ₹{product.originalPrice}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                {/* All Bulk Offers */}
                {product.bulkOffers && product.bulkOffers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Bulk Offers
                    </h4>
                    <div className="space-y-2">
                      {product.bulkOffers
                        .sort((a, b) => b.minQty - a.minQty)
                        .map((offer, index) => {
                          const isActive = quantity >= offer.minQty;
                          return (
                            <div
                              key={index}
                              className={`border rounded-lg p-2.5 transition-all ${
                                isActive
                                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <p className={`text-xs ${isActive ? 'text-green-900' : 'text-gray-700'}`}>
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
                  </div>
                )}
              </div>

              {/* Description with Specifications */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Description
                  </h3>
                  
                  {/* Product Description */}
                  {product.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Specifications */}
                {product.specifications && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Specifications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {/* Standard Fields */}
                      {product.specifications.material && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-xs">Material:</span>
                          <span className="text-gray-600 font-medium text-sm">{product.specifications.material}</span>
                        </div>
                      )}
                      
                      {product.specifications.lid && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-xs">Lid:</span>
                          <span className="text-gray-600 font-medium text-sm">{product.specifications.lid}</span>
                        </div>
                      )}
                      
                      {product.specifications.color && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-xs">Color:</span>
                          <span className="text-gray-600 font-medium text-sm">{product.specifications.color}</span>
                        </div>
                      )}
                      
                      {product.specifications.type && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-xs">Type:</span>
                          <span className="text-gray-600 font-medium text-sm">{product.specifications.type}</span>
                        </div>
                      )}
                      
                      {product.specifications.capacity && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-xs">Capacity:</span>
                          <span className="text-gray-600 font-medium text-sm">{product.specifications.capacity}</span>
                        </div>
                      )}
                      
                      {product.specifications.shape && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-xs">Shape:</span>
                          <span className="text-gray-600 font-medium text-sm">{product.specifications.shape}</span>
                        </div>
                      )}
                      
                      {product.specifications.weight && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-xs">Product Weight:</span>
                          <span className="text-gray-600 font-medium text-sm">{product.specifications.weight}</span>
                        </div>
                      )}

                      {/* Dynamic Custom Fields */}
                      {Object.keys(product.specifications)
                        .filter(key => {
                          const value = product.specifications[key];
                          const standardFields = ['material', 'lid', 'color', 'type', 'capacity', 'shape', 'weight', 'size'];
                          return !standardFields.includes(key) && value && typeof value !== 'object' && value.trim() !== '';
                        })
                        .map(key => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-gray-900 font-semibold text-xs capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-gray-600 font-medium text-sm">{product.specifications[key]}</span>
                          </div>
                        ))}
                      
                      {/* Size Section */}
                      {product.specifications.size && (
                        <>
                          {product.specifications.size.height && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-semibold text-xs">Height:</span>
                              <span className="text-gray-600 font-medium text-sm">{product.specifications.size.height} cm</span>
                            </div>
                          )}
                          {product.specifications.size.width && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-semibold text-xs">Width:</span>
                              <span className="text-gray-600 font-medium text-sm">{product.specifications.size.width} cm</span>
                            </div>
                          )}
                          {product.specifications.size.base && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-semibold text-xs">Base:</span>
                              <span className="text-gray-600 font-medium text-sm">{product.specifications.size.base} cm</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Other Features */}
                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Key Features
                    </h3>
                    <div>
                      <ul className="space-y-2">
                        {product.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                {/* Stock Status */}
                {(product.availableStock !== undefined || product.stockStatus !== undefined || product.quantity !== undefined) && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      // Determine stock status: check stockStatus first, then availableStock, then quantity
                      let isInStock = false;
                      let stockCount = 0;
                      
                      if (product.stockStatus === 'outofstock') {
                        isInStock = false;
                      } else if (product.stockStatus === 'instock') {
                        isInStock = true;
                        stockCount = product.availableStock !== undefined ? product.availableStock : (product.quantity || 0);
                      } else {
                        // If stockStatus is not set, check availableStock or quantity
                        stockCount = product.availableStock !== undefined ? product.availableStock : (product.quantity || 0);
                        isInStock = stockCount > 0;
                      }
                      
                      return isInStock ? (
                        <>
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-600 font-semibold text-sm">
                            In Stock{stockCount > 0 ? ` (${stockCount} available)` : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-red-600 font-semibold text-sm">Out of Stock</span>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                  <div className="flex items-center gap-0 border-2 border-gray-300 rounded-lg overflow-hidden">
                    {!isMinQuantity && (
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        className="px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-bold transition-colors active:bg-gray-200"
                        aria-label="Decrease quantity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                        </svg>
                      </button>
                    )}
                    <span className={`px-4 py-2 text-gray-900 font-bold text-base min-w-[3rem] text-center bg-white ${!isMinQuantity ? 'border-x' : 'border-l'} border-gray-300`}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-bold transition-colors active:bg-gray-200"
                      aria-label="Increase quantity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Pieces</span>
                </div>

                {/* Incrementor Info */}
                {incrementor > 1 && (
                  <p className="text-xs text-gray-500 italic">
                    * This product can only be ordered in multiples of {incrementor}
                  </p>
                )}

                {/* Total Price */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3 border border-red-100">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Subtotal (Excluding Tax):</span>
                      <span className="text-base font-semibold text-gray-900">₹{priceDetails.basePrice.toFixed(2)}</span>
                    </div>
                    {priceDetails.tax > 0 && (
                      <div className="space-y-1 pt-1 border-t border-red-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700">
                            Tax ({priceDetails.taxDetails.breakdown}):
                          </span>
                          <span className="text-sm font-semibold text-gray-700">₹{priceDetails.tax.toFixed(2)}</span>
                        </div>
                        {priceDetails.taxDetails.type === 'CGST+SGST' && (
                          <div className="pl-4 space-y-0.5 text-xs text-gray-600">
                            <div className="flex items-center justify-between">
                              <span>CGST ({parseFloat(product.cgst || 0)}%):</span>
                              <span>₹{priceDetails.taxDetails.cgstAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>SGST ({parseFloat(product.sgst || 0)}%):</span>
                              <span>₹{priceDetails.taxDetails.sgstAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        {priceDetails.taxDetails.type === 'IGST' && (
                          <div className="pl-4 text-xs text-gray-600">
                            <div className="flex items-center justify-between">
                              <span>IGST ({priceDetails.taxDetails.rate}%):</span>
                              <span>₹{priceDetails.taxDetails.igstAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t-2 border-red-300">
                      <span className="text-base font-bold text-gray-900">Total Price (Including Tax):</span>
                      <span className="text-2xl font-bold text-red-600">₹{totalPrice.toFixed(2)}</span>
                    </div>
                    {bulkOffer && quantity >= bulkOffer.minQty && (
                      <p className="text-xs text-green-700 mt-1 font-medium">
                        ✓ Bulk offer applied: ₹{bulkOffer.pricePerPiece}/piece
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-bold text-xs sm:text-sm md:text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 sm:gap-2"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Add to Cart</span>
                  </button>
                  <button className="flex-1 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white font-bold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>

              {/* Note Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Important Note
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-bold">Return or Replacement:</span> This item is eligible for free replacement/return within 3 days of delivery in an unlikely event of the delivered item being damaged/defective or different from what you had ordered. We may contact you to ascertain the damage or defect in the product prior to issuing refund/replacement. Product Size, Weight & Colour may vary.
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

