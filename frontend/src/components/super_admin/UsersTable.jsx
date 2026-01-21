const UsersTable = ({ users, loading }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b bg-gray-100">
          <h2 className="text-xl font-bold">All Users</h2>
        </div>
        <div className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b bg-gray-100">
        <h2 className="text-xl font-bold">All Users ({users.length})</h2>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                City
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Address
              </th>
              <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                Registered Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-xs text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 even:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono leading-tight">{user._id || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 leading-tight">{user.name || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 leading-tight">{user.email || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 leading-tight">{user.phone || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 leading-tight">{user.city || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm text-gray-900 max-w-xs truncate leading-tight" title={user.address || 'N/A'}>
                      {user.address || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 leading-tight">{formatDate(user.createdAt)}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
