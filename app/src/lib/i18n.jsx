import { setFmtLocale } from './data';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// English / French switch. Usage: const { L } = useLang(); L('English', 'Français').
// Data files carry optional French fields with a `_fr` suffix: pick(obj, 'why') returns obj.why_fr in French.
const LangCtx = createContext({ lang: 'en', setLang: () => {}, L: (en) => en, pick: (o, k) => o?.[k] });

function initialLang() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'fr' || q === 'en') return q;
    const saved = window.localStorage.getItem('fs-lang');
    if (saved === 'fr' || saved === 'en') return saved;
  } catch { /* storage blocked */ }
  return 'en';
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initialLang);
  setFmtLocale(lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { window.localStorage.setItem('fs-lang', lang); } catch { /* storage blocked */ }
  }, [lang]);
  const L = useCallback((en, fr) => (lang === 'fr' && fr != null ? fr : en), [lang]);
  const pick = useCallback((o, k) => (lang === 'fr' && o?.[`${k}_fr`] != null ? o[`${k}_fr`] : o?.[k]), [lang]);
  const value = useMemo(() => ({ lang, setLang, L, pick }), [lang, L, pick]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label="Language / Langue">
      {['en', 'fr'].map((l) => (
        <button key={l} className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
