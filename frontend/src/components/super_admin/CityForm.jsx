const CityForm = ({ cityForm, setCityForm, handleCitySubmit, loading }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Add New City</h2>
      <form onSubmit={handleCitySubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City Name (lowercase) *
          </label>
          <input
            type="text"
            required
            value={cityForm.name}
            onChange={(e) =>
              setCityForm({
                ...cityForm,
                name: e.target.value.toLowerCase(),
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., pune"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name *
          </label>
          <input
            type="text"
            required
            value={cityForm.displayName}
            onChange={(e) =>
              setCityForm({ ...cityForm, displayName: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Pune"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            type="text"
            required
            value={cityForm.state}
            onChange={(e) =>
              setCityForm({ ...cityForm, state: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            value={cityForm.country}
            onChange={(e) =>
              setCityForm({ ...cityForm, country: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={cityForm.isServiceable}
              onChange={(e) =>
                setCityForm({
                  ...cityForm,
                  isServiceable: e.target.checked,
                })
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Serviceable</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={cityForm.isActive}
              onChange={(e) =>
                setCityForm({ ...cityForm, isActive: e.target.checked })
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create City"}
        </button>
      </form>
    </div>
  );
};

export default CityForm;


