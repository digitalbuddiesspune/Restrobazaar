import { useState } from "react";
import { uploadImageToS3 } from "../../utils/imageUpload";

const ProductForm = ({
  productForm,
  setProductForm,
  categories,
  editingProductId,
  handleProductSubmit,
  loading,
  setEditingProductId,
  setError,
  setSuccess,
  addImage,
  removeImage,
  updateImage,
  getToken,
}) => {
  const [uploadingIndex, setUploadingIndex] = useState(null);

  // Handle file upload
  const handleFileUpload = async (index, file) => {
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
      setUploadingIndex(index);
      setError('');

      const token = getToken ? getToken() : null;
      const imageUrl = await uploadImageToS3(file, 'products', token);
      
      // Update the image URL in the form
      updateImage(index, 'url', imageUrl);
      setSuccess('Image uploaded successfully!');
    } catch (error) {
      setError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingIndex(null);
    }
  };

  const resetForm = () => {
    setEditingProductId(null);
    setProductForm({
      productName: "",
      searchTags: "",
      shortDescription: "",
      category: "",
      subCategory: "",
      otherCategory: "",
      unit: "piece",
      weight: "",
      capacity: "",
      size: {
        height: "",
        width: "",
        base: "",
      },
      hsnCode: "",
      isReturnable: false,
      showOnSpecialPage: false,
      status: true,
      images: [],
    });
    setError("");
    setSuccess("");
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold mb-4">
        {editingProductId ? "Edit Product" : "Add New Product"}
      </h2>
      <form onSubmit={handleProductSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="border-b pb-3">
          <h3 className="text-base font-semibold mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={productForm.productName}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    productName: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search Tags
              </label>
              <input
                type="text"
                value={productForm.searchTags}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    searchTags: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter tags separated by commas"
              />
              <p className="mt-0.5 text-[10px] text-gray-500">
                Separate with commas
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                value={productForm.shortDescription}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    shortDescription: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="2"
                placeholder="Enter product description"
              />
            </div>
          </div>
        </div>

        {/* Category Information */}
        <div className="border-b pb-3">
          <h3 className="text-base font-semibold mb-3">Category Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={productForm.category}
                onChange={(e) => {
                  setProductForm({
                    ...productForm,
                    category: e.target.value,
                    subCategory: "",
                  });
                }}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sub Category
              </label>
              {productForm.category ? (
                (() => {
                  const selectedCategory = categories.find(
                    (cat) => cat._id === productForm.category
                  );
                  const subcategories =
                    selectedCategory?.subcategories || [];
                  return subcategories.length > 0 ? (
                    <select
                      value={productForm.subCategory}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          subCategory: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select a subcategory</option>
                      {subcategories.map((subcat, index) => (
                        <option key={index} value={subcat}>
                          {subcat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={productForm.subCategory}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          subCategory: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="No subcategories available. Enter manually if needed."
                    />
                  );
                })()
              ) : (
                <input
                  type="text"
                  value={productForm.subCategory}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      subCategory: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-100"
                  placeholder="Please select a category first"
                  disabled
                />
              )}
              {productForm.category && (
                <p className="mt-0.5 text-[10px] text-gray-500">
                  {(() => {
                    const selectedCategory = categories.find(
                      (cat) => cat._id === productForm.category
                    );
                    const subcategories =
                      selectedCategory?.subcategories || [];
                    return subcategories.length > 0
                      ? `Select from ${subcategories.length} available subcategories`
                      : "This category has no subcategories. You can enter one manually.";
                  })()}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Other Category
              </label>
              <input
                type="text"
                value={productForm.otherCategory}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    otherCategory: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter other category if applicable"
              />
            </div>
          </div>
        </div>

        {/* Unit & Weight */}
        <div className="border-b pb-3">
          <h3 className="text-base font-semibold mb-3">Unit & Weight</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={productForm.unit}
                onChange={(e) =>
                  setProductForm({ ...productForm, unit: e.target.value })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="piece">Piece</option>
                <option value="kg">Kg</option>
                <option value="grams">Grams</option>
                <option value="liter">Liter</option>
                <option value="ml">ML</option>
                <option value="box">Box</option>
                <option value="meter">Meter</option>
                <option value="tray">Tray</option>
                <option value="bottel">Bottel</option>
                <option value="jar">Jar</option>
                <option value="pkt">Pkt</option>
                <option value="roll">Roll</option>
                <option value="sheet">Sheet</option>
                <option value="pouch">Pouch</option>
                <option value="bowl">Bowl </option>
                <option value="cup">Cup</option>
                <option value="plate">Plate</option>
                <option value="spoon">Spoon</option>
                <option value="fork">Fork</option>
                <option value="knife">Knife</option>
                <option value="chopstick">Chopstick</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Weight
              </label>
              <input
                type="text"
                value={productForm.weight}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    weight: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter weight"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                type="text"
                value={productForm.capacity}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    capacity: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter capacity"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="border-b pb-3">
          <h3 className="text-base font-semibold mb-3">Size</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Height
              </label>
              <input
                type="text"
                value={productForm.size.height}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    size: { ...productForm.size, height: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter height"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Width
              </label>
              <input
                type="text"
                value={productForm.size.width}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    size: { ...productForm.size, width: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter width"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Base
              </label>
              <input
                type="text"
                value={productForm.size.base}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    size: { ...productForm.size, base: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter base"
              />
            </div>
          </div>
        </div>

        {/* HSN Code */}
        <div className="border-b pb-3">
          <h3 className="text-base font-semibold mb-3">Tax Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={productForm.hsnCode}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    hsnCode: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter HSN code"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="border-b pb-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold">Product Images</h3>
            <button
              type="button"
              onClick={addImage}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Image
            </button>
          </div>
          <div className="space-y-3">
            {productForm.images.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                No images added. Click "Add Image" to add image URLs.
              </p>
            ) : (
              productForm.images.map((image, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-gray-700">
                      Image {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Image URL or Upload File *
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="url"
                          required
                          value={image.url}
                          onChange={(e) =>
                            updateImage(index, "url", e.target.value)
                          }
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://example.com/image.jpg or upload file below"
                        />
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleFileUpload(index, file);
                              }
                              // Reset input to allow selecting the same file again
                              e.target.value = '';
                            }}
                            disabled={uploadingIndex === index}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          {uploadingIndex === index && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
                              <div className="flex items-center gap-1.5 text-purple-600">
                                <svg
                                  className="animate-spin h-4 w-4"
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
                                <span className="text-xs">Uploading...</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Upload an image file or paste an image URL above
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Alt Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={image.alt}
                        onChange={(e) =>
                          updateImage(index, "alt", e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Image description"
                      />
                    </div>
                  </div>
                  {image.url && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Preview
                      </label>
                      <div className="border border-gray-200 rounded-lg p-1.5 bg-white">
                        <img
                          src={image.url}
                          alt={image.alt || "Product image"}
                          className="max-w-full h-24 object-contain mx-auto"
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
              ))
            )}
          </div>
        </div>

        {/* Flags & Status */}
        <div className="border-b pb-3">
          <h3 className="text-base font-semibold mb-3">Flags & Status</h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={productForm.isReturnable}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    isReturnable: e.target.checked,
                  })
                }
                className="mr-1.5"
              />
              <span className="text-xs text-gray-700">Is Returnable</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={productForm.showOnSpecialPage}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    showOnSpecialPage: e.target.checked,
                  })
                }
                className="mr-1.5"
              />
              <span className="text-xs text-gray-700">
                Show on Special Page
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={productForm.status}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    status: e.target.checked,
                  })
                }
                className="mr-1.5"
              />
              <span className="text-xs text-gray-700">Active Status</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {loading
              ? editingProductId
                ? "Updating..."
                : "Creating..."
              : editingProductId
              ? "Update Product"
              : "Create Product"}
          </button>
          {editingProductId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProductForm;


