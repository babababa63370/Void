import { motion } from "framer-motion";
import { ExternalLink, Trophy, Zap, Target, Flame } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useI18n } from "@/i18n/context";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const featureIcons = [Trophy, Target, Zap, Flame];

export default function Matcherino() {
  const { t } = useI18n();

  usePageMeta({
    title: "Matcherino — VOID Esport",
    description: t("matcherino_heroDesc"),
  });

  const features = [
    { icon: featureIcons[0], titleKey: "matcherino_f1Title", descKey: "matcherino_f1Desc" },
    { icon: featureIcons[1], titleKey: "matcherino_f2Title", descKey: "matcherino_f2Desc" },
    { icon: featureIcons[2], titleKey: "matcherino_f3Title", descKey: "matcherino_f3Desc" },
    { icon: featureIcons[3], titleKey: "matcherino_f4Title", descKey: "matcherino_f4Desc" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-red-600 selection:text-white overflow-x-hidden">
      <style>{`
        @keyframes redPulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        @keyframes redGlitch {
          0%, 90%, 100% { clip-path: none; transform: none; }
          92% { clip-path: inset(20% 0 60% 0); transform: translateX(-4px); }
          94% { clip-path: inset(60% 0 10% 0); transform: translateX(4px); }
          96% { clip-path: inset(40% 0 30% 0); transform: translateX(-2px); }
        }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,100vw)] h-[min(700px,100vw)] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(220,38,38,0.18) 0%, transparent 70%)",
            animation: "redPulse 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)" }}
        />

        <div
          className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]"
          style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(220,38,38,0.8) 2px, rgba(220,38,38,0.8) 3px)" }}
        />

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 border text-xs font-orbitron tracking-[0.25em] uppercase mb-6"
            style={{ borderColor: "rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.1)", color: "#ef4444" }}
          >
            <Flame className="w-3 h-3" />
            {t("matcherino_badge")}
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-6xl sm:text-8xl md:text-9xl font-black font-orbitron tracking-tighter uppercase mb-6"
            style={{ animation: "redGlitch 6s infinite" }}
          >
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(180deg, #ffffff 0%, #fca5a5 50%, #ef4444 100%)",
                filter: "drop-shadow(0 0 30px rgba(220,38,38,0.5))",
              }}
            >
              Matcherino
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-base md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed mb-10"
          >
            {t("matcherino_heroDesc")}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <a
              href="https://matcherino.com"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center justify-center gap-3 font-orbitron font-bold uppercase tracking-wider px-8 py-4 text-base transition-all text-white"
              style={{
                background: "linear-gradient(135deg, #dc2626, #991b1b)",
                boxShadow: "0 0 20px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 35px rgba(220,38,38,0.7), inset 0 1px 0 rgba(255,255,255,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 20px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.1)")}
            >
              <ExternalLink className="w-5 h-5" />
              {t("matcherino_heroCta")}
            </a>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* FEATURES */}
      <section className="py-20 md:py-28 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(220,38,38,0.05) 0%, transparent 70%)" }}
        />
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-orbitron tracking-[0.3em] uppercase mb-4" style={{ color: "#ef4444" }}>
              {t("matcherino_featuresLabel")}
            </p>
            <h2 className="text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              {t("matcherino_featuresTitle")}
            </h2>
          </motion.div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-px max-w-4xl mx-auto"
            style={{ background: "rgba(220,38,38,0.08)" }}
          >
            {features.map(({ icon: Icon, titleKey, descKey }, i) => (
              <motion.div
                key={titleKey}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.08}
                className="bg-background p-8 transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(220,38,38,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                <div
                  className="flex items-center justify-center w-12 h-12 mb-5 transition-colors"
                  style={{ border: "1px solid rgba(220,38,38,0.25)", background: "rgba(220,38,38,0.08)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#ef4444" }} />
                </div>
                <h3 className="font-orbitron font-bold text-sm tracking-wider uppercase text-foreground mb-2">
                  {t(titleKey as any)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(descKey as any)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,100vw)] h-[min(500px,100vw)] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "rgba(220,38,38,0.12)" }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-xs font-orbitron tracking-[0.3em] uppercase mb-4" style={{ color: "#ef4444" }}>
              {t("matcherino_ctaLabel")}
            </p>
            <h2 className="text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase mb-5 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              {t("matcherino_ctaTitle")}
            </h2>
            <p className="text-muted-foreground mb-10 text-base md:text-lg leading-relaxed">
              {t("matcherino_ctaDesc")}
            </p>
            <a
              href="https://matcherino.com"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center justify-center gap-3 font-orbitron font-bold uppercase tracking-wider px-8 py-4 text-base transition-all text-white"
              style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)", boxShadow: "0 0 25px rgba(220,38,38,0.35)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 40px rgba(220,38,38,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 25px rgba(220,38,38,0.35)")}
            >
              <ExternalLink className="w-5 h-5" />
              {t("matcherino_ctaBtn")}
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
