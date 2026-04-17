import { motion } from "framer-motion";
import { FileText, Calendar } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Link } from "wouter";
import { useI18n } from "@/i18n/context";

export default function Terms() {
  const { t } = useI18n();

  const sections = [
    { id: "01", titleKey: "terms_s1Title" as const, contentKey: "terms_s1Content" as const },
    { id: "02", titleKey: "terms_s2Title" as const, contentKey: "terms_s2Content" as const },
    { id: "03", titleKey: "terms_s3Title" as const, contentKey: "terms_s3Content" as const },
    { id: "04", titleKey: "terms_s4Title" as const, contentKey: "terms_s4Content" as const },
    { id: "05", titleKey: "terms_s5Title" as const, contentKey: "terms_s5Content" as const },
    { id: "06", titleKey: "terms_s6Title" as const, contentKey: "terms_s6Content" as const },
    { id: "07", titleKey: "terms_s7Title" as const, contentKey: "terms_s7Content" as const },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-2 mb-8">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-orbitron text-xs uppercase tracking-widest text-primary">{t("terms_badge")}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black font-orbitron uppercase tracking-tight mb-6 leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{t("terms_title1")}</span>
              <br />
              <span className="text-primary text-glow">{t("terms_title2")}</span>
            </h1>

            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4" />
              <span className="font-orbitron text-xs tracking-widest">{t("terms_updated")}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="pb-24 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* TOC */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0a0a0e] border border-white/10 p-6 mb-10 clip-path-card"
            >
              <h2 className="font-orbitron font-bold text-white uppercase tracking-wider mb-4 text-sm">{t("terms_toc")}</h2>
              <ul className="space-y-2">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#section-${s.id}`} className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors text-sm group">
                      <span className="font-orbitron text-xs text-primary/50 group-hover:text-primary">{s.id}</span>
                      {t(s.titleKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Sections */}
            <div className="space-y-8">
              {sections.map((section, i) => (
                <motion.div
                  key={section.id}
                  id={`section-${section.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="bg-[#0a0a0e] border border-white/10 clip-path-card overflow-hidden"
                >
                  <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="font-orbitron font-bold text-white uppercase tracking-wide">{t(section.titleKey)}</h2>
                    <span className="font-orbitron text-4xl font-black text-white/5 select-none">{section.id}</span>
                  </div>
                  <div className="p-6">
                    {t(section.contentKey).split("\n").map((line, j) => (
                      line.trim() === ""
                        ? <div key={j} className="h-3" />
                        : <p key={j} className={`text-sm leading-relaxed ${line.startsWith("—") ? "text-muted-foreground/80 ml-4" : "text-muted-foreground"}`}>{line}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer links */}
            <div className="mt-10 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">{t("footer_privacy")}</Link>
              <span>·</span>
              <Link href="/rules" className="hover:text-primary transition-colors">{t("footer_rules")}</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
