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
}) => {
  const resetForm = () => {
    setEditingProductId(null);
    setProductForm({
      productName: "",
      searchTags: "",
      productPurchasedFrom: "",
      purchasedMode: "",
      purchasedAmount: "",
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
      gst: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      isReturnable: false,
      showOnSpecialPage: false,
      status: true,
      images: [],
    });
    setError("");
    setSuccess("");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">
        {editingProductId ? "Edit Product" : "Add New Product"}
      </h2>
      <form onSubmit={handleProductSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter tags separated by commas (e.g., tag1, tag2, tag3)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate multiple tags with commas
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                placeholder="Enter product description"
              />
            </div>
          </div>
        </div>

        {/* Category Information */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Category Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-100"
                  placeholder="Please select a category first"
                  disabled
                />
              )}
              {productForm.category && (
                <p className="mt-1 text-xs text-gray-500">
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter other category if applicable"
              />
            </div>
          </div>
        </div>

        {/* Purchase Information */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Purchase Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchased From
              </label>
              <input
                type="text"
                value={productForm.productPurchasedFrom}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    productPurchasedFrom: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Where was it purchased"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Mode
              </label>
              <input
                type="text"
                value={productForm.purchasedMode}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    purchasedMode: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Cash, Online"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Amount
              </label>
              <input
                type="text"
                value={productForm.purchasedAmount}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    purchasedAmount: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>
          </div>
        </div>

        {/* Unit & Weight */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Unit & Weight</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={productForm.unit}
                onChange={(e) =>
                  setProductForm({ ...productForm, unit: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter weight"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter capacity"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Size</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter height"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter width"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter base"
              />
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Tax Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter HSN code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.gst}
                onChange={(e) =>
                  setProductForm({ ...productForm, gst: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CGST (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.cgst}
                onChange={(e) =>
                  setProductForm({ ...productForm, cgst: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SGST (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.sgst}
                onChange={(e) =>
                  setProductForm({ ...productForm, sgst: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IGST (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={productForm.igst}
                onChange={(e) =>
                  setProductForm({ ...productForm, igst: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="border-b pb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Product Images</h3>
            <button
              type="button"
              onClick={addImage}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
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
          <div className="space-y-4">
            {productForm.images.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No images added. Click "Add Image" to add image URLs.
              </p>
            ) : (
              productForm.images.map((image, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Image {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={image.url}
                        onChange={(e) =>
                          updateImage(index, "url", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alt Text (Optional)
                      </label>
                      <input
                        type="text"
                        value={image.alt}
                        onChange={(e) =>
                          updateImage(index, "alt", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Image description"
                      />
                    </div>
                  </div>
                  {image.url && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preview
                      </label>
                      <div className="border border-gray-200 rounded-lg p-2 bg-white">
                        <img
                          src={image.url}
                          alt={image.alt || "Product image"}
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
              ))
            )}
          </div>
        </div>

        {/* Flags & Status */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold mb-4">Flags & Status</h3>
          <div className="flex flex-wrap gap-6">
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
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Is Returnable</span>
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
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
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
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Active Status</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
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

export default ProductForm;


