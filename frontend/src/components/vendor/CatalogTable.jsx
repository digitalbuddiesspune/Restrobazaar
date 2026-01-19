import { useState } from 'react';

const CatalogTable = ({ 
  products, 
  isLoading, 
  onAddToCatalog,
  isProductInCatalog,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  searchQuery = '',
  onSearchChange,
  categories = [],
  subCategories = [],
  categoryFilter = 'all',
  subCategoryFilter = 'all',
  onCategoryFilterChange,
  onSubCategoryFilterChange,
  sortBy = 'newest',
  onSortByChange,
}) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Search Bar and Filters */}
      <div className="p-3 border-b border-gray-200 space-y-3">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Filters - All in one horizontal line */}
        <div className="flex items-end gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Subcategory
            </label>
            <select
              value={subCategoryFilter}
              onChange={(e) => onSubCategoryFilterChange(e.target.value)}
              disabled={categoryFilter === 'all' || subCategories.length === 0}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="all">All Subcategories</option>
              {subCategories.map((subCategory, index) => (
                <option key={index} value={subCategory}>
                  {subCategory}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newly Added first</option>
              <option value="oldest">Old Added first</option>
              <option value="nameAsc">Product name Ascending</option>
              <option value="nameDesc">Product name Descending</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(categoryFilter !== 'all' || subCategoryFilter !== 'all' || sortBy !== 'newest') && (
            <div>
              <button
                onClick={() => {
                  onCategoryFilterChange('all');
                  onSubCategoryFilterChange('all');
                  onSortByChange('newest');
                }}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Image
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products && products.length > 0 ? (
              products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 transition even:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {product.img || (product.images && product.images[0]?.url) ? (
                      <img
                        src={product.img || product.images[0].url}
                        alt={product.images?.[0]?.alt || product.productName}
                        className="h-8 w-8 object-contain p-0.5 bg-white rounded-lg"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">📦</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-900">
                      {product.productName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-gray-500">
                      {product.category?.name || 'N/A'}
                    </div>
                    {product.subCategory && (
                      <div className="text-xs text-gray-400">
                        {product.subCategory}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {product.unit || 'piece'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-4 font-semibold rounded-full ${
                        product.status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                    {isProductInCatalog(product._id) ? (
                      <span className="text-gray-400 font-medium cursor-not-allowed">
                        Already Added
                      </span>
                    ) : (
                      <button
                        onClick={() => onAddToCatalog(product)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Add to Catalog
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-3 text-center text-xs text-gray-500">
                  No products found
                </td>
              </tr>
            )}
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

export default CatalogTable;

