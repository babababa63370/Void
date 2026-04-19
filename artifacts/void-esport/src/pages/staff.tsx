import { motion } from "framer-motion";
import { ShieldCheck, Users, Crown, Crosshair, UserCheck, ExternalLink, Loader2 } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSession } from "@/hooks/useSession";
import Navbar from "@/components/layout/navbar";
import NotFound from "@/pages/not-found";

const ADMIN_DISCORD_ID = "1243206708604702791";

function avatarUrl(discordId: string, avatar: string | null): string {
  if (avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.webp?size=128`;
  const idx = Number((BigInt(discordId) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

const ROLE_CONFIG = {
  alpha: { label: "Alpha", icon: Crown, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
  omega: { label: "Omega", icon: Crosshair, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/30" },
  staff: { label: "Staff", icon: UserCheck, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
} as const;

const QUICK_LINKS = [
  { href: "/roster", label: "Roster", description: "Voir l'équipe", icon: Users },
  { href: "/players-login", label: "Mon profil", description: "Gérer ton profil joueur", icon: UserCheck },
];

export default function Staff() {
  usePageMeta({ title: "Espace Staff — VOID Esport", description: "Zone réservée au staff VOID Esport" });

  const { session, loading } = useSession();
  const isStaff = session?.roles?.includes("staff") ?? false;
  const isAdmin = session?.discordId === ADMIN_DISCORD_ID;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!session || !isStaff) {
    return <NotFound />;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20 pb-12 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-10 pt-8"
          >
            <div className="relative">
              <img
                src={avatarUrl(session.discordId, session.avatar)}
                alt={session.username}
                className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500/40"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="font-orbitron font-black text-xl uppercase tracking-widest text-white">
                {session.username}
              </h1>
              <div className="flex items-center gap-1.5 text-cyan-400/70 text-xs font-orbitron mt-1 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                Espace Staff
              </div>
            </div>
          </motion.div>

          {/* Roles */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest mb-3">
              Tes rôles
            </p>
            <div className="flex flex-wrap gap-2">
              {(session.roles ?? []).map((role) => {
                const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
                if (!cfg) return null;
                const Icon = cfg.icon;
                return (
                  <span
                    key={role}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-orbitron uppercase tracking-wider ${cfg.color} ${cfg.bg}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </span>
                );
              })}
            </div>
          </motion.div>

          {/* Admin panel link — only for the admin */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 p-4 border border-violet-500/20 bg-violet-500/5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-orbitron font-bold text-sm uppercase tracking-wider text-violet-400">
                    Panel Admin
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gérer les rôles et les joueurs
                  </p>
                </div>
                <a
                  href="/meonix"
                  className="inline-flex items-center gap-1.5 text-xs font-orbitron uppercase tracking-wider text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-400/50 bg-violet-500/10 hover:bg-violet-500/15 px-3 py-2 transition-colors"
                >
                  Ouvrir
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest mb-3">
              Accès rapide
            </p>
            <div className="grid gap-3">
              {QUICK_LINKS.map(({ href, label, description, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center border border-white/10 bg-white/5 group-hover:border-primary/30 group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-orbitron font-bold text-sm uppercase tracking-wider text-white">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Discord badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-10 flex items-center gap-2 text-muted-foreground/30 text-xs font-mono"
          >
            <SiDiscord className="w-3.5 h-3.5 text-[#5865F2]" />
            {session.discordId}
          </motion.div>
        </div>
      </div>
    </>
  );
}
