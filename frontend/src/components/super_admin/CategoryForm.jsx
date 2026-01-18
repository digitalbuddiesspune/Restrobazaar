import { useState } from "react";
import { uploadImageToS3 } from "../../utils/imageUpload";

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
  getToken,
}) => {
  const [uploading, setUploading] = useState(false);

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const token = getToken ? getToken() : null;
      const imageUrl = await uploadImageToS3(file, 'categories', token);
      
      // Update the image URL in the form
      setCategoryForm({ ...categoryForm, image: imageUrl });
      setSuccess('Image uploaded successfully!');
    } catch (error) {
      setError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
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
            Image URL or Upload File
          </label>
          <div className="space-y-2">
            <input
              type="url"
              value={categoryForm.image}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, image: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg or upload file below"
            />
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                  // Reset input to allow selecting the same file again
                  e.target.value = '';
                }}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-sm">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload an image file or paste an image URL above
            </p>
            {categoryForm.image && (
              <div className="mt-2">
                <label className="block text-xs text-gray-500 mb-1">
                  Preview
                </label>
                <div className="border border-gray-200 rounded-lg p-2 bg-white">
                  <img
                    src={categoryForm.image}
                    alt="Category preview"
                    className="max-w-full h-32 object-contain mx-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EFailed to load%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
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


