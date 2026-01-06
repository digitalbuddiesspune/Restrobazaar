import { useState, useEffect } from 'react';

const ProductForm = ({ 
  product, 
  globalProducts, 
  cities, 
  vendorCityId,
  onSubmit, 
  onCancel,
  isLoading 
}) => {
  const [formData, setFormData] = useState({
    productId: product?.productId?._id || product?.productId || '',
    cityId: product?.cityId?._id || product?.cityId || vendorCityId || '',
    priceType: product?.priceType || 'single',
    pricing: product?.pricing || {
      single: { price: '' },
      bulk: [],
    },
    availableStock: product?.availableStock || 0,
    minimumOrderQuantity: product?.minimumOrderQuantity || 1,
    notifyQuantity: product?.notifyQuantity || '',
    status: product?.status !== undefined ? product.status : true,
  });

  const [bulkSlabs, setBulkSlabs] = useState(
    formData.pricing?.bulk || []
  );

  useEffect(() => {
    if (product) {
      setFormData({
        productId: product.productId?._id || product.productId || '',
        cityId: product.cityId?._id || product.cityId || vendorCityId || '',
        priceType: product.priceType || 'single',
        pricing: product.pricing || {
          single: { price: '' },
          bulk: [],
        },
        availableStock: product.availableStock || 0,
        minimumOrderQuantity: product.minimumOrderQuantity || 1,
        notifyQuantity: product.notifyQuantity || '',
        status: product.status !== undefined ? product.status : true,
      });
      setBulkSlabs(product.pricing?.bulk || []);
    }
  }, [product, vendorCityId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    let pricingData = {};
    if (formData.priceType === 'single') {
      pricingData = {
        single: {
          price: parseFloat(formData.pricing.single.price) || 0,
        },
      };
    } else {
      const validSlabs = bulkSlabs.filter(
        (slab) => slab.minQty && slab.maxQty && slab.price
      );
      pricingData = {
        bulk: validSlabs.map((slab) => ({
          minQty: parseFloat(slab.minQty),
          maxQty: parseFloat(slab.maxQty),
          price: parseFloat(slab.price),
        })),
      };
    }

    const submitData = {
      productId: formData.productId,
      cityId: formData.cityId,
      priceType: formData.priceType,
      pricing: pricingData,
      availableStock: parseFloat(formData.availableStock) || 0,
      minimumOrderQuantity: parseFloat(formData.minimumOrderQuantity) || 1,
      notifyQuantity: formData.notifyQuantity
        ? parseFloat(formData.notifyQuantity)
        : undefined,
      status: formData.status,
    };

    onSubmit(submitData);
  };

  const addBulkSlab = () => {
    setBulkSlabs([...bulkSlabs, { minQty: '', maxQty: '', price: '' }]);
  };

  const removeBulkSlab = (index) => {
    setBulkSlabs(bulkSlabs.filter((_, i) => i !== index));
  };

  const updateBulkSlab = (index, field, value) => {
    const newSlabs = [...bulkSlabs];
    newSlabs[index] = { ...newSlabs[index], [field]: value };
    setBulkSlabs(newSlabs);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {product ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select Product *
          </label>
          <select
            required
            value={formData.productId}
            onChange={(e) =>
              setFormData({ ...formData, productId: e.target.value })
            }
            disabled={!!product}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select a product</option>
            {globalProducts?.map((p) => (
              <option key={p._id} value={p._id}>
                {p.productName}
              </option>
            ))}
          </select>
        </div>

        {/* City Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            City *
          </label>
          {vendorCityId ? (
            <input
              type="text"
              value={cities?.find((c) => c._id === vendorCityId)?.displayName || cities?.find((c) => c._id === vendorCityId)?.name || 'Your City'}
              disabled
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          ) : (
            <select
              required
              value={formData.cityId}
              onChange={(e) =>
                setFormData({ ...formData, cityId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a city</option>
              {cities?.map((city) => (
                <option key={city._id} value={city._id}>
                  {city.displayName || city.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Price Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Price Type *
          </label>
          <select
            required
            value={formData.priceType}
            onChange={(e) =>
              setFormData({ ...formData, priceType: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="single">Single Price</option>
            <option value="bulk">Bulk Pricing</option>
          </select>
        </div>

        {/* Pricing */}
        {formData.priceType === 'single' ? (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.pricing.single.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricing: {
                    ...formData.pricing,
                    single: { price: e.target.value },
                  },
                })
              }
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter price"
            />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Bulk Price Slabs *
              </label>
              <button
                type="button"
                onClick={addBulkSlab}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Slab
              </button>
            </div>
            {bulkSlabs.map((slab, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                <input
                  type="number"
                  required
                  min="1"
                  value={slab.minQty}
                  onChange={(e) => updateBulkSlab(index, 'minQty', e.target.value)}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Min Qty"
                />
                <input
                  type="number"
                  required
                  min="1"
                  value={slab.maxQty}
                  onChange={(e) => updateBulkSlab(index, 'maxQty', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Max Qty"
                />
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={slab.price}
                  onChange={(e) => updateBulkSlab(index, 'price', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Price"
                />
                <button
                  type="button"
                  onClick={() => removeBulkSlab(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stock Management */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Available Stock
            </label>
            <input
              type="number"
              min="0"
              value={formData.availableStock}
              onChange={(e) =>
                setFormData({ ...formData, availableStock: e.target.value })
              }
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Min Order Qty
            </label>
            <input
              type="number"
              min="1"
              value={formData.minimumOrderQuantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minimumOrderQuantity: e.target.value,
                })
              }
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Low Stock Alert
            </label>
            <input
              type="number"
              min="0"
              value={formData.notifyQuantity}
              onChange={(e) =>
                setFormData({ ...formData, notifyQuantity: e.target.value })
              }
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.checked })
              }
              className="mr-2"
            />
            <span className="text-xs text-gray-700">Active</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? 'Saving...'
              : product
              ? 'Update Product'
              : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;

