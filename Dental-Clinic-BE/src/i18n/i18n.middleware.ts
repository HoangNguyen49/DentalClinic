const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const path = require('path');

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    preload: ['en', 'vi'],
    backend: {
      loadPath: path.join(__dirname, '../i18n/{{lng}}/translation.json'),
    },
    detection: {
      order: ['cookie', 'header'],
      caches: false,
    },
  });

module.exports = {
  i18nMiddleware: i18nextMiddleware.handle(i18next),
};
