import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { Crown, Crosshair, UserCheck, ArrowLeft, Loader2 } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import NotFound from "@/pages/not-found";

interface PlayerData {
  discordId: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  role: string | null;
}

const ROLE_CONFIG = {
  alpha: { label: "Alpha", icon: Crown, color: "text-violet-400 border-violet-500/40 bg-violet-500/10", glow: "rgba(139,92,246,0.3)" },
  omega: { label: "Omega", icon: Crosshair, color: "text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10", glow: "rgba(217,70,239,0.3)" },
  staff: { label: "Staff", icon: UserCheck, color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10", glow: "rgba(34,211,238,0.3)" },
} as const;

function avatarUrl(discordId: string, avatar: string | null, discriminator: string): string {
  if (avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.webp?size=256`;
  const idx = Number(
    discriminator === "0"
      ? (BigInt(discordId) >> 22n) % 6n
      : parseInt(discriminator) % 5,
  );
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

export default function RosterPlayer() {
  const { username } = useParams<{ username: string }>();
  const decodedUsername = decodeURIComponent(username ?? "");

  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageMeta({
    title: player ? player.username : "Joueur",
    description: player ? `Profil de ${player.username} — VOID Esport` : "",
  });

  useEffect(() => {
    if (!decodedUsername) { setNotFound(true); setLoading(false); return; }

    fetch("/api/players")
      .then(async (res) => {
        if (!res.ok) throw new Error("api_error");
        const data = (await res.json()) as { players: PlayerData[] };
        const found = data.players.find(
          (p) => p.username.toLowerCase() === decodedUsername.toLowerCase(),
        );
        if (!found) { setNotFound(true); } else { setPlayer(found); }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [decodedUsername]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !player) return <NotFound />;

  const role = ROLE_CONFIG[player.role as keyof typeof ROLE_CONFIG];
  const RoleIcon = role?.icon;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      {role && (
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
          style={{ background: role.glow, opacity: 0.15 }}
        />
      )}

      <div className="relative z-10 container mx-auto px-4 pt-32 pb-20 max-w-xl">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10"
        >
          <Link href="/roster">
            <a className="inline-flex items-center gap-2 text-xs font-orbitron uppercase tracking-wider text-muted-foreground/50 hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour au roster
            </a>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0f0f13] border border-white/10 overflow-hidden"
        >
          {/* Avatar section */}
          <div className="relative flex flex-col items-center pt-12 pb-8 px-8 border-b border-white/5">
            <div className="relative mb-5">
              <div
                className="absolute inset-0 rounded-full blur-2xl scale-110"
                style={{ background: role?.glow ?? "rgba(124,58,237,0.3)" }}
              />
              <img
                src={avatarUrl(player.discordId, player.avatar, player.discriminator)}
                alt={player.username}
                className="w-28 h-28 rounded-full border-2 border-primary/40 relative z-10 shadow-2xl"
              />
            </div>

            <h1 className="font-orbitron font-black text-2xl sm:text-3xl uppercase tracking-widest text-white text-glow text-center mb-2">
              {player.username}
            </h1>

            <div className="flex items-center gap-1.5 text-muted-foreground/40 text-xs font-mono mb-4">
              <SiDiscord className="w-3.5 h-3.5 text-[#5865F2]" />
              {player.discordId}
            </div>

            {role && (
              <span className={`flex items-center gap-2 px-4 py-2 border text-xs font-orbitron uppercase tracking-widest ${role.color}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                Division {role.label}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="px-8 py-6 space-y-5">
            <div>
              <p className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/30 mb-1">Organisation</p>
              <p className="font-orbitron font-bold text-white uppercase tracking-wider text-sm">VOID Esport</p>
            </div>

            <div>
              <p className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/30 mb-1">Jeu</p>
              <p className="font-orbitron font-bold text-white uppercase tracking-wider text-sm">Brawl Stars</p>
            </div>

            {role && (
              <div>
                <p className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/30 mb-1">Équipe</p>
                <p className={`font-orbitron font-bold uppercase tracking-wider text-sm ${role.color.split(" ")[0]}`}>
                  VOID {role.label}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground/20 font-orbitron uppercase tracking-widest mt-8">
          VOID Esport · Profil Joueur
        </p>
      </div>

      <Footer />
    </div>
  );
}
