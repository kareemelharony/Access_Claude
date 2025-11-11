import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
