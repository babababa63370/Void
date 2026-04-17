import { motion } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { Crown, Crosshair, Users, AlertTriangle, ArrowRight, MessageSquare, FileText, Mic } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useI18n } from "@/i18n/context";

export default function Join() {
  const { t } = useI18n();

  const divisions = [
    {
      name: "VOID Alpha",
      tier: "TIER 1",
      icon: <Crown className="w-10 h-10 text-primary" />,
      desc: t("join_alphaDesc"),
      requirements: [t("join_alphaR1"), t("join_alphaR2"), t("join_alphaR3"), t("join_alphaR4"), t("join_alphaR5")],
      cta: t("join_alphaCta"),
      highlighted: true,
    },
    {
      name: "VOID Omega",
      tier: "TIER 2",
      icon: <Crosshair className="w-10 h-10 text-white" />,
      desc: t("join_omegaDesc"),
      requirements: [t("join_omegaR1"), t("join_omegaR2"), t("join_omegaR3"), t("join_omegaR4"), t("join_omegaR5")],
      cta: t("join_omegaCta"),
      highlighted: false,
    },
    {
      name: "VOID Nexus",
      tier: "TIER 3",
      icon: <Users className="w-10 h-10 text-white" />,
      desc: t("join_nexusDesc"),
      requirements: [t("join_nexusR1"), t("join_nexusR2"), t("join_nexusR3"), t("join_nexusR4")],
      cta: t("join_nexusCta"),
      highlighted: false,
    },
  ];

  const disqualifying = [
    t("join_disq1"), t("join_disq2"), t("join_disq3"),
    t("join_disq4"), t("join_disq5"), t("join_disq6"),
  ];

  const steps = [
    { number: "01", icon: <SiDiscord className="w-6 h-6 text-primary" />, title: t("join_step1Title"), desc: t("join_step1Desc") },
    { number: "02", icon: <FileText className="w-6 h-6 text-primary" />, title: t("join_step2Title"), desc: t("join_step2Desc") },
    { number: "03", icon: <MessageSquare className="w-6 h-6 text-primary" />, title: t("join_step3Title"), desc: t("join_step3Desc") },
    { number: "04", icon: <Mic className="w-6 h-6 text-primary" />, title: t("join_step4Title"), desc: t("join_step4Desc") },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-orbitron text-xs uppercase tracking-widest text-primary">{t("join_badge")}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black font-orbitron uppercase tracking-tight mb-6 leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{t("join_title1")}</span>
              <br />
              <span className="text-primary text-glow">{t("join_title2")}</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">{t("join_desc")}</p>

            <a
              href="https://discord.gg/gr9GTEJWWU"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 transition-all hover:box-glow"
            >
              <SiDiscord className="w-5 h-5" />
              {t("join_discordBtn")}
            </a>
          </motion.div>
        </div>
      </section>

      {/* DIVISIONS */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-sm font-orbitron text-primary uppercase tracking-[0.3em] mb-4">{t("join_divisionsLabel")}</h2>
            <h3 className="text-4xl font-black font-orbitron uppercase tracking-tight">{t("join_divisionsTitle")}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {divisions.map((div, i) => (
              <motion.div
                key={div.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative"
              >
                {div.highlighted && (
                  <div className="absolute -inset-px bg-gradient-to-b from-primary/50 to-transparent opacity-60 clip-path-card" />
                )}
                <div className={`relative bg-[#0a0a0e] border ${div.highlighted ? "border-primary/30" : "border-white/10"} p-8 h-full clip-path-card flex flex-col`}>
                  {div.highlighted && (
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                  )}
                  {div.icon}
                  <h3 className="text-2xl font-orbitron font-bold uppercase text-white mt-5 mb-1">{div.name}</h3>
                  <div className={`text-xs font-orbitron tracking-widest mb-5 ${div.highlighted ? "text-primary" : "text-muted-foreground"}`}>
                    {div.tier}
                  </div>
                  <p className="text-muted-foreground mb-8 flex-1">{div.desc}</p>

                  <div className="border-t border-white/10 pt-6 mb-8">
                    <h4 className="font-orbitron text-xs uppercase tracking-widest text-muted-foreground mb-4">{t("join_requirements")}</h4>
                    <ul className="space-y-3">
                      {div.requirements.map((req) => (
                        <li key={req} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="https://discord.gg/gr9GTEJWWU"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`clip-path-button inline-flex items-center justify-center gap-2 font-orbitron font-bold uppercase tracking-wider px-6 py-3 text-sm transition-all ${
                      div.highlighted
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:box-glow"
                        : "border border-white/20 hover:border-primary/50 bg-white/5 hover:bg-white/10 text-foreground"
                    }`}
                  >
                    <SiDiscord className="w-4 h-4" />
                    {div.cta}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DISQUALIFYING */}
      <section className="py-20 border-t border-white/5 bg-black/40">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border border-red-500/20 bg-red-500/5 p-8 md:p-10 clip-path-card"
            >
              <div className="flex items-center gap-3 mb-8">
                <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
                <h3 className="font-orbitron font-bold text-xl uppercase tracking-wider text-red-400">{t("join_disqTitle")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {disqualifying.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-24 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-sm font-orbitron text-primary uppercase tracking-[0.3em] mb-4">{t("join_processLabel")}</h2>
            <h3 className="text-4xl font-black font-orbitron uppercase tracking-tight">{t("join_processTitle")}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative bg-[#0a0a0e] border border-white/10 p-6 clip-path-card hover:border-primary/30 transition-colors"
              >
                <div className="font-orbitron text-5xl font-black text-white/5 absolute top-4 right-4 select-none">{step.number}</div>
                <div className="mb-4">{step.icon}</div>
                <h4 className="font-orbitron font-bold text-white uppercase mb-2 text-sm tracking-wide">{step.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto border border-white/10 bg-black/50 backdrop-blur-sm p-10 md:p-16 clip-path-card"
          >
            <h2 className="text-3xl md:text-4xl font-black font-orbitron uppercase tracking-tight mb-4">{t("join_ctaTitle")}</h2>
            <p className="text-muted-foreground mb-8">{t("join_ctaDesc")}</p>
            <a
              href="https://discord.gg/gr9GTEJWWU"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 transition-all hover:box-glow"
            >
              <SiDiscord className="w-5 h-5" />
              {t("join_ctaBtn")}
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
