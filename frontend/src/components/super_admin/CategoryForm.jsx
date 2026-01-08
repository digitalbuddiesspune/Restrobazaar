const CategoryForm = ({
  categoryForm,
  setCategoryForm,
  editingCategoryId,
  handleCategorySubmit,
  loading,
  setEditingCategoryId,
  setError,
  setSuccess,
  generateSlug,
}) => {
  const handleCategoryNameChange = (name) => {
    const newSlug = generateSlug(name);
    setCategoryForm({ ...categoryForm, name, slug: newSlug });
  };

  const resetForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({
      name: "",
      slug: "",
      image: "",
      description: "",
      subcategories: [],
      isActive: true,
      priority: 0,
    });
    setError("");
    setSuccess("");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">
        {editingCategoryId ? "Edit Category" : "Add New Category"}
      </h2>
      <form onSubmit={handleCategorySubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            required
            value={categoryForm.name}
            onChange={(e) => handleCategoryNameChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Electronics"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <input
            type="text"
            value={categoryForm.slug}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, slug: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Auto-generated from name (e.g., electronics)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Slug is auto-generated from name. You can edit it manually if needed.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            value={categoryForm.image}
            onChange={(e) =>
              setCategoryForm({ ...categoryForm, image: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={categoryForm.description}
            onChange={(e) =>
              setCategoryForm({
                ...categoryForm,
                description: e.target.value,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="3"
            placeholder="Enter category description..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subcategories
          </label>
          <div className="space-y-2">
            {categoryForm.subcategories.map((subcat, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={subcat}
                  onChange={(e) => {
                    const newSubcategories = [...categoryForm.subcategories];
                    newSubcategories[index] = e.target.value;
                    setCategoryForm({
                      ...categoryForm,
                      subcategories: newSubcategories,
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter subcategory name"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSubcategories = categoryForm.subcategories.filter(
                      (_, i) => i !== index
                    );
                    setCategoryForm({
                      ...categoryForm,
                      subcategories: newSubcategories,
                    });
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setCategoryForm({
                  ...categoryForm,
                  subcategories: [...categoryForm.subcategories, ""],
                });
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              + Add Subcategory
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Add subcategories for this category (optional).
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <input
            type="number"
            value={categoryForm.priority}
            onChange={(e) =>
              setCategoryForm({
                ...categoryForm,
                priority: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="0"
            min="0"
          />
          <p className="mt-1 text-xs text-gray-500">
            Higher numbers appear first. Default is 0.
          </p>
        </div>
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={categoryForm.isActive}
              onChange={(e) =>
                setCategoryForm({
                  ...categoryForm,
                  isActive: e.target.checked,
                })
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {loading
              ? editingCategoryId
                ? "Updating..."
                : "Creating..."
              : editingCategoryId
              ? "Update Category"
              : "Create Category"}
          </button>
          {editingCategoryId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;


