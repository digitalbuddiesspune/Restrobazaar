import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../utils/auth';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const isAuth = isAuthenticated();

  if (!isAuth) {
    // Redirect to admin signin for admin routes, regular signin for others
    const redirectPath = requireAdmin ? '/admin/signin' : '/signin';
    return <Navigate to={redirectPath} replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Navigate to="/admin/signin" replace />
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

