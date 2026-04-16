import { motion } from "framer-motion";
import { Link } from "wouter";
import { SiDiscord, SiTwitch, SiYoutube, SiInstagram } from "react-icons/si";
import { Home, Trophy, Users, Sword, ArrowLeft } from "lucide-react";
import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";

const navLinks = [
  { href: "/#about", label: "À Propos", icon: <Sword className="w-4 h-4" /> },
  { href: "/#roster", label: "Roster", icon: <Users className="w-4 h-4" /> },
  { href: "/#achievements", label: "Palmarès", icon: <Trophy className="w-4 h-4" /> },
  { href: "/#join", label: "Rejoindre", icon: <Home className="w-4 h-4" /> },
];

const socialLinks = [
  {
    href: "https://discord.gg/gr9GTEJWWU",
    label: "Discord",
    icon: <SiDiscord className="w-5 h-5" />,
  },
  {
    href: "https://twitch.tv/void_esport",
    label: "Twitch",
    icon: <SiTwitch className="w-5 h-5" />,
  },
  {
    href: "https://youtube.com/@void_esport",
    label: "YouTube",
    icon: <SiYoutube className="w-5 h-5" />,
  },
  {
    href: "https://instagram.com/void_esport",
    label: "Instagram",
    icon: <SiInstagram className="w-5 h-5" />,
  },
];

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(270 91% 65%) 1px, transparent 1px), linear-gradient(90deg, hsl(270 91% 65%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow centre */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[700px] h-[700px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, hsl(270 91% 65%) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-primary/30" />

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={logoPath}
              alt="VOID Logo"
              className="w-12 h-12 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <span className="font-orbitron font-bold text-2xl tracking-widest text-white text-glow">
              VOID
            </span>
          </Link>
        </motion.div>

        {/* Glitching 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
          className="relative mb-2 select-none"
        >
          <span
            className="font-orbitron font-black text-[clamp(6rem,20vw,13rem)] leading-none text-primary"
            style={{
              letterSpacing: "-0.04em",
              textShadow:
                "0 0 40px hsl(270 91% 65% / 0.6), 0 0 80px hsl(270 91% 65% / 0.3)",
            }}
          >
            404
          </span>

          {/* Glitch layer 1 */}
          <motion.span
            className="absolute inset-0 font-orbitron font-black text-[clamp(6rem,20vw,13rem)] leading-none text-cyan-400 opacity-0"
            style={{
              letterSpacing: "-0.04em",
              clipPath: "inset(25% 0 55% 0)",
            }}
            animate={{ opacity: [0, 0.7, 0], x: [0, -5, 0] }}
            transition={{
              duration: 0.12,
              repeat: Infinity,
              repeatDelay: 3.5,
            }}
            aria-hidden
          >
            404
          </motion.span>

          {/* Glitch layer 2 */}
          <motion.span
            className="absolute inset-0 font-orbitron font-black text-[clamp(6rem,20vw,13rem)] leading-none text-fuchsia-500 opacity-0"
            style={{
              letterSpacing: "-0.04em",
              clipPath: "inset(58% 0 18% 0)",
            }}
            animate={{ opacity: [0, 0.6, 0], x: [0, 6, 0] }}
            transition={{
              duration: 0.1,
              repeat: Infinity,
              repeatDelay: 3.5,
              delay: 0.06,
            }}
            aria-hidden
          >
            404
          </motion.span>
        </motion.div>

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 mb-6"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-orbitron text-xs font-semibold tracking-[0.25em] uppercase text-muted-foreground">
            Signal perdu — coordonnées inconnues
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="font-orbitron font-bold text-2xl sm:text-3xl tracking-widest uppercase text-foreground mb-4"
        >
          Page introuvable
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.43 }}
          className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-10 max-w-md"
        >
          La zone que tu cherches n'existe pas ou a été supprimée.
          Retourne à la base et reprends le contrôle du void.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-14"
        >
          <Link
            href="/"
            className="clip-path-button inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 transition-all hover:box-glow text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <a
            href="https://discord.gg/gr9GTEJWWU"
            target="_blank"
            rel="noopener noreferrer"
            className="clip-path-button inline-flex items-center gap-2 border border-primary/40 hover:border-primary bg-primary/10 hover:bg-primary/20 text-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 transition-all text-sm"
          >
            <SiDiscord className="w-4 h-4 text-primary" />
            Rejoindre le Discord
          </a>
        </motion.div>

        {/* Quick nav */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
          className="w-full mb-12"
        >
          <p className="font-orbitron text-xs tracking-[0.25em] uppercase text-muted-foreground/50 mb-5">
            Navigation rapide
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group flex flex-col items-center gap-2 border border-white/5 hover:border-primary/40 bg-card hover:bg-primary/5 py-5 px-3 transition-all"
              >
                <span className="text-primary group-hover:scale-110 transition-transform">
                  {link.icon}
                </span>
                <span className="font-orbitron text-xs tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors">
                  {link.label}
                </span>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.66 }}
          className="flex items-center gap-7"
        >
          {socialLinks.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {s.icon}
            </a>
          ))}
        </motion.div>

        {/* Footer line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.73 }}
          className="mt-10 font-orbitron text-xs text-muted-foreground/30 tracking-widest uppercase"
        >
          © {new Date().getFullYear()} VOID Esport — Tous droits réservés
        </motion.p>
      </div>
    </div>
  );
}
