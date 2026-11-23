// Makes the current language and its dictionary available to every component, without passing props down.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Messages } from './en';
import { DICTIONARIES, detectInitialLanguage, readSavedLanguage, saveLanguage, type Language, type PreferenceStore } from './language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Messages;
}

// React: a Context is a value that any component below its Provider can read directly,
// instead of threading it through every layer of props. Similar to a request-scoped bean
// that components look up, rather than a constructor argument passed through every class.
const LanguageContext = createContext<LanguageContextValue | null>(null);

// React: props are this component's inputs. `children` is whatever JSX is nested inside
// <LanguageProvider>...</LanguageProvider>; here, the whole app.
interface LanguageProviderProps {
  store: PreferenceStore;
  browserLanguage: string;
  children: ReactNode;
}

export function LanguageProvider({ store, browserLanguage, children }: LanguageProviderProps) {
  // React: useState keeps the current language between renders. Passing a function means
  // the initial value is computed once, on the first render only.
  const [language, setLanguage] = useState<Language>(() =>
    detectInitialLanguage(readSavedLanguage(store), browserLanguage),
  );

  // React: useEffect runs after rendering, for side effects outside React. Here: remember the
  // choice and set <html lang>, which screen readers and browser font selection use.
  // The [language, store] list means "run again whenever the language changes".
  useEffect(() => {
    saveLanguage(store, language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language, store]);

  const value: LanguageContextValue = { language, setLanguage, t: DICTIONARIES[language] };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** The current language and a way to change it (used by the language picker). */
export function useLanguage(): Pick<LanguageContextValue, 'language' | 'setLanguage'> {
  const { language, setLanguage } = useLanguageContext();
  return { language, setLanguage };
}

/** The dictionary for the current language. Every component uses this for its text: `const t = useT();` */
export function useT(): Messages {
  return useLanguageContext().t;
}

// React: hooks (functions named use...) can only be called inside components or other hooks.
// useContext reads the nearest Provider's value, and re-renders this component when it changes.
function useLanguageContext(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (value === null) {
    throw new Error('useT/useLanguage must be used inside <LanguageProvider>');
  }
  return value;
}
