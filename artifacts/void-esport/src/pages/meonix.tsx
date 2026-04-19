import { useState, useEffect, useCallback, useRef } from "react";
import NotFound from "@/pages/not-found";
import { usePageMeta } from "@/hooks/usePageMeta";
import { motion, AnimatePresence } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import {
  ShieldCheck,
  Loader2,
  Users,
  Crown,
  Crosshair,
  UserCheck,
  X,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const ALLOWED_ID = "1243206708604702791";
const STORAGE_KEY = "void_player_session";

const ROLES = [
  { value: "alpha", label: "Alpha", icon: Crown, color: "text-violet-400 border-violet-500/40 bg-violet-500/10", pill: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { value: "omega", label: "Omega", icon: Crosshair, color: "text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10", pill: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30" },
  { value: "staff", label: "Staff", icon: UserCheck, color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10", pill: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
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
  roles: string[];
  lastLoginAt: string;
}

type AccessState = "loading" | "granted" | "denied";

function avatarUrl(discordId: string, avatar: string | null, discriminator: string): string {
  if (avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.webp?size=128`;
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

function RoleSheet({
  player,
  token,
  onRolesChange,
  onClose,
}: {
  player: Player;
  token: string;
  onRolesChange: (discordId: string, roles: string[]) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [localRoles, setLocalRoles] = useState<string[]>(player.roles ?? []);

  async function toggleRole(role: RoleValue) {
    setLoading(role);
    const next = localRoles.includes(role)
      ? localRoles.filter((r) => r !== role)
      : [...localRoles, role];
    try {
      const res = await fetch(`/api/admin/players/${player.discordId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roles: next }),
      });
      if (res.ok) {
        setLocalRoles(next);
        onRolesChange(player.discordId, next);
      }
    } finally {
      setLoading(null);
    }
  }

  async function clearRoles() {
    setLoading("clear");
    try {
      const res = await fetch(`/api/admin/players/${player.discordId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roles: [] }),
      });
      if (res.ok) {
        setLocalRoles([]);
        onRolesChange(player.discordId, []);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="relative z-10 bg-[#0d0d12] border-t border-white/10 rounded-t-2xl overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Player info */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-5 border-b border-white/5">
          <img
            src={avatarUrl(player.discordId, player.avatar, player.discriminator)}
            alt={player.username}
            className="w-11 h-11 rounded-full border border-white/10 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-orbitron font-bold text-white text-sm truncate">{player.username}</p>
            <p className="text-[11px] font-mono text-muted-foreground/40 truncate">{player.discordId}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role options */}
        <div className="px-4 py-3 space-y-2">
          <p className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/40 px-1 pb-1">
            Rôles — plusieurs possibles
          </p>

          {ROLES.map((r) => {
            const isActive = localRoles.includes(r.value);
            const isLoading = loading === r.value;
            return (
              <button
                key={r.value}
                onClick={() => void toggleRole(r.value)}
                disabled={!!loading}
                className={`w-full flex items-center gap-4 px-4 py-4 border transition-all active:scale-[0.98] ${
                  isActive
                    ? r.color
                    : "border-white/8 bg-white/3 text-muted-foreground hover:bg-white/6"
                }`}
              >
                <div className={`w-9 h-9 flex items-center justify-center rounded-full border ${
                  isActive ? r.color : "border-white/10 bg-white/5"
                }`}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <r.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="font-orbitron font-bold text-sm uppercase tracking-wider">{r.label}</span>
                {isActive && (
                  <span className="ml-auto text-[10px] font-orbitron uppercase tracking-widest opacity-60">
                    ✓ Actif
                  </span>
                )}
              </button>
            );
          })}

          {localRoles.length > 0 && (
            <button
              onClick={() => void clearRoles()}
              disabled={!!loading}
              className="w-full flex items-center gap-4 px-4 py-4 border border-red-500/20 bg-red-500/5 text-red-400/70 transition-all active:scale-[0.98]"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                {loading === "clear" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </div>
              <span className="font-orbitron font-bold text-sm uppercase tracking-wider">Retirer tous les rôles</span>
            </button>
          )}
        </div>

        {/* iOS safe area */}
        <div className="h-[env(safe-area-inset-bottom,16px)]" />
      </motion.div>
    </motion.div>
  );
}

function PlayerRow({
  player,
  index,
  onTap,
}: {
  player: Player;
  index: number;
  onTap: (player: Player) => void;
}) {
  const activeRoles = ROLES.filter((r) => (player.roles ?? []).includes(r.value));
  const loginDate = new Date(player.lastLoginAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      onClick={() => onTap(player)}
      className="w-full flex items-center gap-3 p-4 border border-white/5 bg-[#0a0a0e] active:bg-white/5 transition-colors text-left"
    >
      {/* Avatar */}
      <img
        src={avatarUrl(player.discordId, player.avatar, player.discriminator)}
        alt={player.username}
        className="w-11 h-11 rounded-full border border-white/10 shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-orbitron font-bold text-white text-sm truncate leading-tight">
          {player.username}
        </p>
        <p className="text-[11px] text-muted-foreground/40 font-mono mt-0.5">{loginDate}</p>
      </div>

      {/* Role badges + chevron */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end max-w-[140px]">
        {activeRoles.length > 0 ? (
          activeRoles.map((r) => (
            <span key={r.value} className={`flex items-center gap-1 px-2 py-1 border text-[10px] font-orbitron uppercase tracking-wider rounded-sm ${r.pill}`}>
              <r.icon className="w-2.5 h-2.5" />
              {r.label}
            </span>
          ))
        ) : (
          <span className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/25">
            —
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground/20" />
      </div>
    </motion.button>
  );
}

export default function Meonix() {
  usePageMeta({ title: "VOID Esport", description: "" });

  const [access, setAccess] = useState<AccessState>("loading");
  const [user, setUser] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RoleValue | "all">("all");
  const [sheetPlayer, setSheetPlayer] = useState<Player | null>(null);
  const filterScrollRef = useRef<HTMLDivElement>(null);

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
    if (!session?.token) { setAccess("denied"); return; }

    fetch("/api/auth/verify", { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");
        const data = (await res.json()) as { discordId: string; username: string; avatar: string | null };
        if (data.discordId !== ALLOWED_ID) throw new Error("forbidden");
        setUser({ ...session, discordId: data.discordId, username: data.username, avatar: data.avatar });
        setAccess("granted");
        void loadPlayers(session.token);
      })
      .catch(() => setAccess("denied"));
  }, [loadPlayers]);

  const handleRolesChange = useCallback((discordId: string, roles: string[]) => {
    setPlayers((prev) => prev.map((p) => (p.discordId === discordId ? { ...p, roles } : p)));
    setSheetPlayer((prev) => (prev?.discordId === discordId ? { ...prev, roles } : prev));
  }, []);

  if (access === "loading") {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (access === "denied") return <NotFound />;

  const counts = {
    all: players.length,
    alpha: players.filter((p) => (p.roles ?? []).includes("alpha")).length,
    omega: players.filter((p) => (p.roles ?? []).includes("omega")).length,
    staff: players.filter((p) => (p.roles ?? []).includes("staff")).length,
  };

  const filteredPlayers =
    activeFilter === "all" ? players : players.filter((p) => (p.roles ?? []).includes(activeFilter));

  const filterTabs = [
    { key: "all" as const, label: "Tous", count: counts.all },
    { key: "alpha" as const, label: "Alpha", count: counts.alpha },
    { key: "omega" as const, label: "Omega", count: counts.omega },
    { key: "staff" as const, label: "Staff", count: counts.staff },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-[100dvh]">

        {/* ── Back ── */}
        <div className="px-4 pt-6">
          <a href="/" className="inline-flex items-center gap-2 text-xs font-orbitron uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </a>
        </div>

        {/* ── Header ── */}
        <div className="px-4 pt-12 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-4"
          >
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
              <img
                src={avatarUrl(user!.discordId, user!.avatar, "0")}
                alt={user!.username}
                className="w-14 h-14 rounded-full border-2 border-primary/60 relative z-10"
              />
              <span className="absolute -bottom-0.5 -right-0.5 z-20 bg-primary rounded-full p-1 border-2 border-background">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-orbitron font-black text-lg uppercase tracking-widest text-white truncate">
                {user!.username}
              </h1>
              <div className="flex items-center gap-1.5 text-muted-foreground/50 text-[11px] font-mono mt-0.5">
                <SiDiscord className="w-3 h-3 text-[#5865F2] shrink-0" />
                Admin · Zone Restreinte
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Panel title + refresh ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="px-4 flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="font-orbitron font-bold text-xs uppercase tracking-widest text-white">
              Joueurs connectés
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/40">({counts.all})</span>
          </div>

          <button
            onClick={() => void loadPlayers(user!.token)}
            disabled={playersLoading}
            className="flex items-center gap-1.5 text-[11px] font-orbitron uppercase tracking-wider text-muted-foreground/50 active:text-primary transition-colors py-2 pl-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${playersLoading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </motion.div>

        {/* ── Filter tabs (horizontal scroll) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          ref={filterScrollRef}
          className="px-4 flex gap-2 overflow-x-auto pb-3 no-scrollbar"
        >
          {filterTabs.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 border text-[11px] font-orbitron uppercase tracking-wider transition-all active:scale-95 ${
                activeFilter === f.key
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/3 text-muted-foreground/60"
              }`}
            >
              {f.label}
              <span className="opacity-50 text-[10px]">{f.count}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Player list ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex-1 px-4 space-y-2 pb-8"
        >
          {playersLoading && players.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-white/5 bg-[#0a0a0e]">
              <Users className="w-8 h-8 mb-3 text-muted-foreground/20" />
              <p className="font-orbitron text-[11px] uppercase tracking-widest text-muted-foreground/30">
                {activeFilter === "all" ? "Aucun joueur" : `Aucun joueur ${activeFilter}`}
              </p>
            </div>
          ) : (
            filteredPlayers.map((player, i) => (
              <PlayerRow
                key={player.discordId}
                player={player}
                index={i}
                onTap={setSheetPlayer}
              />
            ))
          )}
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground/15 font-orbitron uppercase tracking-widest pb-8">
          VOID Esport · Panel Admin
        </p>
      </div>

      {/* ── Role bottom sheet ── */}
      <AnimatePresence>
        {sheetPlayer && (
          <RoleSheet
            player={sheetPlayer}
            token={user!.token}
            onRolesChange={handleRolesChange}
            onClose={() => setSheetPlayer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
