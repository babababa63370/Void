import { motion } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { Flame, Shield, Users, Swords, Crown, Star, Target, Zap } from "lucide-react";
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

function GoldMeonix() {
  return (
    <span className="relative inline-block">
      <span
        className="font-orbitron font-black text-transparent bg-clip-text"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #92620a 0%, #c8870e 20%, #ffd700 40%, #fff9c4 55%, #ffd700 70%, #c8870e 85%, #92620a 100%)",
          backgroundSize: "200% auto",
          animation: "goldShimmer 2.8s linear infinite",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 12px rgba(255,215,0,0.45))",
        }}
      >
        Meonix
      </span>
    </span>
  );
}

const stats = [
  { value: "100+", labelKey: "about_stat1", icon: Users },
  { value: "3", labelKey: "about_stat2", icon: Shield },
  { value: "50+", labelKey: "about_stat3", icon: Swords },
  { value: "2024", labelKey: "about_stat4", icon: Star },
];

const values = [
  { icon: Flame, titleKey: "about_v1Title", descKey: "about_v1Desc" },
  { icon: Target, titleKey: "about_v2Title", descKey: "about_v2Desc" },
  { icon: Users, titleKey: "about_v3Title", descKey: "about_v3Desc" },
  { icon: Zap, titleKey: "about_v4Title", descKey: "about_v4Desc" },
];

export default function About() {
  const { t } = useI18n();
  usePageMeta({
    title: "About VOID",
    description: "The story behind VOID Esport. Created by Meonix, built for competition.",
  });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <style>{`
        @keyframes goldShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,100vw)] h-[min(700px,100vw)] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center py-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/30 bg-primary/10 text-primary font-orbitron text-xs tracking-[0.25em] uppercase mb-6"
          >
            <Crown className="w-3 h-3" />
            {t("about_badge")}
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-5xl sm:text-7xl md:text-8xl font-black font-orbitron tracking-tighter uppercase mb-6"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">{t("about_heroTitle1")}</span>
            <br />
            <span className="text-primary text-glow">{t("about_heroTitle2")}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-base md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed"
          >
            {t("about_heroDesc")}
          </motion.p>
        </div>
      </section>

      {/* FOUNDER SECTION */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="border border-white/10 bg-white/[0.03] p-8 md:p-12 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                <div className="flex items-center justify-center w-16 h-16 border-2 border-yellow-500/40 bg-yellow-500/10 shrink-0">
                  <Crown className="w-7 h-7 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs font-orbitron tracking-[0.3em] uppercase text-yellow-500/70 mb-1">
                    {t("about_founderBadge")}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-bold font-orbitron">
                    {t("about_founderLabel")}&nbsp;<GoldMeonix />
                  </h2>
                </div>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed text-base md:text-lg">
                <p>{t("about_founderP1")}</p>
                <p>{t("about_founderP2")}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 md:py-16 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
            {stats.map(({ value, labelKey, icon: Icon }, i) => (
              <motion.div
                key={labelKey}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.08}
                className="flex flex-col items-center justify-center py-10 px-4 bg-background text-center gap-3"
              >
                <Icon className="w-5 h-5 text-primary/60" />
                <span className="text-4xl md:text-5xl font-black font-orbitron text-white text-glow">{value}</span>
                <span className="text-xs font-orbitron tracking-widest uppercase text-muted-foreground">{t(labelKey as any)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-14"
          >
            <p className="text-xs font-orbitron tracking-[0.3em] uppercase text-primary mb-4">{t("about_storyLabel")}</p>
            <h2 className="text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              {t("about_storyTitle")}
            </h2>
          </motion.div>

          <div className="space-y-6 text-muted-foreground leading-relaxed text-base md:text-lg">
            {[1, 2, 3].map((n, i) => (
              <motion.p
                key={n}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1 + 0.1}
              >
                {t(`about_storyP${n}` as any)}
              </motion.p>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 md:py-28 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-orbitron tracking-[0.3em] uppercase text-primary mb-4">{t("about_valuesLabel")}</p>
            <h2 className="text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              {t("about_valuesTitle")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 max-w-4xl mx-auto">
            {values.map(({ icon: Icon, titleKey, descKey }, i) => (
              <motion.div
                key={titleKey}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.08}
                className="bg-background p-8 group hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 border border-primary/20 bg-primary/10 mb-5 group-hover:border-primary/40 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
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

      {/* DISCORD CTA */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,100vw)] h-[min(600px,100vw)] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-xs font-orbitron tracking-[0.3em] uppercase text-primary mb-4">{t("about_ctaLabel")}</p>
            <h2 className="text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase mb-5 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              {t("about_ctaTitle")}
            </h2>
            <p className="text-muted-foreground mb-10 text-base md:text-lg leading-relaxed">
              {t("about_ctaDesc")}
            </p>
            <a
              href="https://discord.gg/gr9GTEJWWU"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 text-base transition-all hover:box-glow"
            >
              <SiDiscord className="w-5 h-5" />
              {t("about_ctaBtn")}
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
