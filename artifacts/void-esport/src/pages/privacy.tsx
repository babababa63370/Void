import { motion } from "framer-motion";
import { Lock, Calendar, Eye, Database, Share2, Shield, Mail } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Link } from "wouter";

const sections = [
  {
    id: "01",
    icon: <Eye className="w-5 h-5" />,
    title: "Données collectées",
    content: `Lorsque vous interagissez avec les plateformes VOID Esport, nous pouvons collecter les informations suivantes :

Données fournies volontairement :
— Pseudo Discord, identifiant utilisateur et rang de jeu lors d'une candidature
— Messages et contenus partagés dans nos canaux Discord
— Informations de contact en cas de ticket ou de prise de contact directe

Données collectées automatiquement :
— Statistiques d'utilisation anonymes du site web (pages vues, durée de visite)
— Adresse IP pour des raisons de sécurité et de modération

Nous ne collectons jamais d'informations bancaires, de données sensibles ou de données personnelles au-delà de ce qui est strictement nécessaire au fonctionnement de l'organisation.`,
  },
  {
    id: "02",
    icon: <Database className="w-5 h-5" />,
    title: "Utilisation des données",
    content: `Les données collectées sont utilisées exclusivement pour :

— Gérer les candidatures et le processus de recrutement
— Assurer la modération et la sécurité de la communauté
— Communiquer avec les membres et candidats concernant leur statut
— Améliorer l'expérience utilisateur sur nos plateformes
— Prévenir les abus et faire respecter nos règles internes

Nous n'utilisons pas vos données à des fins publicitaires ni ne procédons à un profilage commercial.`,
  },
  {
    id: "03",
    icon: <Share2 className="w-5 h-5" />,
    title: "Partage des données",
    content: `VOID Esport ne vend, ne loue et ne partage pas vos données personnelles avec des tiers à des fins commerciales.

Des données peuvent être partagées uniquement dans les cas suivants :
— Avec les membres du staff pour les besoins de modération
— Si requis par la loi ou une autorité compétente
— En cas de fusion ou restructuration de l'organisation (les utilisateurs en seront informés)

Nos plateformes tierces (Discord, Twitch, YouTube, etc.) sont soumises à leurs propres politiques de confidentialité. Nous vous encourageons à les consulter.`,
  },
  {
    id: "04",
    icon: <Shield className="w-5 h-5" />,
    title: "Sécurité des données",
    content: `Nous mettons en œuvre des mesures de sécurité raisonnables pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.

Ces mesures incluent :
— Restriction de l'accès aux données personnelles au seul staff autorisé
— Utilisation de plateformes conformes aux standards de sécurité modernes
— Suppression régulière des données obsolètes ou inutiles

Cependant, aucun système de sécurité n'est infaillible. En cas de violation de données, nous nous engageons à vous en informer dans les meilleurs délais.`,
  },
  {
    id: "05",
    icon: <Eye className="w-5 h-5" />,
    title: "Vos droits",
    content: `Conformément aux réglementations applicables en matière de protection des données, vous disposez des droits suivants :

— Droit d'accès : obtenir une copie des données vous concernant
— Droit de rectification : corriger des données inexactes
— Droit à l'effacement : demander la suppression de vos données
— Droit d'opposition : vous opposer à certains traitements de données

Pour exercer ces droits, contactez le staff via un ticket Discord. Nous traiterons votre demande dans un délai raisonnable.`,
  },
  {
    id: "06",
    icon: <Database className="w-5 h-5" />,
    title: "Conservation des données",
    content: `Les données personnelles sont conservées aussi longtemps que nécessaire pour les finalités pour lesquelles elles ont été collectées, à savoir :

— Données de candidature : 6 mois après la décision finale
— Données de modération : 1 an (ou plus en cas d'infraction grave)
— Données de contact : jusqu'à demande de suppression

Passé ces délais, les données sont supprimées ou anonymisées de manière irréversible.`,
  },
  {
    id: "07",
    icon: <Mail className="w-5 h-5" />,
    title: "Contact & réclamations",
    content: `Pour toute question, demande ou réclamation relative à cette politique de confidentialité, contactez-nous via le serveur Discord officiel en ouvrant un ticket dans le canal #support.

Nous nous engageons à traiter votre demande dans un délai de 7 jours ouvrés.

Cette politique peut être mise à jour périodiquement. La date de dernière mise à jour est indiquée en haut de cette page.`,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } }),
};

export default function Privacy() {
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
            <Lock className="w-4 h-4 text-primary" />
            <span className="font-orbitron text-xs tracking-[0.3em] uppercase text-primary">Protection des données</span>
          </div>
          <h1 className="font-orbitron font-black text-5xl md:text-6xl uppercase tracking-tight mb-6">
            Politique de<br /><span className="text-primary" style={{ textShadow: "0 0 30px hsl(270 91% 65% / 0.5)" }}>Confidentialité</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Calendar className="w-4 h-4" />
            <span>Dernière mise à jour : Avril 2026</span>
          </div>
        </motion.div>
      </section>

      {/* Intro block */}
      <section className="container mx-auto px-4 max-w-3xl pb-4">
        <div className="border border-primary/20 bg-primary/5 p-6 mb-12">
          <p className="text-sm text-muted-foreground leading-7">
            VOID Esport prend la protection de vos données personnelles au sérieux. Cette politique explique quelles données nous collectons, comment nous les utilisons et quels sont vos droits. Elle s'applique à toutes nos plateformes : site web, serveur Discord et comptes officiels sur les réseaux sociaux.
          </p>
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
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-primary">{s.icon}</span>
                <div className="flex items-center gap-3">
                  <span className="font-orbitron text-primary/50 text-xs">{s.id}</span>
                  <h2 className="font-orbitron font-bold text-lg uppercase tracking-wide text-foreground">{s.title}</h2>
                </div>
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
            <Link href="/terms" className="hover:text-primary transition-colors">CGU</Link>
            <Link href="/rules" className="hover:text-primary transition-colors">Règles</Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
