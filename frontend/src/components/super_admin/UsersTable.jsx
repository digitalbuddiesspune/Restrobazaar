// Edit (pencil) and Delete (trash) SVG icons for action buttons
const IconEdit = ({ className = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
  </svg>
);
const IconDelete = ({ className = 'w-4 h-4' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const UsersTable = ({ users, loading, onEdit, onDelete }) => {
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
              {(onEdit || onDelete) && (
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={onEdit || onDelete ? 7 : 6} className="px-6 py-8 text-center text-xs text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 even:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono leading-tight">{(() => {
                      const userId = user._id || 'N/A';
                      if (!userId || userId === 'N/A') return 'N/A';
                      const idString = String(userId);
                      return idString.length > 6 ? idString.slice(-6) : idString;
                    })()}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 leading-tight">{user.name || 'N/A'}</div>
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
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(user)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit user"
                          >
                            <IconEdit />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(user)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete user"
                          >
                            <IconDelete />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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
