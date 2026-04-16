import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Ban, Gavel, Users, MessageSquare, Gamepad2, Crown } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

const sections = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Comportement général",
    color: "text-primary",
    rules: [
      "Respecter tous les membres, quel que soit leur niveau ou leur rang.",
      "Aucune insulte, discrimination, harcèlement ou contenu haineux ne sera toléré.",
      "Les discussions doivent rester dans les salons appropriés.",
      "Les spams, flood et messages répétitifs sont interdits.",
      "Utiliser un langage correct — l'argot excessif ou les messages illisibles ne sont pas les bienvenus.",
    ],
  },
  {
    icon: <Gamepad2 className="w-6 h-6" />,
    title: "Règles en jeu",
    color: "text-primary",
    rules: [
      "Le smurfing (utilisation de comptes secondaires pour manipuler le classement) est strictement interdit.",
      "Aucun match truqué, abandon volontaire ou comportement antisportif.",
      "Les résultats de matchs doivent être reportés honnêtement et dans les délais impartis.",
      "Respecter les adversaires — pas de trash talk excessif ou de comportement toxique.",
      "Le ghosting d'un scrim ou tournoi entraîne des sanctions immédiates.",
    ],
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Membres & Recrutement",
    color: "text-primary",
    rules: [
      "Seuls les membres officiellement recrutés peuvent porter le tag VOID.",
      "Toute candidature doit passer par le processus officiel sur Discord.",
      "Les membres inactifs sans justification pendant plus de 14 jours peuvent être retirés.",
      "Le recrutement en dehors du cadre officiel est interdit.",
      "Toute violation du code de conduite peut entraîner l'exclusion définitive.",
    ],
  },
  {
    icon: <Crown className="w-6 h-6" />,
    title: "Staff & Hiérarchie",
    color: "text-accent",
    rules: [
      "Les décisions du staff sont finales et doivent être respectées.",
      "Contacter le staff uniquement via les canaux officiels prévus à cet effet.",
      "Ne pas harceler ou contourner les sanctions prononcées par le staff.",
      "Les appels de sanctions sont possibles dans un délai de 48h après la décision.",
      "Les membres du staff se réservent le droit de modifier ces règles à tout moment.",
    ],
  },
];

const sanctions = [
  { level: "01", label: "Avertissement", desc: "Première infraction mineure — rappel à l'ordre écrit.", color: "border-yellow-500/40 bg-yellow-500/5 text-yellow-400" },
  { level: "02", label: "Mute temporaire", desc: "Infraction répétée ou modérée — 24h à 7 jours.", color: "border-orange-500/40 bg-orange-500/5 text-orange-400" },
  { level: "03", label: "Kick de l'équipe", desc: "Infraction grave — exclusion immédiate du roster.", color: "border-red-500/40 bg-red-500/5 text-red-400" },
  { level: "04", label: "Ban définitif", desc: "Infraction très grave ou récidive — exclusion permanente.", color: "border-red-900/60 bg-red-900/10 text-red-600" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Rules() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-24 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/20" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/20" />

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          <div className="inline-flex items-center gap-3 mb-6 border border-primary/30 bg-primary/10 px-5 py-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-orbitron text-xs tracking-[0.3em] uppercase text-primary">Code de conduite</span>
          </div>
          <h1 className="font-orbitron font-black text-5xl md:text-7xl uppercase tracking-tight mb-6">
            Règles <span className="text-primary" style={{ textShadow: "0 0 30px hsl(270 91% 65% / 0.5)" }}>VOID</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Le Void opère selon un code strict. Ces règles garantissent un environnement compétitif sain et respectueux pour tous.
          </p>
        </motion.div>
      </section>

      {/* Rules sections */}
      <section className="py-16 container mx-auto px-4 max-w-4xl">
        <div className="space-y-12">
          {sections.map((section, si) => (
            <motion.div
              key={section.title}
              custom={si}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              className="border border-white/5 bg-card"
            >
              <div className="flex items-center gap-4 px-8 py-5 border-b border-white/5">
                <span className={section.color}>{section.icon}</span>
                <h2 className="font-orbitron font-bold text-lg uppercase tracking-widest text-foreground">
                  {section.title}
                </h2>
                <span className="ml-auto font-orbitron text-xs text-muted-foreground/40 tracking-widest">
                  §{String(si + 1).padStart(2, "0")}
                </span>
              </div>
              <ul className="px-8 py-6 space-y-4">
                {section.rules.map((rule, ri) => (
                  <li key={ri} className="flex items-start gap-4 text-muted-foreground text-sm leading-relaxed">
                    <span className="font-orbitron text-primary/60 text-xs mt-0.5 shrink-0">{String(ri + 1).padStart(2, "0")}.</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sanctions */}
      <section className="py-16 bg-black border-y border-white/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-10 flex items-center gap-4">
            <Gavel className="w-6 h-6 text-primary" />
            <h2 className="font-orbitron font-bold text-2xl uppercase tracking-widest">Sanctions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sanctions.map((s, i) => (
              <motion.div
                key={s.level}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`border p-6 ${s.color}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-orbitron text-xs tracking-widest uppercase">Niveau {s.level}</span>
                </div>
                <h3 className="font-orbitron font-bold text-white text-lg mb-2">{s.label}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex items-start gap-3 border border-primary/20 bg-primary/5 p-5"
          >
            <Ban className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Le staff se réserve le droit d'appliquer les sanctions appropriées à sa discrétion selon la gravité de chaque situation, indépendamment de l'échelle ci-dessus.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
