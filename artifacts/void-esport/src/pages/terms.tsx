import { motion } from "framer-motion";
import { FileText, Calendar } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Link } from "wouter";

const sections = [
  {
    id: "01",
    title: "Acceptation des conditions",
    content: `En accédant et en utilisant les services de VOID Esport (site web, serveur Discord, comptes officiels et toute autre plateforme associée), vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.

Ces conditions s'appliquent à tous les visiteurs, membres et toute autre personne qui accède ou utilise nos services.`,
  },
  {
    id: "02",
    title: "Description des services",
    content: `VOID Esport est une organisation e-sport compétitive centrée sur Brawl Stars. Nos services comprennent :

— Un site web d'information et de présentation de l'organisation
— Un serveur Discord communautaire et compétitif
— Des comptes sur les réseaux sociaux (Discord, Twitch, YouTube, Instagram, X)
— Des events, tournois internes et opportunités de recrutement

Nous nous réservons le droit de modifier, suspendre ou interrompre tout service à tout moment et sans préavis.`,
  },
  {
    id: "03",
    title: "Propriété intellectuelle",
    content: `Tous les contenus présents sur les plateformes VOID Esport — y compris mais sans s'y limiter les logos, graphismes, textes, vidéos et noms — sont la propriété exclusive de VOID Esport ou de ses membres créateurs.

Toute reproduction, distribution, modification ou utilisation commerciale de ces contenus sans autorisation écrite préalable est strictement interdite.

Le jeu Brawl Stars est la propriété de Supercell Oy. VOID Esport n'est pas affilié, parrainé ou approuvé par Supercell.`,
  },
  {
    id: "04",
    title: "Conduite des utilisateurs",
    content: `En utilisant nos services, vous acceptez de ne pas :

— Harceler, menacer ou intimider d'autres membres
— Diffuser du contenu illégal, diffamatoire ou offensant
— Usurper l'identité d'un membre du staff ou d'un autre utilisateur
— Utiliser nos plateformes à des fins commerciales non autorisées
— Contourner les sanctions ou bannissements prononcés par le staff

Le non-respect de ces règles peut entraîner l'exclusion définitive de nos services.`,
  },
  {
    id: "05",
    title: "Limitation de responsabilité",
    content: `VOID Esport ne peut être tenu responsable de tout dommage direct ou indirect résultant de l'utilisation ou de l'impossibilité d'utiliser nos services.

Nos services sont fournis « tels quels » sans garantie d'aucune sorte. Nous ne garantissons pas la disponibilité permanente des plateformes ni l'exactitude des informations publiées.

En aucun cas la responsabilité de VOID Esport ne saurait excéder le cadre raisonnable d'une organisation e-sport non commerciale.`,
  },
  {
    id: "06",
    title: "Modifications des conditions",
    content: `Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications seront communiquées via nos canaux officiels (Discord, site web).

L'utilisation continue de nos services après publication des modifications vaut acceptation des nouvelles conditions. Il vous appartient de consulter régulièrement cette page.`,
  },
  {
    id: "07",
    title: "Contact",
    content: `Pour toute question relative aux présentes conditions d'utilisation, vous pouvez contacter le staff VOID Esport directement via le serveur Discord officiel en ouvrant un ticket dans le canal dédié.`,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } }),
};

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-20 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/20" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/20" />

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          <div className="inline-flex items-center gap-3 mb-6 border border-primary/30 bg-primary/10 px-5 py-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-orbitron text-xs tracking-[0.3em] uppercase text-primary">Documentation légale</span>
          </div>
          <h1 className="font-orbitron font-black text-5xl md:text-6xl uppercase tracking-tight mb-6">
            Conditions<br /><span className="text-primary" style={{ textShadow: "0 0 30px hsl(270 91% 65% / 0.5)" }}>d'utilisation</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Calendar className="w-4 h-4" />
            <span>Dernière mise à jour : Avril 2026</span>
          </div>
        </motion.div>
      </section>

      {/* Table of contents */}
      <section className="container mx-auto px-4 max-w-3xl pb-8">
        <div className="border border-white/5 bg-card p-6 mb-12">
          <h2 className="font-orbitron text-xs tracking-[0.25em] uppercase text-muted-foreground/60 mb-5">Sommaire</h2>
          <nav className="space-y-2">
            {sections.map((s) => (
              <a key={s.id} href={`#section-${s.id}`} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <span className="font-orbitron text-primary/50 text-xs group-hover:text-primary transition-colors">{s.id}</span>
                {s.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-10">
          {sections.map((s, i) => (
            <motion.div
              key={s.id}
              id={`section-${s.id}`}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="scroll-mt-28"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="font-orbitron text-primary/50 text-sm">{s.id}</span>
                <h2 className="font-orbitron font-bold text-lg uppercase tracking-wide text-foreground">{s.title}</h2>
              </div>
              <div className="border-l-2 border-primary/20 pl-6">
                <p className="text-muted-foreground text-sm leading-7 whitespace-pre-line">{s.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/40 font-orbitron uppercase tracking-widest"
        >
          <span>© {new Date().getFullYear()} VOID Esport</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">Politique de confidentialité</Link>
            <Link href="/rules" className="hover:text-primary transition-colors">Règles</Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
