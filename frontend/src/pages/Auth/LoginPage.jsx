import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';

const LoginPage = () => {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = t('auth:errors.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth:errors.email_invalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth:errors.password_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success(t('auth:login_success'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || t('auth:login_error'));
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-900">
            {t('common:app_name')}
          </h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('auth:sign_in')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth:no_account')}{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('auth:sign_up')}
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="label label-required">
                {t('auth:email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder={t('auth:email_placeholder')}
              />
              {errors.email && (
                <p className="error-message">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label label-required">
                {t('auth:password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder={t('auth:password_placeholder')}
              />
              {errors.password && (
                <p className="error-message">{errors.password}</p>
              )}
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ms-2 block text-sm text-gray-900"
                >
                  {t('auth:remember_me')}
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {t('auth:forgot_password')}
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="spinner h-5 w-5 me-2"></div>
                    {t('common:messages.loading')}
                  </>
                ) : (
                  t('auth:sign_in')
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded ${
              i18n.language === 'en'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('ar')}
            className={`px-4 py-2 rounded ${
              i18n.language === 'ar'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700'
            }`}
          >
            العربية
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
