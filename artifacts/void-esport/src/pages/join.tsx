import { motion } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { Crown, Crosshair, Users, CheckCircle2, XCircle, ChevronRight, Zap } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";

const divisions = [
  {
    icon: <Crown className="w-8 h-8" />,
    name: "VOID Alpha",
    tier: "Tier 1 · Esports",
    description: "Le roster compétitif principal. Participation aux tournois majeurs et scrims de haut niveau.",
    requirements: [
      "Rang Masters minimum",
      "Disponibilité pour les tournois officiels",
      "Microphone obligatoire",
      "Maîtrise d'au moins 6 brawlers méta",
      "Expérience en compétition organisée",
    ],
    cta: "Candidater Alpha",
    accent: "border-primary/50 hover:border-primary",
    badge: "text-primary",
  },
  {
    icon: <Crosshair className="w-8 h-8" />,
    name: "VOID Omega",
    tier: "Tier 2 · Academy",
    description: "La filière développement. Pour les joueurs à fort potentiel qui visent le roster Alpha.",
    requirements: [
      "Rang Legendary III minimum",
      "Motivation et régularité aux scrims",
      "Esprit d'équipe et communication",
      "Microphone recommandé",
      "Volonté de progresser et d'être coaché",
    ],
    cta: "Candidater Omega",
    accent: "border-white/10 hover:border-white/30",
    badge: "text-muted-foreground",
  },
  {
    icon: <Users className="w-8 h-8" />,
    name: "VOID Nexus",
    tier: "Tier 3 · Communauté",
    description: "La communauté active. Rejoins des joueurs passionnés et participe aux events internes.",
    requirements: [
      "Rang Mythic minimum",
      "Actif sur le serveur Discord",
      "Comportement respectueux",
      "Participation aux events communautaires",
    ],
    cta: "Candidater Nexus",
    accent: "border-white/5 hover:border-white/20",
    badge: "text-muted-foreground/60",
  },
];

const steps = [
  { n: "01", title: "Rejoindre le Discord", desc: "Clique sur le bouton ci-dessous pour accéder au serveur officiel VOID." },
  { n: "02", title: "Lire les conditions", desc: "Consulte le canal #règles et #exigences pour vérifier ton éligibilité." },
  { n: "03", title: "Ouvrir un ticket", desc: "Crée un ticket de candidature dans le canal dédié avec tes stats." },
  { n: "04", title: "Entretien & tryout", desc: "Un membre du staff t'contactera pour organiser un tryout." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function Join() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-28 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=2070')] bg-cover bg-center opacity-5 mix-blend-luminosity" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 flex flex-col items-center">
          <div className="mb-8">
            <img src={logoPath} alt="VOID Logo" className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] rounded-2xl" />
          </div>
          <div className="inline-flex items-center gap-3 mb-6 border border-primary/30 bg-primary/10 px-5 py-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-orbitron text-xs tracking-[0.3em] uppercase text-primary">Recrutement ouvert</span>
          </div>
          <h1 className="font-orbitron font-black text-5xl md:text-7xl uppercase tracking-tight mb-6">
            Intègre<br />le <span className="text-primary" style={{ textShadow: "0 0 30px hsl(270 91% 65% / 0.5)" }}>Void</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Trois divisions. Un seul objectif : l'excellence. Trouve ta place dans la hiérarchie VOID et prouve ta valeur.
          </p>
          <a
            href="https://discord.gg/gr9GTEJWWU"
            target="_blank"
            rel="noopener noreferrer"
            className="clip-path-button inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-10 py-5 text-lg transition-all hover:box-glow"
          >
            <SiDiscord className="w-6 h-6" />
            Rejoindre le Discord
          </a>
        </motion.div>
      </section>

      {/* Divisions */}
      <section className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-orbitron text-xs tracking-[0.3em] uppercase text-primary mb-4">Les divisions</h2>
            <h3 className="font-orbitron font-black text-3xl md:text-4xl uppercase">Choisis ton tier</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {divisions.map((div, i) => (
              <motion.div
                key={div.name}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`group border ${div.accent} bg-card flex flex-col transition-all duration-300`}
              >
                <div className="p-8 border-b border-white/5">
                  <div className={`mb-4 ${div.badge}`}>{div.icon}</div>
                  <h3 className="font-orbitron font-bold text-xl text-white mb-1">{div.name}</h3>
                  <div className={`font-orbitron text-xs tracking-widest uppercase mb-4 ${div.badge}`}>{div.tier}</div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{div.description}</p>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h4 className="font-orbitron text-xs tracking-widest uppercase text-muted-foreground/60 mb-4">Exigences</h4>
                  <ul className="space-y-3 mb-8 flex-1">
                    {div.requirements.map((req, ri) => (
                      <li key={ri} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="https://discord.gg/gr9GTEJWWU"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="clip-path-button inline-flex items-center justify-center gap-2 border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/15 text-foreground font-orbitron font-bold uppercase tracking-wider px-6 py-3 text-sm transition-all w-full"
                  >
                    {div.cta}
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disqualifying criteria */}
      <section className="py-16 border-t border-white/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="border border-red-500/20 bg-red-500/5 p-8">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-5 h-5 text-red-400" />
              <h3 className="font-orbitron font-bold uppercase tracking-widest text-red-400">Critères disqualifiants</h3>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Historique de toxicité avérée",
                "Comptes bannis par Supercell",
                "Smurfing documenté",
                "Abandon de teams précédentes sans justification",
                "Mensonge sur les stats ou le rang",
                "Refus de respecter le code de conduite VOID",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <XCircle className="w-4 h-4 text-red-500/60 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-black border-t border-white/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="font-orbitron text-xs tracking-[0.3em] uppercase text-primary mb-4">Processus</h2>
            <h3 className="font-orbitron font-black text-3xl uppercase">Comment postuler ?</h3>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent hidden sm:block" />
            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.n}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="sm:pl-20 relative"
                >
                  <div className="absolute left-0 top-0 w-16 h-16 hidden sm:flex items-center justify-center border border-primary/40 bg-card font-orbitron font-black text-primary text-xl">
                    {step.n}
                  </div>
                  <div className="border border-white/5 bg-card p-6">
                    <div className="sm:hidden font-orbitron text-primary text-sm mb-2">{step.n}</div>
                    <h4 className="font-orbitron font-bold text-white uppercase tracking-wide mb-2">{step.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-white/5 flex flex-col items-center text-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="font-orbitron font-black text-3xl md:text-5xl uppercase mb-6">
            Prêt à entrer dans le <span className="text-primary">Void</span> ?
          </h2>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto">
            Le recrutement se fait exclusivement via Discord. Rejoins-nous dès maintenant.
          </p>
          <a
            href="https://discord.gg/gr9GTEJWWU"
            target="_blank"
            rel="noopener noreferrer"
            className="clip-path-button inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-10 py-5 text-lg transition-all hover:box-glow"
          >
            <SiDiscord className="w-6 h-6" />
            Rejoindre le Discord
          </a>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
