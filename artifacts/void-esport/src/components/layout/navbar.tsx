import { Link } from "wouter";
import { SiDiscord } from "react-icons/si";
import { Menu, X, Globe, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";
import { useI18n, SUPPORTED_LANGS, LANG_NAMES, LANG_FLAGS, type Lang } from "@/i18n/context";

export default function Navbar() {
  const { t, lang, switchLang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/about", label: t("nav_about") },
    { href: "/roster", label: t("nav_roster") },
    { href: "/achievements", label: t("nav_legacy") },
    { href: "/join", label: t("nav_join") },
  ];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src={logoPath} alt="VOID Logo" className="w-12 h-12 object-contain rounded-xl" />
          <span className="font-orbitron font-bold text-2xl tracking-widest text-white text-glow">VOID</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 border border-white/10 hover:border-white/20 bg-white/5 text-sm font-orbitron tracking-wider uppercase"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang.toUpperCase()}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <div className="absolute top-full right-0 mt-2 bg-[#0f0f13] border border-white/10 py-1 min-w-[160px] z-50 shadow-xl">
                {SUPPORTED_LANGS.map((l: Lang) => (
                  <button
                    key={l}
                    onClick={() => { switchLang(l); setLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors text-left ${
                      l === lang ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-base">{LANG_FLAGS[l]}</span>
                    <span className="font-orbitron text-xs tracking-wider uppercase">{LANG_NAMES[l]}</span>
                    {l === lang && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            href="https://discord.gg/gr9GTEJWWU"
            target="_blank"
            rel="noopener noreferrer"
            className="clip-path-button inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 py-3 transition-all hover:box-glow"
          >
            <SiDiscord className="w-5 h-5" />
            {t("nav_enterVoid")}
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-background border-b border-white/5 p-4 flex flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {/* Mobile language switcher */}
          <div className="border-t border-white/10 pt-4 mt-2">
            <p className="text-xs font-orbitron text-muted-foreground/50 uppercase tracking-widest mb-3 px-3">
              {t("nav_language")}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {SUPPORTED_LANGS.map((l: Lang) => (
                <button
                  key={l}
                  onClick={() => { switchLang(l); setIsOpen(false); }}
                  className={`flex flex-col items-center gap-1 py-2 border transition-colors text-xs font-orbitron tracking-wider uppercase ${
                    l === lang
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-white/5 bg-white/5 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{LANG_FLAGS[l]}</span>
                  <span>{l.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <a
            href="https://discord.gg/gr9GTEJWWU"
            target="_blank"
            rel="noopener noreferrer"
            className="clip-path-button inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 py-4 mt-2"
            onClick={() => setIsOpen(false)}
          >
            <SiDiscord className="w-5 h-5" />
            {t("nav_enterVoid")}
          </a>
        </div>
      )}
    </header>
  );
}
