const CitiesTable = ({ cities, handleDelete, handleToggleStatus }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b bg-gray-100">
        <h2 className="text-xl font-bold">All Cities</h2>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-2 text-left text-[10px] font-medium text-gray-700 uppercase">
                Name
              </th>
              <th className="px-6 py-2 text-left text-[10px] font-medium text-gray-700 uppercase">
                State
              </th>
              <th className="px-6 py-2 text-left text-[10px] font-medium text-gray-700 uppercase">
                Status
              </th>
              <th className="px-6 py-2 text-left text-[10px] font-medium text-gray-700 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cities.map((city) => (
              <tr key={city._id} className="even:bg-gray-50">
                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900 leading-tight">
                  {city.displayName || city.name}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 leading-tight">
                  {city.state}
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <select
                    value={city.isActive ? "active" : "inactive"}
                    onChange={(e) => {
                      if (handleToggleStatus) {
                        const newStatus = e.target.value === "active";
                        // Only toggle if status is actually changing
                        if (newStatus !== city.isActive) {
                          handleToggleStatus(city._id);
                        }
                      }
                    }}
                    className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${
                      city.isActive
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-red-100 text-red-800 border-red-300"
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDelete("cities", city._id)}
                      className="text-red-600 hover:text-red-900 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cities.length === 0 && (
          <div className="p-6 text-center text-gray-500">No cities found</div>
        )}
      </div>
    </div>
  );
};

export default CitiesTable;


