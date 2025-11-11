import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Store
import useAuthStore from './store/authStore';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import PropertiesListPage from './pages/Properties/PropertiesListPage';
import BookingsListPage from './pages/Bookings/BookingsListPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import PrivateRoute from './components/common/PrivateRoute';
import PublicRoute from './components/common/PublicRoute';
import MainLayout from './components/layout/MainLayout';

function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes - redirect to dashboard if authenticated */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Private Routes - require authentication */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Properties */}
          <Route
            path="/properties"
            element={
              <PrivateRoute>
                <MainLayout>
                  <PropertiesListPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Bookings */}
          <Route
            path="/bookings"
            element={
              <PrivateRoute>
                <MainLayout>
                  <BookingsListPage />
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Placeholder routes for other pages */}
          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <MainLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Messages - Coming Soon</h1>
                  </div>
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/devices"
            element={
              <PrivateRoute>
                <MainLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Devices - Coming Soon</h1>
                  </div>
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <MainLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Tasks - Coming Soon</h1>
                  </div>
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <MainLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Reports - Coming Soon</h1>
                  </div>
                </MainLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <MainLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Settings - Coming Soon</h1>
                  </div>
                </MainLayout>
              </PrivateRoute>
            }
          />

          {/* Root redirect */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default App;
