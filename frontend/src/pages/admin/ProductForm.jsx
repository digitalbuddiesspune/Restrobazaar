import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../../utils/api';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    searchTags: [''],
    category: '',
    subcategory: '',
    otherCategory: '',
    city: '',
    price: '',
    originalPrice: '',
    purchaseAmount: '',
    purchaseMode: 'Cash & Online & Bank Transfer',
    shortDescription: '',
    description: '',
    units: 'Kg',
    quantity: 0,
    availableStock: 10,
    maintainQtyForNotification: '',
    stockStatus: 'instock',
    minimumOrderableQuantity: 1,
    incrementor: '',
    hsnCode: '',
    gstOrTaxPercent: '',
    taxType: '', // 'intrastate' or 'interstate' - auto-determined
    igst: '',
    cgst: '',
    sgst: '',
    isReturnable: false,
    sequenceListing: 0,
    isActive: true,
    images: [''],
    galleryImages: [''],
    productPurchaseFrom: '',
    specifications: {
      material: '',
      lid: '',
      color: '',
      type: '',
      capacity: '',
      shape: '',
      weight: '',
      size: {
        height: '',
        width: '',
        base: ''
      }
    },
    features: [''],
    bulkOffers: [{ minQty: '', pricePerPiece: '' }],
    customSpecFields: [{ key: '', value: '' }] // Custom specification fields
  });

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  // Update selected category when formData.category changes
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const category = categories.find(cat => cat._id === formData.category);
      if (category) {
        console.log('Selected category:', category);
        console.log('Subcategories:', category.subcategories);
        setSelectedCategory(category);
      } else {
        setSelectedCategory(null);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [formData.category, categories]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('Fetching categories from:', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/categories`);
      const response = await categoryAPI.getAllCategories();
      console.log('Categories API response:', response);
      if (response.success) {
        const cats = response.data || [];
        console.log('Fetched categories:', cats);
        console.log('Number of categories:', cats.length);
        if (cats.length > 0) {
          console.log('First category:', cats[0]);
          console.log('First category subcategories:', cats[0]?.subcategories);
        } else {
          console.warn('No categories found in database. Please seed categories.');
        }
        setCategories(cats);
      } else {
        console.error('API returned success: false', response);
        alert('Failed to load categories: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      alert('Error loading categories: ' + (error.response?.data?.message || error.message));
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProductById(id);
      if (response.success) {
        const product = response.data;
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          searchTags: product.searchTags && product.searchTags.length > 0 ? product.searchTags : [''],
          category: product.category?._id || product.category || '',
          subcategory: product.subcategory || '',
          otherCategory: product.otherCategory || '',
          city: product.city || '',
          price: product.price || '',
          originalPrice: product.originalPrice || '',
          purchaseAmount: product.purchaseAmount || '',
          purchaseMode: product.purchaseMode || 'Cash & Online & Bank Transfer',
          shortDescription: product.shortDescription || '',
          description: product.description || '',
          units: product.units || 'Kg',
          quantity: product.quantity || 0,
          availableStock: product.availableStock || 10,
          maintainQtyForNotification: product.maintainQtyForNotification || '',
          stockStatus: product.stockStatus || 'instock',
          minimumOrderableQuantity: product.minimumOrderableQuantity || 1,
          incrementor: product.incrementor || '',
          hsnCode: product.hsnCode || '',
          gstOrTaxPercent: product.gstOrTaxPercent || '',
          igst: product.igst || '',
          cgst: product.cgst || '',
          sgst: product.sgst || '',
          isReturnable: product.isReturnable !== undefined ? product.isReturnable : false,
          sequenceListing: product.sequenceListing || 0,
          isActive: product.isActive !== undefined ? product.isActive : true,
          images: product.images && product.images.length > 0 ? product.images : [''],
          galleryImages: product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages : [''],
          productPurchaseFrom: product.productPurchaseFrom || '',
          specifications: {
            material: product.specifications?.material || '',
            lid: product.specifications?.lid || '',
            color: product.specifications?.color || '',
            type: product.specifications?.type || '',
            capacity: product.specifications?.capacity || '',
            shape: product.specifications?.shape || '',
            weight: product.specifications?.weight || product.weight || '',
            size: {
              height: product.specifications?.size?.height || '',
              width: product.specifications?.size?.width || '',
              base: product.specifications?.size?.base || ''
            }
          },
          customSpecFields: (() => {
            // Extract custom fields (fields that are not in the standard list)
            const standardFields = ['material', 'lid', 'color', 'type', 'capacity', 'shape', 'weight', 'size'];
            const customFields = [];
            if (product.specifications) {
              Object.keys(product.specifications).forEach(key => {
                if (!standardFields.includes(key) && product.specifications[key] && typeof product.specifications[key] !== 'object') {
                  customFields.push({ key, value: product.specifications[key] });
                }
              });
            }
            return customFields.length > 0 ? customFields : [{ key: '', value: '' }];
          })(),
          features: product.features && product.features.length > 0 ? product.features : [''],
          bulkOffers: product.bulkOffers && product.bulkOffers.length > 0 
            ? product.bulkOffers.map(bo => ({ minQty: bo.minQty || '', pricePerPiece: bo.pricePerPiece || '' }))
            : [{ minQty: '', pricePerPiece: '' }]
        });
      }
    } catch (error) {
      alert('Failed to fetch product: ' + error.message);
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle category change - update selected category and reset subcategory
    if (name === 'category') {
      const category = categories.find(cat => cat._id === value);
      console.log('Category changed:', category);
      if (category) {
        console.log('Category subcategories:', category.subcategories);
        setSelectedCategory(category);
      } else {
        setSelectedCategory(null);
      }
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subcategory: '' // Reset subcategory when category changes
      }));
      return;
    }
    
    // Auto-update stockStatus when availableStock changes
    if (name === 'availableStock') {
      const stockValue = parseInt(value) || 0;
      let newStockStatus = formData.stockStatus;
      
      if (stockValue <= 0) {
        newStockStatus = 'outofstock';
      } else if (stockValue > 0 && stockValue <= 5) {
        newStockStatus = 'lowstock';
      } else {
        newStockStatus = 'instock';
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        stockStatus: newStockStatus
      }));
      return;
    }
    
    // Auto-calculate CGST and SGST when GST rate changes (for intra-state)
    if (name === 'gstOrTaxPercent') {
      const gstRate = parseFloat(value) || 0;
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        // Auto-calculate CGST and SGST when GST rate is entered
        // For intra-state: CGST = SGST = GST/2
        if (gstRate > 0) {
          const halfRate = parseFloat((gstRate / 2).toFixed(2));
          // Always auto-calculate CGST and SGST
          // User can manually override if needed
          newData.cgst = halfRate.toString();
          newData.sgst = halfRate.toString();
        } else {
          // Clear CGST and SGST if GST rate is cleared
          newData.cgst = '';
          newData.sgst = '';
        }
        return newData;
      });
      return;
    }
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: value
          } : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], 
        field === 'bulkOffers' ? { minQty: '', pricePerPiece: '' } :
        field === 'customSpecFields' ? { key: '', value: '' } :
        '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate category
      if (!formData.category || formData.category.trim() === '') {
        alert('Please select a category');
        setLoading(false);
        return;
      }

      // Prepare data
      const submitData = {
        ...formData,
        category: formData.category.trim(), // Ensure category is not empty
        searchTags: formData.searchTags.filter(tag => tag.trim() !== ''),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        purchaseAmount: formData.purchaseAmount ? parseFloat(formData.purchaseAmount) : undefined,
        quantity: parseInt(formData.quantity) || 0,
        availableStock: parseInt(formData.availableStock) || 0,
        stockStatus: formData.stockStatus || 'instock',
        minimumOrderableQuantity: parseInt(formData.minimumOrderableQuantity) || 1,
        incrementor: formData.incrementor ? parseFloat(formData.incrementor) : undefined,
        gstOrTaxPercent: formData.gstOrTaxPercent ? parseFloat(formData.gstOrTaxPercent) : undefined,
        igst: formData.igst ? parseFloat(formData.igst) : undefined,
        cgst: formData.cgst ? parseFloat(formData.cgst) : undefined,
        sgst: formData.sgst ? parseFloat(formData.sgst) : undefined,
        sequenceListing: parseInt(formData.sequenceListing) || 0,
        images: formData.images.filter(img => img.trim() !== ''),
        galleryImages: formData.galleryImages.filter(img => img.trim() !== ''),
        features: formData.features.filter(f => f.trim() !== ''),
        bulkOffers: formData.bulkOffers
          .filter(bo => bo.minQty && bo.pricePerPiece)
          .map(bo => ({
            minQty: parseInt(bo.minQty),
            pricePerPiece: parseFloat(bo.pricePerPiece)
          })),
        subcategory: formData.subcategory && formData.subcategory.trim() !== '' ? formData.subcategory.trim() : undefined,
        otherCategory: formData.otherCategory && formData.otherCategory.trim() !== '' ? formData.otherCategory.trim() : undefined,
        city: formData.city && formData.city.trim() !== '' ? formData.city.trim() : 'Other',
        productPurchaseFrom: formData.productPurchaseFrom && formData.productPurchaseFrom.trim() !== '' ? formData.productPurchaseFrom.trim() : undefined,
        hsnCode: formData.hsnCode && formData.hsnCode.trim() !== '' ? formData.hsnCode.trim() : undefined,
      };

      // Merge custom specification fields into specifications
      const customFields = formData.customSpecFields
        .filter(field => field.key && field.value)
        .reduce((acc, field) => {
          acc[field.key] = field.value;
          return acc;
        }, {});

      // Clean up specifications - remove empty strings
      const cleanedSpecs = { ...submitData.specifications };
      Object.keys(cleanedSpecs).forEach(key => {
        if (cleanedSpecs[key] === '' || cleanedSpecs[key] === null || cleanedSpecs[key] === undefined) {
          delete cleanedSpecs[key];
        }
      });
      
      // Clean up size object
      if (cleanedSpecs.size) {
        const size = { ...cleanedSpecs.size };
        Object.keys(size).forEach(key => {
          if (size[key] === '' || size[key] === null || size[key] === undefined) {
            delete size[key];
          }
        });
        if (Object.keys(size).length > 0) {
          cleanedSpecs.size = size;
        } else {
          delete cleanedSpecs.size;
        }
      }

      // Merge custom fields
      const finalSpecs = {
        ...cleanedSpecs,
        ...customFields
      };

      // Only include specifications if it has at least one field
      if (Object.keys(finalSpecs).length > 0) {
        submitData.specifications = finalSpecs;
      } else {
        delete submitData.specifications;
      }

      // Remove customSpecFields from submitData as it's not part of the schema
      delete submitData.customSpecFields;

      if (isEdit) {
        await productAPI.updateProduct(id, submitData);
        alert('Product updated successfully!');
      } else {
        await productAPI.createProduct(submitData);
        alert('Product created successfully!');
      }
      
      navigate('/admin/products');
    } catch (error) {
      alert('Failed to save product: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEdit ? 'Update product information' : 'Create a new product'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                {categoriesLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                    Loading categories...
                  </div>
                ) : (
                  <>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select Category</option>
                      {categories.length > 0 ? (
                        categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>No categories available</option>
                      )}
                    </select>
                    {categories.length === 0 && !categoriesLoading && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 font-medium">No categories found!</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Please seed categories by running: <code className="bg-yellow-100 px-1 rounded">node backend/scripts/seedCategories.js</code>
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Or create a category from the Categories page in the admin panel.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {formData.category && (() => {
                const currentCategory = categories.find(cat => cat._id === formData.category);
                return currentCategory ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory (Optional)
                    </label>
                    {currentCategory.subcategories && currentCategory.subcategories.length > 0 ? (
                      <select
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select Subcategory (Optional)</option>
                        {currentCategory.subcategories.map((subcat, index) => (
                          <option key={index} value={subcat}>{subcat}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                        No subcategories available for this category
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Category (Optional)
                </label>
                <input
                  type="text"
                  name="otherCategory"
                  value={formData.otherCategory}
                  onChange={handleChange}
                  placeholder="Enter other category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Tags
                </label>
                {formData.searchTags.map((tag, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleArrayChange('searchTags', index, e.target.value)}
                      placeholder="Enter search tag"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {formData.searchTags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('searchTags', index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('searchTags')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Search Tag
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-gray-500 text-xs">(Default: Other - shows all products)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city name (e.g., Pune, Mumbai, Nagpur, Ahmedabad) or 'Other' for all cities"
                    list="city-suggestions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <datalist id="city-suggestions">
                    <option value="Other">Other (All cities)</option>
                    <option value="Pune">Pune</option>
                    <option value="Nagpur">Nagpur</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                  </datalist>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Tip: Type "Other" to show products in all cities, or enter a specific city name
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Units
                  </label>
                  <select
                    name="units"
                    value={formData.units}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="Kg">Kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="Piece">Piece</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Pkt">Pkt</option>
                    <option value="Jar">Jar</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Tray">Tray</option>
                    <option value="Roll">Roll</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="purchaseAmount"
                    value={formData.purchaseAmount}
                    onChange={handleChange}
                    placeholder="Add information about price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Mode
                </label>
                <select
                  name="purchaseMode"
                  value={formData.purchaseMode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash & Online">Cash & Online</option>
                  <option value="Cash & Bank Transfer">Cash & Bank Transfer</option>
                  <option value="Online & Bank Transfer">Online & Bank Transfer</option>
                  <option value="Cash & Online & Bank Transfer">Cash & Online & Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Purchase From
                </label>
                <input
                  type="text"
                  name="productPurchaseFrom"
                  value={formData.productPurchaseFrom}
                  onChange={handleChange}
                  placeholder="Enter purchase source"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images (URLs)
                </label>
                {formData.images.map((image, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => handleArrayChange('images', index, e.target.value)}
                      placeholder="Image URL"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('images', index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('images')}
                  className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Image
                </button>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isReturnable"
                    checked={formData.isReturnable}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Product Returnable</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">Status: Active</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sequence Listing
                  </label>
                  <input
                    type="number"
                    name="sequenceListing"
                    value={formData.sequenceListing}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Status
                  </label>
                  <select
                    name="stockStatus"
                    value={formData.stockStatus}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="instock">In Stock</option>
                    <option value="outofstock">Out of Stock</option>
                    <option value="lowstock">Low Stock</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Management */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock Management</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Stock
                </label>
                <input
                  type="number"
                  name="availableStock"
                  value={formData.availableStock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Orderable Quantity
                  </label>
                  <input
                    type="number"
                    name="minimumOrderableQuantity"
                    value={formData.minimumOrderableQuantity}
                    onChange={handleChange}
                    placeholder="Orderable Quantity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incrementor (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="incrementor"
                  value={formData.incrementor}
                  onChange={handleChange}
                  placeholder="Incrementor (Optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Tax & GST Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax & GST Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HSN CODE
                </label>
                <input
                  type="text"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  placeholder="HSN CODE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 mb-2">
                  <strong>Note:</strong> Enter GST Rate %. For Intra-state (same state), CGST and SGST will be auto-calculated (each = GST/2). For Inter-state, use IGST field.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Rate (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="gstOrTaxPercent"
                  value={formData.gstOrTaxPercent}
                  onChange={handleChange}
                  placeholder="Enter GST Rate (e.g., 18 for 18%)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Common GST rates: 0%, 5%, 12%, 18%, 28%
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CGST (%) - Intra-state
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="cgst"
                    value={formData.cgst}
                    onChange={handleChange}
                    placeholder="Auto-calculated or enter manually"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">For same state sales</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SGST (%) - Intra-state
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sgst"
                    value={formData.sgst}
                    onChange={handleChange}
                    placeholder="Auto-calculated or enter manually"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">For same state sales</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IGST (%) - Inter-state
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="igst"
                  value={formData.igst}
                  onChange={handleChange}
                  placeholder="Enter IGST for inter-state sales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">For different state sales (usually same as GST Rate)</p>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <input
                  type="text"
                  name="specifications.material"
                  value={formData.specifications.material}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lid</label>
                <input
                  type="text"
                  name="specifications.lid"
                  value={formData.specifications.lid}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  name="specifications.color"
                  value={formData.specifications.color}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  name="specifications.type"
                  value={formData.specifications.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="text"
                  name="specifications.capacity"
                  value={formData.specifications.capacity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
                <input
                  type="text"
                  name="specifications.shape"
                  value={formData.specifications.shape}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                <input
                  type="text"
                  name="specifications.weight"
                  value={formData.specifications.weight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Size (In cm)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Height</label>
                  <input
                    type="text"
                    name="specifications.size.height"
                    value={formData.specifications.size.height}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Width</label>
                  <input
                    type="text"
                    name="specifications.size.width"
                    value={formData.specifications.size.width}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Base</label>
                  <input
                    type="text"
                    name="specifications.size.base"
                    value={formData.specifications.size.base}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Custom Specification Fields */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Custom Specification Fields</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('customSpecFields')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  + Add Custom Field
                </button>
              </div>
              <div className="space-y-3">
                {formData.customSpecFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => {
                        const newFields = [...formData.customSpecFields];
                        newFields[index] = { ...newFields[index], key: e.target.value };
                        setFormData(prev => ({ ...prev, customSpecFields: newFields }));
                      }}
                      placeholder="Field Name (e.g., Brand, Model, Warranty)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...formData.customSpecFields];
                        newFields[index] = { ...newFields[index], value: e.target.value };
                        setFormData(prev => ({ ...prev, customSpecFields: newFields }));
                      }}
                      placeholder="Field Value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {formData.customSpecFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('customSpecFields', index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Add custom fields that will appear in product specifications (e.g., Brand, Model, Warranty, etc.)
              </p>
            </div>
          </div>

          {/* Features */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleArrayChange('features', index, e.target.value)}
                  placeholder="Feature"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('features', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('features')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              + Add Feature
            </button>
          </div>

          {/* Bulk Offers */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bulk Offers</h2>
            {formData.bulkOffers.map((offer, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={offer.minQty}
                  onChange={(e) => handleArrayChange('bulkOffers', index, { ...offer, minQty: e.target.value })}
                  placeholder="Min Quantity"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  step="0.01"
                  value={offer.pricePerPiece}
                  onChange={(e) => handleArrayChange('bulkOffers', index, { ...offer, pricePerPiece: e.target.value })}
                  placeholder="Price per Piece"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                />
                {formData.bulkOffers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('bulkOffers', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('bulkOffers')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              + Add Bulk Offer
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

