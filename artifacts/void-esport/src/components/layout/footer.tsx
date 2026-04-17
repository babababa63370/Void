import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";
import { SiDiscord, SiX, SiYoutube, SiTwitch } from "react-icons/si";
import { Link } from "wouter";
import { useI18n } from "@/i18n/context";

export default function Footer() {
  const { t } = useI18n();

  const navItems = [
    { href: "/about", label: t("nav_about") },
    { href: "/roster", label: t("nav_roster") },
    { href: "/achievements", label: t("nav_legacy") },
    { href: "/join", label: t("nav_join") },
  ];

  const legalItems = [
    { href: "/terms", label: t("footer_terms") },
    { href: "/privacy", label: t("footer_privacy") },
    { href: "/rules", label: t("footer_rules") },
  ];

  return (
    <footer className="bg-black border-t border-white/5 pt-12 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] md:py-16 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <img src={logoPath} alt="VOID Logo" className="w-9 h-9 md:w-10 md:h-10 object-contain rounded-xl" />
              <span className="font-orbitron font-bold text-xl md:text-2xl tracking-widest text-white">VOID</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
              {t("footer_desc")}
            </p>
            <div className="flex items-center gap-3">
              <a href="https://discord.gg/gr9GTEJWWU" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-none clip-path-button bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all">
                <SiDiscord className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-none clip-path-button bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all">
                <SiX className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-none clip-path-button bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all">
                <SiYoutube className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-none clip-path-button bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all">
                <SiTwitch className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-orbitron font-semibold text-white tracking-wider mb-5 text-sm md:text-base">{t("footer_navigate")}</h4>
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wide">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-orbitron font-semibold text-white tracking-wider mb-5 text-sm md:text-base">{t("footer_legal")}</h4>
            <ul className="space-y-3">
              {legalItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wide">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 md:mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs uppercase tracking-widest text-center sm:text-left">
            © {new Date().getFullYear()} VOID ESPORTS. {t("footer_rights").toUpperCase()}.
          </p>
          <p className="text-muted-foreground/50 text-xs tracking-widest text-center sm:text-right">
            {t("footer_notAffiliated").toUpperCase()}.
          </p>
        </div>
      </div>
    </footer>
  );
}
