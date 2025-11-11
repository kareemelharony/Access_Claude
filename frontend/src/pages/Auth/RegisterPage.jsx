import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-900">
            {t('common:app_name')}
          </h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('auth:sign_up')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth:have_account')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('auth:sign_in')}
            </Link>
          </p>
        </div>

        <div className="card">
          <p className="text-center text-gray-600">
            Registration page coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
