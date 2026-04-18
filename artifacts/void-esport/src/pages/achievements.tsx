import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useI18n } from "@/i18n/context";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Achievements() {
  const { t } = useI18n();
  usePageMeta({
    title: "Palmarès — VOID Esport",
    description: "Les résultats compétitifs de VOID Esport. Tournois, classements, et palmarès.",
  });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />

      <section className="relative min-h-[80vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,100vw)] h-[min(600px,100vw)] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center justify-center w-20 h-20 border border-primary/20 bg-primary/5">
              <Trophy className="w-9 h-9 text-primary/40" />
            </div>

            <h1 className="text-4xl sm:text-6xl font-black font-orbitron tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
              {t("nav_legacy")}
            </h1>

            <p className="text-muted-foreground/60 font-orbitron text-sm tracking-[0.2em] uppercase">
              {t("achievements_empty")}
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
