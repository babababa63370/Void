import { useState, useEffect, useCallback } from "react";
import NotFound from "@/pages/not-found";
import { usePageMeta } from "@/hooks/usePageMeta";
import { motion, AnimatePresence } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { ShieldCheck, Loader2, Users, Crown, Crosshair, UserCheck, X, ChevronDown } from "lucide-react";

const ALLOWED_ID = "1243206708604702791";
const STORAGE_KEY = "void_player_session";

const ROLES = [
  { value: "alpha", label: "Alpha", icon: Crown, color: "text-violet-400 border-violet-500/40 bg-violet-500/10" },
  { value: "omega", label: "Omega", icon: Crosshair, color: "text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10" },
  { value: "staff", label: "Staff", icon: UserCheck, color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" },
] as const;

type RoleValue = "alpha" | "omega" | "staff";

interface Session {
  discordId: string;
  username: string;
  avatar: string | null;
  token: string;
}

interface Player {
  discordId: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  role: string | null;
  lastLoginAt: string;
}

type AccessState = "loading" | "granted" | "denied";

function avatarUrl(discordId: string, avatar: string | null, discriminator: string): string {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.webp?size=128`;
  }
  const idx = Number(
    discriminator === "0"
      ? (BigInt(discordId) >> 22n) % 6n
      : parseInt(discriminator) % 5,
  );
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function RoleDropdown({
  player,
  token,
  onRoleChange,
}: {
  player: Player;
  token: string;
  onRoleChange: (discordId: string, role: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentRole = ROLES.find((r) => r.value === player.role);

  async function assignRole(role: RoleValue | null) {
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch(`/api/admin/players/${player.discordId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        onRoleChange(player.discordId, role);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-orbitron uppercase tracking-wider transition-all ${
          currentRole
            ? currentRole.color
            : "text-muted-foreground/60 border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : currentRole ? (
          <currentRole.icon className="w-3 h-3" />
        ) : null}
        <span>{currentRole ? currentRole.label : "Aucun rôle"}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 z-50 bg-[#0f0f13] border border-white/10 min-w-[140px] shadow-xl"
          >
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => assignRole(r.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-orbitron uppercase tracking-wider transition-colors hover:bg-white/5 ${
                  player.role === r.value ? r.color : "text-muted-foreground"
                }`}
              >
                <r.icon className="w-3 h-3" />
                {r.label}
              </button>
            ))}
            {player.role && (
              <>
                <div className="border-t border-white/5" />
                <button
                  onClick={() => assignRole(null)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-orbitron uppercase tracking-wider text-red-400/70 hover:bg-white/5 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Retirer
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlayerRow({
  player,
  index,
  token,
  onRoleChange,
  isAdmin,
}: {
  player: Player;
  index: number;
  token: string;
  onRoleChange: (discordId: string, role: string | null) => void;
  isAdmin: boolean;
}) {
  const currentRole = ROLES.find((r) => r.value === player.role);
  const loginDate = new Date(player.lastLoginAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex items-center gap-4 p-4 border border-white/5 hover:border-white/10 bg-[#0a0a0e] transition-colors"
    >
      <img
        src={avatarUrl(player.discordId, player.avatar, player.discriminator)}
        alt={player.username}
        className="w-10 h-10 rounded-full border border-white/10 shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-orbitron font-bold text-white text-sm truncate">{player.username}</span>
          {isAdmin && (
            <span className="text-[10px] font-mono text-muted-foreground/30">{player.discordId}</span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground/40 font-mono">{loginDate}</span>
      </div>

      <div className="shrink-0">
        {isAdmin ? (
          <RoleDropdown player={player} token={token} onRoleChange={onRoleChange} />
        ) : currentRole ? (
          <span className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-orbitron uppercase tracking-wider ${currentRole.color}`}>
            <currentRole.icon className="w-3 h-3" />
            {currentRole.label}
          </span>
        ) : (
          <span className="text-xs font-orbitron uppercase tracking-wider text-muted-foreground/30">—</span>
        )}
      </div>
    </motion.div>
  );
}

export default function Meonix() {
  usePageMeta({ title: "VOID Esport", description: "" });

  const [access, setAccess] = useState<AccessState>("loading");
  const [user, setUser] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RoleValue | "all">("all");

  const loadPlayers = useCallback(async (token: string) => {
    setPlayersLoading(true);
    try {
      const res = await fetch("/api/admin/players", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { players: Player[] };
        setPlayers(data.players.reverse());
      }
    } finally {
      setPlayersLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session?.token) {
      setAccess("denied");
      return;
    }

    fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");
        const data = (await res.json()) as { discordId: string; username: string; avatar: string | null };
        if (data.discordId !== ALLOWED_ID) throw new Error("forbidden");
        setUser({ ...session, discordId: data.discordId, username: data.username, avatar: data.avatar });
        setAccess("granted");
        void loadPlayers(session.token);
      })
      .catch(() => {
        setAccess("denied");
      });
  }, [loadPlayers]);

  const handleRoleChange = useCallback((discordId: string, role: string | null) => {
    setPlayers((prev) =>
      prev.map((p) => (p.discordId === discordId ? { ...p, role } : p)),
    );
  }, []);

  if (access === "loading") {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (access === "denied") {
    return <NotFound />;
  }

  const filteredPlayers =
    activeFilter === "all" ? players : players.filter((p) => p.role === activeFilter);

  const counts = {
    all: players.length,
    alpha: players.filter((p) => p.role === "alpha").length,
    omega: players.filter((p) => p.role === "omega").length,
    staff: players.filter((p) => p.role === "staff").length,
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-10"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
            <img
              src={avatarUrl(user!.discordId, user!.avatar, "0")}
              alt={user!.username}
              className="w-16 h-16 rounded-full border-2 border-primary/60 relative z-10 shadow-[0_0_30px_rgba(124,58,237,0.4)]"
            />
            <span className="absolute bottom-0 right-0 z-20 bg-primary rounded-full p-1 border-2 border-background">
              <ShieldCheck className="w-3 h-3 text-white" />
            </span>
          </div>

          <div>
            <h1 className="font-orbitron font-black text-xl uppercase tracking-widest text-white text-glow">
              {user!.username}
            </h1>
            <div className="flex items-center gap-1.5 text-muted-foreground/50 text-xs font-mono mt-0.5">
              <SiDiscord className="w-3 h-3 text-[#5865F2]" />
              Admin · Zone Restreinte
            </div>
          </div>
        </motion.div>

        {/* Players panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-orbitron font-bold text-sm uppercase tracking-widest text-white">
                Joueurs connectés
              </h2>
            </div>
            <button
              onClick={() => void loadPlayers(user!.token)}
              disabled={playersLoading}
              className="text-xs font-orbitron uppercase tracking-wider text-muted-foreground/50 hover:text-primary transition-colors"
            >
              {playersLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Actualiser"}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {([
              { key: "all", label: "Tous", count: counts.all },
              { key: "alpha", label: "Alpha", count: counts.alpha },
              { key: "omega", label: "Omega", count: counts.omega },
              { key: "staff", label: "Staff", count: counts.staff },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-orbitron uppercase tracking-wider transition-all ${
                  activeFilter === f.key
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-white/10 bg-white/3 text-muted-foreground/60 hover:border-white/20"
                }`}
              >
                {f.label}
                <span className="opacity-60">{f.count}</span>
              </button>
            ))}
          </div>

          {/* Player list */}
          <div className="space-y-2">
            {playersLoading && players.length === 0 ? (
              <div className="flex items-center justify-center py-16 border border-white/5 bg-[#0a0a0e]">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-white/5 bg-[#0a0a0e] text-muted-foreground/40">
                <Users className="w-8 h-8 mb-3 opacity-30" />
                <p className="font-orbitron text-xs uppercase tracking-widest">
                  {activeFilter === "all" ? "Aucun joueur connecté" : `Aucun joueur ${activeFilter}`}
                </p>
              </div>
            ) : (
              filteredPlayers.map((player, i) => (
                <PlayerRow
                  key={player.discordId}
                  player={player}
                  index={i}
                  token={user!.token}
                  onRoleChange={handleRoleChange}
                  isAdmin={player.discordId !== ALLOWED_ID || true}
                />
              ))
            )}
          </div>

          <p className="text-center text-[10px] text-muted-foreground/20 font-orbitron uppercase tracking-widest mt-8">
            VOID Esport · Panel Admin
          </p>
        </motion.div>
      </div>
    </div>
  );
}
