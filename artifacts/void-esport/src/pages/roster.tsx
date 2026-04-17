import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { SiDiscord } from "react-icons/si";
import { Crown, Crosshair, Users, UserCheck, Plus, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useI18n } from "@/i18n/context";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Player {
  discordId: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  role: string | null;
}

function avatarUrl(discordId: string, avatar: string | null, discriminator: string): string {
  if (avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.webp?size=128`;
  const idx = Number(
    discriminator === "0"
      ? (BigInt(discordId) >> 22n) % 6n
      : parseInt(discriminator) % 5,
  );
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function PlayerCard({ player, index }: { player: Player; index: number }) {
  const href = `/roster/${encodeURIComponent(player.username)}`;

  return (
    <Link href={href}>
      <motion.a
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.35, delay: index * 0.06 }}
        className="group relative bg-[#0a0a0e] border border-white/8 hover:border-primary/40 transition-all duration-300 overflow-hidden cursor-pointer block"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Mobile */}
        <div className="relative z-10 flex sm:hidden items-center gap-4 p-4">
          <div className="relative shrink-0">
            <img
              src={avatarUrl(player.discordId, player.avatar, player.discriminator)}
              alt={player.username}
              className="w-14 h-14 rounded-full border border-primary/30 object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-orbitron font-bold text-white tracking-wide text-base leading-tight truncate">
              {player.username}
            </h3>
            <span className="inline-block text-[10px] font-orbitron uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 border border-primary/20 mt-1">
              VOID
            </span>
          </div>
        </div>

        {/* Desktop */}
        <div className="relative z-10 hidden sm:block p-6">
          <div className="relative mb-5 flex justify-center">
            <img
              src={avatarUrl(player.discordId, player.avatar, player.discriminator)}
              alt={player.username}
              className="w-20 h-20 rounded-full border border-primary/30 object-cover shadow-[0_0_20px_rgba(124,58,237,0.2)]"
            />
          </div>

          <h3 className="font-orbitron font-bold text-white text-center mb-3 tracking-wide text-base truncate">
            {player.username}
          </h3>

          <div className="border-t border-white/5 pt-4">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground/40 text-[10px] font-mono">
              <SiDiscord className="w-3 h-3 text-[#5865F2]" />
              <span className="truncate max-w-[100px]">{player.discordId}</span>
            </div>
          </div>
        </div>
      </motion.a>
    </Link>
  );
}

function OpenSlotCard({ t }: { t: (k: string) => string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="group relative bg-[#0a0a0e] border border-dashed border-white/15 hover:border-primary/30 transition-all duration-300 overflow-hidden"
    >
      {/* Mobile */}
      <div className="relative z-10 flex sm:hidden items-center gap-4 p-4">
        <div className="shrink-0 w-14 h-14 border border-dashed border-white/20 flex items-center justify-center clip-path-button">
          <Plus className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <div>
          <h3 className="font-orbitron font-bold text-muted-foreground/60 tracking-wide text-base">
            {t("roster_openSlot")}
          </h3>
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest mt-1">
            {t("roster_openSlotDesc")}
          </p>
        </div>
      </div>

      {/* Desktop */}
      <div className="relative z-10 hidden sm:flex flex-col items-center justify-center p-6 min-h-[240px]">
        <div className="w-20 h-20 mx-auto border border-dashed border-white/20 flex items-center justify-center mb-5 clip-path-button">
          <Plus className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h3 className="font-orbitron font-bold text-muted-foreground/60 text-center mb-1 tracking-wide">
          {t("roster_openSlot")}
        </h3>
        <p className="text-xs text-muted-foreground/40 text-center uppercase tracking-widest">
          {t("roster_openSlotDesc")}
        </p>
      </div>
    </motion.div>
  );
}

export default function Roster() {
  const { t } = useI18n();
  usePageMeta({
    title: "Roster",
    description: "Discover VOID Esport's elite Brawl Stars rosters — Alpha, Omega & Nexus divisions. Meet the competitors at the top of the game.",
  });

  const [activeTab, setActiveTab] = useState<"alpha" | "omega" | "staff">("alpha");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { players: Player[] };
        setPlayers(data.players);
      })
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: "alpha" as const, label: t("roster_tabAlpha"), icon: <Crown className="w-4 h-4" />, sublabel: t("roster_alphaLabel") },
    { id: "omega" as const, label: t("roster_tabOmega"), icon: <Crosshair className="w-4 h-4" />, sublabel: t("roster_omegaLabel") },
    { id: "staff" as const, label: t("roster_tabStaff"), icon: <UserCheck className="w-4 h-4" />, sublabel: t("roster_staffLabel") },
  ];

  const currentRoster = players.filter((p) => p.role === activeTab);
  const showOpenSlot = !loading && currentRoster.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-28 md:pt-40 pb-12 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-2 mb-6 md:mb-8">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-orbitron text-xs uppercase tracking-widest text-primary">{t("roster_badge")}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-orbitron uppercase tracking-tight mb-4 md:mb-6 leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{t("roster_title1")}</span>
              <br />
              <span className="text-primary text-glow">{t("roster_title2")}</span>
            </h1>

            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto px-2">
              {t("roster_desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* TABS */}
      <section className="pb-0 border-b border-white/5 sticky top-16 md:top-20 z-40 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-stretch">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 sm:py-4 px-2 sm:px-4 transition-all border-b-2 min-h-[56px] ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/3"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {tab.icon}
                  <span className="font-orbitron text-xs sm:text-sm font-bold uppercase tracking-wider">{tab.label}</span>
                </div>
                <span className="hidden sm:block text-[10px] opacity-60 uppercase tracking-widest font-orbitron">{tab.sublabel}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ROSTER LIST */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Mobile */}
                <div className="flex sm:hidden flex-col gap-3">
                  {currentRoster.map((player, i) => (
                    <PlayerCard key={player.discordId} player={player} index={i} />
                  ))}
                  {showOpenSlot && <OpenSlotCard t={t} />}
                </div>

                {/* Desktop */}
                <div className={`hidden sm:grid gap-5 ${
                  activeTab === "alpha"
                    ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                    : activeTab === "staff"
                    ? "grid-cols-2 max-w-xl mx-auto"
                    : "grid-cols-2 lg:grid-cols-4"
                }`}>
                  {currentRoster.map((player, i) => (
                    <PlayerCard key={player.discordId} player={player} index={i} />
                  ))}
                  {showOpenSlot && <OpenSlotCard t={t} />}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && (
            <motion.p
              key={`count-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs font-orbitron uppercase tracking-widest text-muted-foreground/50 mt-8"
            >
              {currentRoster.length} membre{currentRoster.length !== 1 ? "s" : ""}
              {showOpenSlot && ` · 1 ${t("roster_openSlot")}`}
            </motion.p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 border-t border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto border border-white/10 bg-black/50 backdrop-blur-sm p-8 md:p-16 clip-path-card"
          >
            <h2 className="text-2xl md:text-4xl font-black font-orbitron uppercase tracking-tight mb-4">
              {t("roster_ctaTitle")}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-8">{t("roster_ctaDesc")}</p>
            <a
              href="https://discord.gg/gr9GTEJWWU"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 transition-all hover:box-glow w-full sm:w-auto"
            >
              <SiDiscord className="w-5 h-5" />
              {t("roster_ctaBtn")}
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
