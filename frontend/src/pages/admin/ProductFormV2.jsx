import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { categoryAPI } from '../../utils/api';

const ProductFormV2 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Details
    productName: '',
    searchTags: [''],
    shortDescription: '',
    
    // Category
    category: '',
    subCategory: '',
    otherCategory: '',
    
    // Location
    city: '',
    
    // Unit & Weight
    unit: 'piece',
    weight: '',
    capacity: '',
    size: {
      height: '',
      width: '',
      base: ''
    },
    
    // Tax
    hsnCode: '',
    gst: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    
    // Pricing Type
    priceType: 'single', // 'single', 'bulk', 'both'
    
    // Discounted Price
    discountedPrice: '',
    
    // Single Price
    singlePrice: '',
    
    // Bulk Price Tiers
    bulkPrices: [{ minQty: '', pricePerUnit: '', unit: 'piece' }],
    
    // Order & Stock
    minimumOrderQuantity: 1,
    availableStock: 0,
    stockStatus: 'in_stock',
    maintainQtyForNotification: 0,
    
    // Flags
    isReturnable: false,
    showOnSpecialPage: false,
    status: true,
    
    // Images
    images: [{ url: '', alt: '' }]
  });

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const category = categories.find(cat => cat._id === formData.category);
      if (category) {
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
      const response = await categoryAPI.getAllCategories();
      if (response.success) {
        setCategories(response.data || []);
      } else {
        alert('Failed to load categories: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Error loading categories: ' + (error.response?.data?.message || error.message));
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${API_BASE_URL}/api/v2/get-product/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );
      
      if (response.data.success) {
        const product = response.data.data;
        setFormData({
          // Basic Details
          productName: product.productName || '',
          searchTags: product.searchTags && product.searchTags.length > 0 ? product.searchTags : [''],
          shortDescription: product.shortDescription || '',
          
          // Category
          category: product.category?._id || product.category || '',
          subCategory: product.subCategory || '',
          otherCategory: product.otherCategory || '',
          
          // Location
          city: product.city || '',
          
          // Unit & Weight
          unit: product.unit || 'piece',
          weight: product.weight || '',
          capacity: product.capacity || '',
          size: {
            height: product.size?.height || '',
            width: product.size?.width || '',
            base: product.size?.base || ''
          },
          
          // Tax
          hsnCode: product.hsnCode || '',
          gst: product.gst || 0,
          cgst: product.cgst || 0,
          sgst: product.sgst || 0,
          igst: product.igst || 0,
          
          // Pricing Type
          priceType: product.priceType || 'single',
          
          // Discounted Price
          discountedPrice: product.discountedPrice || '',
          
          // Single Price
          singlePrice: product.singlePrice || '',
          
          // Bulk Price Tiers
          bulkPrices: product.bulkPrices && product.bulkPrices.length > 0 
            ? product.bulkPrices.map(bp => ({
                minQty: bp.minQty || '',
                pricePerUnit: bp.pricePerUnit || '',
                unit: bp.unit || 'piece'
              }))
            : [{ minQty: '', pricePerUnit: '', unit: 'piece' }],
          
          // Order & Stock
          minimumOrderQuantity: product.minimumOrderQuantity || 1,
          availableStock: product.availableStock || 0,
          stockStatus: product.stockStatus || 'in_stock',
          maintainQtyForNotification: product.maintainQtyForNotification || 0,
          
          // Flags
          isReturnable: product.isReturnable || false,
          showOnSpecialPage: product.showOnSpecialPage || false,
          status: product.status !== undefined ? product.status : true,
          
          // Images
          images: product.images && product.images.length > 0
            ? product.images.map(img => ({
                url: img.url || '',
                alt: img.alt || ''
              }))
            : [{ url: '', alt: '' }]
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('Failed to fetch product: ' + (error.response?.data?.message || error.message));
      navigate('/admin/products-v2');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'category') {
      const category = categories.find(cat => cat._id === value);
      if (category) {
        setSelectedCategory(category);
      } else {
        setSelectedCategory(null);
      }
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subCategory: '' // Reset subcategory when category changes
      }));
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

  const handleBulkPriceChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      bulkPrices: prev.bulkPrices.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], 
        field === 'bulkPrices' ? { minQty: '', pricePerUnit: '', unit: 'piece' } :
        field === 'searchTags' ? '' :
        field === 'images' ? { url: '', alt: '' } :
        '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.productName.trim()) {
        alert('Product Name is required');
        setLoading(false);
        return;
      }
      
      // Validate category
      if (!formData.category || formData.category.trim() === '') {
        alert('Please select a category');
        setLoading(false);
        return;
      }
      
      if (!formData.city.trim()) {
        alert('City is required');
        setLoading(false);
        return;
      }
      
      if (!formData.priceType) {
        alert('Price Type is required');
        setLoading(false);
        return;
      }
      
      // Validate price based on priceType
      if (formData.priceType === 'single' || formData.priceType === 'both') {
        if (!formData.singlePrice || parseFloat(formData.singlePrice) <= 0) {
          alert('Single Price is required when price type is single or both');
          setLoading(false);
          return;
        }
      }
      
      if (formData.priceType === 'bulk' || formData.priceType === 'both') {
        const validBulkPrices = formData.bulkPrices.filter(
          bp => bp.minQty && bp.pricePerUnit && 
          parseFloat(bp.minQty) > 0 && parseFloat(bp.pricePerUnit) > 0
        );
        if (validBulkPrices.length === 0) {
          alert('At least one bulk price tier is required when price type is bulk or both');
          setLoading(false);
          return;
        }
      }
      
      // Prepare data
      const submitData = {
        productName: formData.productName.trim(),
        searchTags: formData.searchTags.filter(tag => tag.trim() !== ''),
        shortDescription: formData.shortDescription.trim() || undefined,
        category: formData.category.trim(), // Ensure category is properly formatted
        subCategory: formData.subCategory.trim() || undefined,
        otherCategory: formData.otherCategory.trim() || undefined,
        city: formData.city.trim().toLowerCase(),
        unit: formData.unit || 'piece',
        weight: formData.weight.trim() || undefined,
        capacity: formData.capacity.trim() || undefined,
        size: {
          height: formData.size.height.trim() || undefined,
          width: formData.size.width.trim() || undefined,
          base: formData.size.base.trim() || undefined
        },
        hsnCode: formData.hsnCode.trim() || undefined,
        gst: formData.gst ? parseFloat(formData.gst) : 0,
        cgst: formData.cgst ? parseFloat(formData.cgst) : 0,
        sgst: formData.sgst ? parseFloat(formData.sgst) : 0,
        igst: formData.igst ? parseFloat(formData.igst) : 0,
        priceType: formData.priceType,
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : undefined,
        singlePrice: (formData.priceType === 'single' || formData.priceType === 'both') && formData.singlePrice 
          ? parseFloat(formData.singlePrice) : undefined,
        bulkPrices: (formData.priceType === 'bulk' || formData.priceType === 'both') 
          ? formData.bulkPrices
              .filter(bp => bp.minQty && bp.pricePerUnit && 
                parseFloat(bp.minQty) > 0 && parseFloat(bp.pricePerUnit) > 0)
              .map(bp => ({
                minQty: parseFloat(bp.minQty),
                pricePerUnit: parseFloat(bp.pricePerUnit),
                unit: bp.unit || 'piece'
              }))
          : [],
        minimumOrderQuantity: parseInt(formData.minimumOrderQuantity) || 1,
        availableStock: parseInt(formData.availableStock) || 0,
        stockStatus: formData.stockStatus || 'in_stock',
        maintainQtyForNotification: parseInt(formData.maintainQtyForNotification) || 0,
        isReturnable: formData.isReturnable || false,
        showOnSpecialPage: formData.showOnSpecialPage || false,
        status: formData.status !== undefined ? formData.status : true,
        images: formData.images
          .filter(img => img.url && img.url.trim() !== '')
          .map(img => ({
            url: img.url.trim(),
            alt: img.alt.trim() || undefined
          }))
      };
      
      // Clean up size object - remove undefined values
      if (submitData.size) {
        Object.keys(submitData.size).forEach(key => {
          if (submitData.size[key] === undefined) {
            delete submitData.size[key];
          }
        });
        if (Object.keys(submitData.size).length === 0) {
          delete submitData.size;
        }
      }
      
      // Get API base URL
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const token = localStorage.getItem('token');
      
      // Make API call
      let response;
      if (isEdit) {
        response = await axios.put(
          `${API_BASE_URL}/api/v2/update-product/${id}`,
          submitData,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` })
            }
          }
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/api/v2/create-product`,
          submitData,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` })
            }
          }
        );
      }
      
      if (response.data.success) {
        alert(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
        navigate('/admin/products-v2');
      } else {
        alert(`Failed to ${isEdit ? 'update' : 'create'} product: ` + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} product:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'create'} product: ` + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Check if bulk price fields should be disabled
  const isBulkPriceDisabled = formData.priceType === 'single';
  const isSinglePriceDisabled = formData.priceType === 'bulk';

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
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4">
        <div className="mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Product (V2)' : 'Add New Product (V2)'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            {isEdit ? 'Update product information' : 'Create a new product with single or bulk pricing'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4 space-y-3 sm:space-y-4">
          {/* Basic Information */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Basic Information</h2>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Short Description
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Category *
                  </label>
                  {categoriesLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                      Loading categories...
                    </div>
                  ) : (
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Subcategory (Optional)
                  </label>
                  {formData.category && selectedCategory?.subcategories?.length > 0 ? (
                    <select
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select Subcategory</option>
                      {selectedCategory.subcategories.map((subcat, index) => (
                        <option key={index} value={subcat}>{subcat}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleChange}
                      placeholder="Enter subcategory"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Other Category (Optional)
                  </label>
                  <input
                    type="text"
                    name="otherCategory"
                    value={formData.otherCategory}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
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
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('searchTags')}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Search Tag
                </button>
              </div>
            </div>
          </div>

          {/* Unit & Weight */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Unit & Weight</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Weight
                </label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Capacity
                </label>
                <input
                  type="text"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="mt-2">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Size (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-900 mb-0.5">Height</label>
                  <input
                    type="text"
                    name="size.height"
                    value={formData.size.height}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-900 mb-0.5">Width</label>
                  <input
                    type="text"
                    name="size.width"
                    value={formData.size.width}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-900 mb-0.5">Base</label>
                  <input
                    type="text"
                    name="size.base"
                    value={formData.size.base}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Tax Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  HSN Code
                </label>
                <input
                  type="text"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  GST (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  CGST (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="cgst"
                  value={formData.cgst}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  SGST (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="sgst"
                  value={formData.sgst}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  IGST (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="igst"
                  value={formData.igst}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Pricing</h2>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Price Type *
                </label>
                <select
                  name="priceType"
                  value={formData.priceType}
                  onChange={handleChange}
                  required
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="single">Single Price</option>
                  <option value="bulk">Bulk Price</option>
                  <option value="both">Both (Single & Bulk)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Single Price {formData.priceType === 'single' || formData.priceType === 'both' ? '*' : ''}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="singlePrice"
                    value={formData.singlePrice}
                    onChange={handleChange}
                    disabled={isSinglePriceDisabled}
                    required={formData.priceType === 'single' || formData.priceType === 'both'}
                    className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      isSinglePriceDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Discounted Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="discountedPrice"
                    value={formData.discountedPrice}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Bulk Prices */}
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Bulk Price Tiers {(formData.priceType === 'bulk' || formData.priceType === 'both') ? '*' : ''}
                </label>
                {formData.bulkPrices.map((bulkPrice, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="number"
                      value={bulkPrice.minQty}
                      onChange={(e) => handleBulkPriceChange(index, 'minQty', e.target.value)}
                      placeholder="Min Quantity"
                      disabled={isBulkPriceDisabled}
                      className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        isBulkPriceDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={bulkPrice.pricePerUnit}
                      onChange={(e) => handleBulkPriceChange(index, 'pricePerUnit', e.target.value)}
                      placeholder="Price Per Unit"
                      disabled={isBulkPriceDisabled}
                      className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        isBulkPriceDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                    <select
                      value={bulkPrice.unit}
                      onChange={(e) => handleBulkPriceChange(index, 'unit', e.target.value)}
                      disabled={isBulkPriceDisabled}
                      className={`px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        isBulkPriceDisabled ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="piece">Piece</option>
                      <option value="kg">Kg</option>
                      <option value="g">g</option>
                    </select>
                    {formData.bulkPrices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('bulkPrices', index)}
                        disabled={isBulkPriceDisabled}
                        className={`px-2 py-1 text-xs rounded-lg ${
                          isBulkPriceDisabled 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('bulkPrices')}
                  disabled={isBulkPriceDisabled}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    isBulkPriceDisabled 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  + Add Bulk Price Tier
                </button>
              </div>
            </div>
          </div>

          {/* Order & Stock */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Order & Stock</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Minimum Order Quantity
                </label>
                <input
                  type="number"
                  name="minimumOrderQuantity"
                  value={formData.minimumOrderQuantity}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Available Stock
                </label>
                <input
                  type="number"
                  name="availableStock"
                  value={formData.availableStock}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Stock Status
                </label>
                <select
                  name="stockStatus"
                  value={formData.stockStatus}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="limited">Limited</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Maintain Qty For Notification
                </label>
                <input
                  type="number"
                  name="maintainQtyForNotification"
                  value={formData.maintainQtyForNotification}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Flags */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Product Flags</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isReturnable"
                  checked={formData.isReturnable}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label className="ml-2 text-sm text-gray-900">Product Returnable</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="showOnSpecialPage"
                  checked={formData.showOnSpecialPage}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label className="ml-2 text-sm text-gray-900">Show on Special Page</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label className="ml-2 text-sm text-gray-900">Status: Active</label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Images</h2>
            {formData.images.map((image, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={image.url}
                  onChange={(e) => handleArrayChange('images', index, { ...image, url: e.target.value })}
                  placeholder="Image URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <input
                  type="text"
                  value={image.alt}
                  onChange={(e) => handleArrayChange('images', index, { ...image, alt: e.target.value })}
                  placeholder="Alt text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                {formData.images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('images', index)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('images')}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              + Add Image
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 text-sm"
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Product' : 'Create Product')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products-v2')}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormV2;

