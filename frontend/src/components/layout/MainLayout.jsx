import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  MessageSquare,
  Cpu,
  ListTodo,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const MainLayout = ({ children }) => {
  const { t, i18n } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('navigation.properties'), href: '/properties', icon: Building2 },
    { name: t('navigation.bookings'), href: '/bookings', icon: Calendar },
    { name: t('navigation.messages'), href: '/messages', icon: MessageSquare },
    { name: t('navigation.devices'), href: '/devices', icon: Cpu },
    { name: t('navigation.tasks'), href: '/tasks', icon: ListTodo },
    { name: t('navigation.reports'), href: '/reports', icon: BarChart3 },
    { name: t('navigation.settings'), href: '/settings', icon: Settings },
  ];

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <Link to="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">
                {t('app_name')}
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => changeLanguage('en')}
                className={`flex-1 px-3 py-2 text-sm rounded ${
                  i18n.language === 'en'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('ar')}
                className={`flex-1 px-3 py-2 text-sm rounded ${
                  i18n.language === 'ar'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                العربية
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t('navigation.sign_out', 'Sign Out')}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-10 bg-white shadow">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="text-lg font-bold text-primary-600">
              {t('app_name')}
            </span>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
