import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enWeb from '../../locales/en/translation-web.json';
import viWeb from '../../locales/vi/translation-web.json';
import enAdmin from '../../locales/en/translation-admin.json';
import viAdmin from '../../locales/vi/translation-admin.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        web: enWeb,
        admin: enAdmin,
      },
      vi: {
        web: viWeb,
        admin: viAdmin,
      },
    },
    lng: localStorage.getItem('lang') || 'en',
    fallbackLng: 'en',
    ns: ['web', 'admin'], 
    defaultNS: 'web', 
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
