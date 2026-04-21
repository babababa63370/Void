import { motion } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { ChevronRight, Trophy, Crosshair, Users, Target, Zap, Shield, Crown } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";
import { useI18n } from "@/i18n/context";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Home() {
  const { t } = useI18n();
  usePageMeta({
    title: "Competitive Brawl Stars Clan",
    description:
      "VOID Esport is a competitive Brawl Stars esports clan with three divisions — Alpha, Omega, and Nexus. Tournaments, rankings, and an elite community. Embrace The Void.",
  });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-16 md:pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070')] bg-cover bg-center opacity-5 mix-blend-luminosity" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(800px,100vw)] h-[min(800px,100vw)] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 md:mb-8 relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <img
              src={logoPath}
              alt="VOID Esports"
              className="w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)] rounded-2xl"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-8xl font-black font-orbitron tracking-tighter mb-4 md:mb-6 uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 text-glow"
          >
            Embrace<br />The <span className="text-primary">Void</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-base md:text-xl text-muted-foreground max-w-2xl mb-8 md:mb-10 font-medium tracking-wide px-2"
          >
            {t("home_heroSubtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <a
              href="https://discord.gg/gr9GTEJWWU"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 sm:px-8 py-4 text-base sm:text-lg transition-all hover:box-glow-strong"
            >
              <SiDiscord className="w-5 h-5 sm:w-6 sm:h-6" />
              {t("home_heroCta")}
            </a>
            <a
              href="#about"
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground font-orbitron font-bold uppercase tracking-wider px-6 sm:px-8 py-4 text-base sm:text-lg transition-all backdrop-blur-sm"
            >
              {t("home_heroDiscover")}
              <ChevronRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-orbitron">{t("home_scroll")}</span>
          <div className="w-[1px] h-10 md:h-12 bg-gradient-to-b from-primary/50 to-transparent" />
        </motion.div>
      </section>

      {/* MANIFESTO / ABOUT */}
      <section id="about" className="py-16 md:py-32 relative bg-void-gradient border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-sm font-orbitron text-primary uppercase tracking-[0.3em] mb-4">{t("home_manifestoLabel")}</h2>
              <h3 className="text-3xl md:text-5xl font-black font-orbitron uppercase tracking-tight mb-6 md:mb-8">
                {t("home_manifestoTitle1")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{t("home_manifestoTitle2")}</span>
              </h3>
              <div className="space-y-4 md:space-y-6 text-muted-foreground text-base md:text-lg leading-relaxed">
                <p>{t("home_manifestoP1")}</p>
                <p>{t("home_manifestoP2")}</p>
              </div>
              <div className="mt-8 md:mt-10 grid grid-cols-2 gap-4 md:gap-6">
                <div className="border border-white/10 bg-black/40 p-5 md:p-6 clip-path-card hover:border-primary/50 transition-colors">
                  <Target className="w-7 h-7 md:w-8 md:h-8 text-primary mb-3 md:mb-4" />
                  <h4 className="font-orbitron font-bold text-white uppercase mb-2 text-sm md:text-base">{t("home_precisionTitle")}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">{t("home_precisionDesc")}</p>
                </div>
                <div className="border border-white/10 bg-black/40 p-5 md:p-6 clip-path-card hover:border-primary/50 transition-colors">
                  <Shield className="w-7 h-7 md:w-8 md:h-8 text-primary mb-3 md:mb-4" />
                  <h4 className="font-orbitron font-bold text-white uppercase mb-2 text-sm md:text-base">{t("home_resilienceTitle")}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">{t("home_resilienceDesc")}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square flex items-center justify-center max-w-sm mx-auto w-full md:max-w-none"
            >
              <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_20s_linear_infinite] opacity-50" />
              <div className="absolute inset-4 border border-primary/40 rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-50" />
              <div className="absolute inset-8 border border-white/10 rounded-full animate-[spin_10s_linear_infinite] opacity-50" />
              <div className="bg-black border border-white/10 p-10 md:p-12 clip-path-card relative z-10 box-glow backdrop-blur-sm">
                <img src={logoPath} alt="VOID Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.3)] rounded-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DIVISIONS */}
      <section id="roster" className="py-16 md:py-32 bg-black border-t border-white/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
            <h2 className="text-sm font-orbitron text-primary uppercase tracking-[0.3em] mb-4">{t("home_vanguardLabel")}</h2>
            <h3 className="text-3xl md:text-5xl font-black font-orbitron uppercase tracking-tight mb-4 md:mb-6">
              {t("home_vanguardTitle")}
            </h3>
            <p className="text-muted-foreground text-base md:text-lg">{t("home_vanguardDesc")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
            {[
              { icon: Crown, name: "VOID Alpha", tierKey: "home_alphaTier", descKey: "home_alphaDesc", reqKey: "home_alphaReq", focusKey: "home_alphaFocus", highlight: true },
              { icon: Crosshair, name: "VOID Omega", tierKey: "home_omegaTier", descKey: "home_omegaDesc", reqKey: "home_omegaReq", focusKey: "home_omegaFocus", highlight: false },
              { icon: Users, name: "VOID Nexus", tierKey: "home_nexusTier", descKey: "home_nexusDesc", reqKey: "home_nexusReq", focusKey: "home_nexusFocus", highlight: false },
            ].map(({ icon: Icon, name, tierKey, descKey, reqKey, focusKey, highlight }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 clip-path-card" />
                <div className="bg-[#0f0f13] border border-white/10 p-6 md:p-8 h-full clip-path-card relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:border-primary/50">
                  <Icon className={`w-10 h-10 md:w-12 md:h-12 mb-5 md:mb-6 ${highlight ? "text-primary" : "text-white"}`} />
                  <h4 className="text-xl md:text-2xl font-orbitron font-bold uppercase text-white mb-2">{name}</h4>
                  <div className={`text-xs font-orbitron tracking-widest mb-4 md:mb-6 ${highlight ? "text-primary" : "text-muted-foreground"}`}>
                    {t(tierKey as any)}
                  </div>
                  <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8">{t(descKey as any)}</p>
                  <ul className="space-y-3 border-t border-white/10 pt-5 md:pt-6">
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("home_requirement")}</span>
                      <span className="font-orbitron text-white text-xs">{t(reqKey as any)}</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("home_focus")}</span>
                      <span className="font-orbitron text-white text-xs">{t(focusKey as any)}</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS MARQUEE */}
      <section id="achievements" className="py-14 md:py-20 bg-primary/5 border-y border-white/5 overflow-hidden flex flex-col justify-center">
        <div className="container mx-auto px-4 mb-8 md:mb-12 text-center">
          <h2 className="text-sm font-orbitron text-primary uppercase tracking-[0.3em] mb-4">{t("home_legacyLabel")}</h2>
          <h3 className="text-2xl md:text-3xl font-black font-orbitron uppercase tracking-tight">{t("home_legacyTitle")}</h3>
        </div>

        <div className="relative w-full flex overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-10 md:gap-16 py-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-10 md:gap-16 shrink-0">
                <div className="flex items-center gap-3 md:gap-4 text-white/50">
                  <Trophy className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  <span className="font-orbitron text-lg md:text-2xl font-bold uppercase">{t("home_ach1")}</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4 text-white/50">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                  <span className="font-orbitron text-lg md:text-2xl font-bold uppercase">{t("home_ach2")}</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4 text-white/50">
                  <Trophy className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  <span className="font-orbitron text-lg md:text-2xl font-bold uppercase">{t("home_ach3")}</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4 text-white/50">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                  <span className="font-orbitron text-lg md:text-2xl font-bold uppercase">{t("home_ach4")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / JOIN */}
      <section id="join" className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/20 blur-[150px] pointer-events-none rounded-t-full" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto border border-white/10 bg-black/60 backdrop-blur-md p-8 sm:p-12 md:p-20 clip-path-slant"
          >
            <div className="mb-6 md:mb-8 flex justify-center">
              <img src={logoPath} alt="VOID Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain rounded-2xl" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black font-orbitron uppercase tracking-tight mb-4 md:mb-6">
              {t("home_joinTitle")} <span className="text-primary text-glow">{t("home_joinTitle2")}</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-8 md:mb-10">{t("home_joinDesc")}</p>
            <a
              href="https://discord.gg/gr9GTEJWWU"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-8 md:px-10 py-4 md:py-5 text-base md:text-xl transition-all hover:box-glow-strong w-full sm:w-auto"
            >
              <SiDiscord className="w-5 h-5 md:w-6 md:h-6" />
              {t("home_joinCta")}
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}} />
    </div>
  );
}
