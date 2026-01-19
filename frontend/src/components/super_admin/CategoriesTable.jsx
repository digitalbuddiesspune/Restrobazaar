const CategoriesTable = ({ categories, handleEditCategory, handleDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b bg-gray-100">
        <h2 className="text-xl font-bold">All Categories</h2>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category._id} className="even:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      category.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditCategory(category._id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDelete("categories", category._id)
                      }
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No categories found
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesTable;


