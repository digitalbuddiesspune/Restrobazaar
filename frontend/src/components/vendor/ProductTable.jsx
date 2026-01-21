import { useState } from 'react';

const ProductTable = ({ 
  products, 
  isLoading, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [selectedProducts, setSelectedProducts] = useState([]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">No products found. Add products from the catalog!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                City
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Price Type
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50 transition even:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    {product.productId?.images?.[0]?.url || product.productId?.img ? (
                      <img
                        src={product.productId.images?.[0]?.url || product.productId.img}
                        alt={product.productId?.productName || 'Product'}
                        className="h-8 w-8 object-contain p-0.5 bg-white rounded-lg mr-2"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-200 rounded-lg mr-2 flex items-center justify-center">
                        <span className="text-gray-400 text-[10px]">📦</span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 leading-tight">
                        {product.productId?.productName || 'N/A'}
                      </div>
                      {product.productId?.shortDescription && (
                        <div className="text-xs text-gray-500 max-w-xs truncate leading-tight">
                          {product.productId.shortDescription.substring(0, 30)}...
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 leading-tight">
                  {product.cityId?.name || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className="px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {product.priceType}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 leading-tight">
                  {product.priceType === 'single' ? (
                    <span>₹{product.pricing?.single?.price || 0}</span>
                  ) : (
                    <div>
                      <span className="block">{product.pricing?.bulk?.length || 0} slabs</span>
                      {product.pricing?.bulk?.length > 0 && (
                        <span className="text-xs text-gray-400">
                          ₹{product.pricing.bulk[0].price} - ₹
                          {product.pricing.bulk[product.pricing.bulk.length - 1].price}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 leading-tight">
                  <div>
                    <span>{product.availableStock || 0}</span>
                    {product.notifyQuantity &&
                      product.availableStock <= product.notifyQuantity && (
                        <span className="ml-1 text-xs text-orange-600 font-semibold">
                          (Low)
                        </span>
                      )}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${
                      product.status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.status ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-blue-600 hover:text-blue-900 text-left text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onToggleStatus(product._id)}
                      className={`text-left text-xs ${
                        product.status
                          ? 'text-orange-600 hover:text-orange-900'
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {product.status ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => onDelete(product._id)}
                      className="text-red-600 hover:text-red-900 text-left text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;

