import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Private Route Component
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner h-12 w-12 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
