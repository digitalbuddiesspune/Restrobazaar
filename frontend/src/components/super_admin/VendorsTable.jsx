const VendorsTable = ({ vendors, handleDelete, handleEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b bg-gray-100">
        <h2 className="text-xl font-bold">All Vendors</h2>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-2 text-left text-[10px] font-medium text-gray-700 uppercase">
                Business Name
              </th>
              <th className="px-6 py-2 text-left text-[10px] font-medium text-gray-700 uppercase">
                Email
              </th>
              <th className="px-6 py-2 text-left text-[10px] font-medium text-gray-700 uppercase">
                Phone
              </th>
              <th className="px-6 py-2 text-left text-[10px] font-medium text-gray-700 uppercase">
                UPI ID
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
            {vendors.map((vendor) => (
              <tr key={vendor._id} className="even:bg-gray-50">
                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900 leading-tight">
                  {vendor.businessName}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 leading-tight">
                  {vendor.email}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 leading-tight">
                  {vendor.phone}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 leading-tight">
                  {vendor.bankDetails?.upiId || "-"}
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full ${
                      vendor.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {vendor.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(vendor._id)}
                      className="text-blue-600 hover:text-blue-900 text-xs"
                    >
                      Edit
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleDelete("vendors", vendor._id)}
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
        {vendors.length === 0 && (
          <div className="p-6 text-center text-gray-500">No vendors found</div>
        )}
      </div>
    </div>
  );
};

export default VendorsTable;


