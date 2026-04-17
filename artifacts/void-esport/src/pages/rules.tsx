import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Ban, Gavel, Users, MessageSquare, Gamepad2, Crown } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useI18n } from "@/i18n/context";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Rules() {
  const { t } = useI18n();
  usePageMeta({
    title: "Code of Conduct",
    description: "VOID Esport rules and code of conduct. Standards and expectations for all members across every division.",
  });

  const sections = [
    {
      id: "01",
      icon: <MessageSquare className="w-6 h-6 text-primary" />,
      title: t("rules_s1Title"),
      rules: [t("rules_s1R1"), t("rules_s1R2"), t("rules_s1R3"), t("rules_s1R4"), t("rules_s1R5")],
    },
    {
      id: "02",
      icon: <Gamepad2 className="w-6 h-6 text-primary" />,
      title: t("rules_s2Title"),
      rules: [t("rules_s2R1"), t("rules_s2R2"), t("rules_s2R3"), t("rules_s2R4"), t("rules_s2R5")],
    },
    {
      id: "03",
      icon: <Users className="w-6 h-6 text-primary" />,
      title: t("rules_s3Title"),
      rules: [t("rules_s3R1"), t("rules_s3R2"), t("rules_s3R3"), t("rules_s3R4"), t("rules_s3R5")],
    },
    {
      id: "04",
      icon: <Crown className="w-6 h-6 text-primary" />,
      title: t("rules_s4Title"),
      rules: [t("rules_s4R1"), t("rules_s4R2"), t("rules_s4R3"), t("rules_s4R4"), t("rules_s4R5")],
    },
  ];

  const sanctions = [
    { level: "01", icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />, label: t("rules_s1Level"), desc: t("rules_s1LevelDesc"), color: "border-yellow-500/20 bg-yellow-500/5", textColor: "text-yellow-400" },
    { level: "02", icon: <Ban className="w-5 h-5 text-orange-400" />, label: t("rules_s2Level"), desc: t("rules_s2LevelDesc"), color: "border-orange-500/20 bg-orange-500/5", textColor: "text-orange-400" },
    { level: "03", icon: <Gavel className="w-5 h-5 text-red-400" />, label: t("rules_s3Level"), desc: t("rules_s3LevelDesc"), color: "border-red-500/20 bg-red-500/5", textColor: "text-red-400" },
    { level: "04", icon: <ShieldCheck className="w-5 h-5 text-red-600" />, label: t("rules_s4Level"), desc: t("rules_s4LevelDesc"), color: "border-red-700/20 bg-red-700/5", textColor: "text-red-500" },
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
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-orbitron text-xs uppercase tracking-widest text-primary">{t("rules_badge")}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black font-orbitron uppercase tracking-tight mb-6 leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{t("rules_title1")}</span>
              <br />
              <span className="text-primary text-glow">{t("rules_title2")}</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("rules_desc")}</p>
          </motion.div>
        </div>
      </section>

      {/* RULES SECTIONS */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="bg-[#0a0a0e] border border-white/10 clip-path-card overflow-hidden"
              >
                <div className="flex items-center gap-4 p-6 border-b border-white/5 bg-white/[0.02]">
                  {section.icon}
                  <h2 className="font-orbitron font-bold text-white uppercase tracking-wide">{section.title}</h2>
                  <span className="ml-auto font-orbitron text-4xl font-black text-white/5 select-none">{section.id}</span>
                </div>
                <ul className="p-6 space-y-4">
                  {section.rules.map((rule, j) => (
                    <li key={j} className="flex items-start gap-3 text-muted-foreground text-sm leading-relaxed">
                      <span className="font-orbitron text-xs text-primary mt-0.5 shrink-0">
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SANCTIONS */}
      <section className="py-20 border-t border-white/5 bg-black/40">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black font-orbitron uppercase tracking-tight">{t("rules_sanctionsTitle")}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {sanctions.map((sanction) => (
                <motion.div
                  key={sanction.level}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`border ${sanction.color} p-5 clip-path-card`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {sanction.icon}
                    <span className={`font-orbitron text-xs font-bold uppercase tracking-widest ${sanction.textColor}`}>
                      {t("rules_sanctionLevel")} {sanction.level}
                    </span>
                  </div>
                  <h4 className={`font-orbitron font-bold text-sm uppercase mb-2 ${sanction.textColor}`}>{sanction.label}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">{sanction.desc}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-muted-foreground/60 text-sm text-center italic border-t border-white/5 pt-6">
              {t("rules_disclaimer")}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
