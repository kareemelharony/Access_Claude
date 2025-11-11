const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const path = require('path');

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    preload: ['en', 'ar'],
    supportedLngs: ['en', 'ar'],

    backend: {
      loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json')
    },

    detection: {
      order: ['querystring', 'cookie', 'header'],
      caches: ['cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupHeader: 'accept-language',
      cookieSecure: process.env.NODE_ENV === 'production',
      cookieSameSite: 'strict'
    },

    interpolation: {
      escapeValue: false
    },

    ns: ['common', 'dashboard', 'bookings', 'properties', 'devices', 'messages', 'errors'],
    defaultNS: 'common'
  });

module.exports = { i18next, i18nextMiddleware };
