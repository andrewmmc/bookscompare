import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resolveDeviceLocale } from './locale';
import { namespaces, resources } from './resources';

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveDeviceLocale(),
  fallbackLng: 'zh-TW',
  supportedLngs: ['en', 'zh-TW'],
  defaultNS: 'common',
  ns: namespaces,
  interpolation: {
    escapeValue: false,
  },
  initAsync: false,
});

export { i18n };
