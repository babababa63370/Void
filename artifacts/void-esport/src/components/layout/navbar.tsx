import { Link } from "wouter";
import { SiDiscord } from "react-icons/si";
import { Menu, X, Globe, ChevronDown, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";
import matcherinoIconPath from "@assets/matcherino-icon.png";
import { useI18n, SUPPORTED_LANGS, LANG_NAMES, LANG_FLAGS, type Lang } from "@/i18n/context";
import { useSession } from "@/hooks/useSession";

export default function Navbar() {
  const { t, lang, switchLang } = useI18n();
  const { session } = useSession();
  const isStaff = session?.roles?.includes("staff") ?? false;
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/about", label: t("nav_about") },
    { href: "/roster", label: t("nav_roster") },
    { href: "/achievements", label: t("nav_legacy") },
    { href: "/matcherino", label: t("nav_matcherino"), icon: matcherinoIconPath },
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <img src={logoPath} alt="VOID Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-xl" />
          <span className="font-orbitron font-bold text-xl md:text-2xl tracking-widest text-white text-glow">VOID</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase"
            >
              {item.icon && (
                <img src={item.icon} alt="" className="w-4 h-4 object-contain" />
              )}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {/* Staff button — only visible to staff members */}
          {isStaff && (
            <Link
              href="/staff"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 bg-cyan-500/10 hover:bg-cyan-500/15 px-3 py-2 transition-colors font-orbitron tracking-wider uppercase"
            >
              <ShieldCheck className="w-4 h-4" />
              Staff
            </Link>
          )}

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
          className="md:hidden text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Menu className="w-6 h-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-lg border-b border-white/5"
          >
            <div className="px-4 pb-6 pt-2 flex flex-col gap-1">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.05 }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 w-full px-4 py-3.5 text-base font-medium text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors tracking-wider uppercase border-b border-white/5"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon && (
                      <img src={item.icon} alt="" className="w-5 h-5 object-contain" />
                    )}
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Staff button */}
              {isStaff && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.05 + 0.05 }}
                >
                  <Link
                    href="/staff"
                    className="flex items-center gap-2 w-full px-4 py-3.5 text-base font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors tracking-wider uppercase border-b border-white/5"
                    onClick={() => setIsOpen(false)}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Staff
                  </Link>
                </motion.div>
              )}

              {/* Mobile language switcher */}
              <div className="pt-4 mt-2">
                <p className="text-xs font-orbitron text-muted-foreground/50 uppercase tracking-widest mb-3 px-4">
                  {t("nav_language")}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {SUPPORTED_LANGS.map((l: Lang) => (
                    <button
                      key={l}
                      onClick={() => { switchLang(l); setIsOpen(false); }}
                      className={`flex flex-col items-center gap-1 py-2.5 border transition-colors text-xs font-orbitron tracking-wider uppercase ${
                        l === lang
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-white/5 bg-white/5 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-lg">{LANG_FLAGS[l]}</span>
                      <span className="text-[10px]">{l.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4"
              >
                <a
                  href="https://discord.gg/gr9GTEJWWU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clip-path-button w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 py-4"
                  onClick={() => setIsOpen(false)}
                >
                  <SiDiscord className="w-5 h-5" />
                  {t("nav_enterVoid")}
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
