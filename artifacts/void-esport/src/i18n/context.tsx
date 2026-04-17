import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import en, { Translations } from "./locales/en";
import fr from "./locales/fr";
import es from "./locales/es";
import de from "./locales/de";
import pt from "./locales/pt";

export type Lang = "en" | "fr" | "es" | "de" | "pt";

export const SUPPORTED_LANGS: Lang[] = ["en", "fr", "es", "de", "pt"];
export const NON_EN_LANGS: Lang[] = ["fr", "es", "de", "pt"];

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  pt: "Português",
};

export const LANG_FLAGS: Record<Lang, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  es: "🇪🇸",
  de: "🇩🇪",
  pt: "🇧🇷",
};

const COUNTRY_LANG: Record<string, Lang> = {
  FR: "fr", BE: "fr", CH: "fr", LU: "fr", MC: "fr", CI: "fr", SN: "fr", MA: "fr", TN: "fr", DZ: "fr",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es", BO: "es", PY: "es", UY: "es",
  DE: "de", AT: "de", LI: "de",
  BR: "pt", PT: "pt", AO: "pt", MZ: "pt",
};

const allTranslations: Record<Lang, Translations> = { en, fr, es, de, pt };

interface I18nContextType {
  lang: Lang;
  t: (key: keyof Translations) => string;
  switchLang: (lang: Lang) => void;
  langPrefix: string;
  path: (route: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function detectLangFromUrl(): Lang | null {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const pathname = window.location.pathname;
  const relative = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const first = relative.split("/").filter(Boolean)[0];
  if (first && NON_EN_LANGS.includes(first as Lang)) return first as Lang;
  return null;
}

function getCurrentRoute(currentLang: Lang): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const pathname = window.location.pathname;
  let rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  if (currentLang !== "en" && rel.startsWith(`/${currentLang}`)) {
    rel = rel.slice(`/${currentLang}`.length);
  }
  return rel || "/";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return detectLangFromUrl() ?? (localStorage.getItem("void_lang") as Lang | null) ?? "en";
  });

  const langPrefix = lang !== "en" ? `/${lang}` : "";
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  const path = useCallback(
    (route: string) => `${base}${langPrefix}${route}`,
    [base, langPrefix]
  );

  const switchLang = useCallback(
    (newLang: Lang) => {
      const route = getCurrentRoute(lang);
      localStorage.setItem("void_lang", newLang);
      const newBase = newLang !== "en" ? `${base}/${newLang}` : base;
      window.location.href = `${newBase}${route}`;
    },
    [lang, base]
  );

  const t = useCallback(
    (key: keyof Translations): string => {
      return (allTranslations[lang] as Record<string, string>)[key as string]
        ?? (allTranslations.en as Record<string, string>)[key as string]
        ?? String(key);
    },
    [lang]
  );

  // IP-based language detection on first visit
  useEffect(() => {
    const urlLang = detectLangFromUrl();
    const storedLang = localStorage.getItem("void_lang");

    // If already on a lang URL or already has a stored preference, skip IP detection
    if (urlLang || storedLang) return;

    fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) })
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        const detected = data.country_code ? COUNTRY_LANG[data.country_code] : undefined;
        if (detected && detected !== "en") {
          localStorage.setItem("void_lang", detected);
          window.location.href = `${base}/${detected}/`;
        }
      })
      .catch(() => {
        // Fallback: check browser language
        const browserLang = navigator.language.split("-")[0] as Lang;
        if (SUPPORTED_LANGS.includes(browserLang) && browserLang !== "en") {
          localStorage.setItem("void_lang", browserLang);
          window.location.href = `${base}/${browserLang}/`;
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <I18nContext.Provider value={{ lang, t, switchLang, langPrefix, path }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
