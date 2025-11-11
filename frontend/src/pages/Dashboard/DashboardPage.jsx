import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';

const DashboardPage = () => {
  const { t } = useTranslation(['common', 'dashboard']);
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('common:app_name')}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline text-sm"
              >
                {t('auth:sign_out')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('common:welcome')}
          </h2>
          <p className="text-gray-600">
            Dashboard page is under construction. Coming soon:
          </p>
          <ul className="mt-4 space-y-2 text-gray-600">
            <li>• Property management</li>
            <li>• Booking overview</li>
            <li>• Device monitoring</li>
            <li>• Analytics and reports</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
