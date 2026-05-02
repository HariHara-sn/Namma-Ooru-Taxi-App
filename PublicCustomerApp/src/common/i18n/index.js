import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-react-native-language-detector';
import english from './locals/en.json';
import tamil from './locals/ta.json';
import kannada from './locals/kn.json';
import malayalam from './locals/ml.json';
import telugu from './locals/te.json';
import hindi from './locals/hi.json';

// Create an isolated i18n instance for common (driver) flows
const i18n = i18next.createInstance();

i18n
  .use(LanguageDetector) // auto detect language
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: english },
      ta: { translation: tamil },
      kn: { translation: kannada },
      ml: { translation: malayalam },
      te: { translation: telugu },
      hi: { translation: hindi },
    },
    interpolation: {
      escapeValue: false, // React already does escaping
      prefix: '{',
      suffix: '}',
    },
  });

export default i18n;
