import { useApp } from '../context/AppContext';
import { STRINGS, LANGS } from './strings';

export { LANGS };

// Translation table + RTL helpers. RTL is applied per component (row-reverse and text
// alignment), so switching to Arabic never needs an app reload.
export function useI18n() {
  const { state, setLang } = useApp();
  const lang = state.lang;
  const isRTL = lang === 'ar';
  return {
    lang,
    t: STRINGS[lang] || STRINGS.en,
    isRTL,
    setLang,
    row: { flexDirection: isRTL ? 'row-reverse' : 'row' },
    align: { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' },
  };
}

// Replace {placeholders} in a translated string.
export const fmt = (s, vars) =>
  Object.keys(vars).reduce((acc, k) => acc.split(`{${k}}`).join(String(vars[k])), s);
