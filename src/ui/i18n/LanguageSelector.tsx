// The English / 简体中文 picker in the page header.
import { useLanguage, useT } from './LanguageContext';
import { LANGUAGE_NAMES, isLanguage, type Language } from './language';

const LANGUAGES: Language[] = ['en', 'zh'];

export function LanguageSelector() {
  // React: useT / useLanguage read the shared language Context, so this component needs no props.
  const t = useT();
  const { language, setLanguage } = useLanguage();

  return (
    <label className="language-selector">
      <span className="visually-hidden">{t.app.languageLabel}</span>
      {/* React: a controlled <select>. Its value comes from state, and a change goes back through setLanguage. */}
      <select
        value={language}
        onChange={(event) => {
          if (isLanguage(event.target.value)) {
            setLanguage(event.target.value);
          }
        }}
      >
        {LANGUAGES.map((code) => (
          // React: each option needs a unique `key`; the language code is unique.
          <option key={code} value={code}>
            {LANGUAGE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
