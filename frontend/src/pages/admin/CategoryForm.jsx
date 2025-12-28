import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoryAPI } from '../../utils/api';

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    subcategories: [''],
    isActive: true,
    order: 0
  });

  useEffect(() => {
    if (isEdit) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAllCategories();
      if (response.success) {
        const category = response.data.find(cat => cat._id === id);
        if (category) {
          setFormData({
            name: category.name || '',
            slug: category.slug || '',
            image: category.image || '',
            subcategories: category.subcategories && category.subcategories.length > 0 
              ? category.subcategories 
              : [''],
            isActive: category.isActive !== undefined ? category.isActive : true,
            order: category.order || 0
          });
        }
      }
    } catch (error) {
      alert('Failed to fetch category: ' + error.message);
      navigate('/admin/categories');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleSubcategoryChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.map((sub, i) => i === index ? value : sub)
    }));
  };

  const addSubcategory = () => {
    setFormData(prev => ({
      ...prev,
      subcategories: [...prev.subcategories, '']
    }));
  };

  const removeSubcategory = (index) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Clean up subcategories - remove empty strings
      const cleanedSubcategories = formData.subcategories.filter(sub => sub.trim() !== '');
      
      const submitData = {
        ...formData,
        subcategories: cleanedSubcategories.length > 0 ? cleanedSubcategories : []
      };

      if (isEdit) {
        await categoryAPI.updateCategory(id, submitData);
        alert('Category updated successfully!');
      } else {
        await categoryAPI.createCategory(submitData);
        alert('Category created successfully!');
      }
      
      navigate('/admin/categories');
    } catch (error) {
      alert('Failed to save category: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEdit ? 'Update category information' : 'Create a new category'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Category Name *
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
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="category-slug"
                />
                <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (auto-generated from name)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Category Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Subcategories
                </label>
                <div className="space-y-2">
                  {formData.subcategories.map((subcategory, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={subcategory}
                        onChange={(e) => handleSubcategoryChange(index, e.target.value)}
                        placeholder="Enter subcategory name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      {formData.subcategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubcategory(index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSubcategory}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    + Add Subcategory
                  </button>
                </div>
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">Lower numbers appear first in sidebar (e.g., 1, 2, 3...)</p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label className="text-sm font-medium text-gray-900">
                  Category is Active
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Category' : 'Create Category')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;

