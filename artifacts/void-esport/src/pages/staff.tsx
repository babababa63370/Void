import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Bot, ShieldCheck,
  Crown, Crosshair, UserCheck, ExternalLink,
  Loader2, ChevronRight, Wifi, WifiOff, Radio, Save, Clock,
  Trophy, Calendar, FlaskConical, Send, RefreshCw, Hash, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle,
  Terminal, Gavel, Ban, UserX, VolumeX, Volume2, Move,
} from "lucide-react";
import { SiDiscord, SiTwitch } from "react-icons/si";
import { Link, useLocation } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useSession } from "@/hooks/useSession";
import Navbar from "@/components/layout/navbar";
import NotFound from "@/pages/not-found";

const ADMIN_DISCORD_ID = "1243206708604702791";

function avatarUrl(discordId: string, avatar: string | null): string {
  if (avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.webp?size=128`;
  if (!/^\d+$/.test(discordId)) return `https://cdn.discordapp.com/embed/avatars/0.png`;
  const idx = Number((BigInt(discordId) >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

const ROLE_CONFIG = {
  alpha: { label: "Alpha", icon: Crown, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
  omega: { label: "Omega", icon: Crosshair, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/30" },
  staff: { label: "Staff", icon: UserCheck, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
} as const;

const NAV_GROUPS = [
  {
    category: "Staff Panel",
    items: [
      { path: "/staff", label: "Overview", icon: LayoutDashboard, category: "Staff Panel" },
      { path: "/staff/liste-staff", label: "Liste staff", icon: Users, category: "Staff Panel" },
    ],
  },
  {
    category: "Bot Panel",
    items: [
      { path: "/staff/bot", label: "Overview", icon: LayoutDashboard, category: "Bot Panel" },
      { path: "/staff/bot/commandes", label: "Commandes", icon: Terminal, category: "Bot Panel" },
      { path: "/staff/matcherino", label: "Matcherino", icon: Trophy, category: "Bot Panel" },
    ],
  },
  {
    category: "Modération",
    items: [
      { path: "/staff/moderation/logs", label: "Logs", icon: Gavel, category: "Modération" },
    ],
  },
  {
    category: "Recrutements",
    items: [],
  },
];

// ─── Overview Stats ──────────────────────────────────────────────────────────
interface OverviewStats {
  staffCount: number;
  botOnline: boolean;
  upcomingMatcherino: { id: number; title: string; startAt: string | null }[];
  matcherinoCount: number;
  recentLogs: {
    id: number; action: string; targetUsername: string | null; targetId: string;
    moderatorUsername: string | null; reason: string | null; success: string; createdAt: string;
  }[];
  modLast24h: number;
}

function useOverviewStats(token: string) {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch("/api/staff/members", { headers }).then((r) => r.json()).catch(() => []),
      fetch("/api/bot/status", { headers }).then((r) => r.json()).catch(() => ({ connected: false })),
      fetch("/api/matcherino/events").then((r) => r.json()).catch(() => ({ events: [] })),
      fetch("/api/moderation/logs?limit=5", { headers }).then((r) => r.json()).catch(() => ({ logs: [], total: 0 })),
      fetch("/api/moderation/logs?limit=200", { headers }).then((r) => r.json()).catch(() => ({ logs: [] })),
    ]).then(([members, bot, mat, recent, all]) => {
      if (cancelled) return;
      const now = Date.now();
      const upcoming = (mat.events ?? [])
        .filter((e: { startAt: string | null }) => e.startAt && new Date(e.startAt).getTime() > now)
        .slice(0, 3);
      const dayAgo = now - 86400_000;
      const last24h = (all.logs ?? []).filter(
        (l: { createdAt: string }) => new Date(l.createdAt).getTime() > dayAgo,
      ).length;
      setStats({
        staffCount: Array.isArray(members) ? members.length : 0,
        botOnline: !!bot.connected,
        upcomingMatcherino: upcoming,
        matcherinoCount: (mat.events ?? []).filter(
          (e: { startAt: string | null }) => e.startAt && new Date(e.startAt).getTime() > now,
        ).length,
        recentLogs: recent.logs ?? [],
        modLast24h: last24h,
      });
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [token]);

  return { stats, loading };
}

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: typeof Users; label: string; value: React.ReactNode; sub?: string; accent: string;
}) {
  return (
    <div className={`p-4 border bg-white/[0.02] ${accent}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" />
        <p className="text-[10px] font-orbitron uppercase tracking-widest opacity-70">{label}</p>
      </div>
      <p className="font-orbitron font-black text-2xl text-white">{value}</p>
      {sub && <p className="text-[11px] font-mono text-muted-foreground/50 mt-1">{sub}</p>}
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

// ─── Overview ────────────────────────────────────────────────────────────────
function Overview({ session, isAdmin, token }: { session: ReturnType<typeof useSession>["session"] & object; isAdmin: boolean; token: string }) {
  const { stats, loading: statsLoading } = useOverviewStats(token);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={avatarUrl(session.discordId, session.avatar)}
            alt={session.username}
            className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500/40"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
          </div>
        </div>
        <div>
          <h2 className="font-orbitron font-black text-lg uppercase tracking-widest text-white">
            {session.username}
          </h2>
          <div className="flex items-center gap-1.5 text-cyan-400/60 text-xs font-mono mt-0.5">
            <SiDiscord className="w-3 h-3 text-[#5865F2]" />
            {session.discordId}
          </div>
        </div>
      </div>

      {/* Roles */}
      <div>
        <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest mb-3">
          Tes rôles
        </p>
        <div className="flex flex-wrap gap-2">
          {(session.roles ?? []).length === 0 && (
            <span className="text-xs text-muted-foreground/40 font-mono">Aucun rôle</span>
          )}
          {(session.roles ?? []).map((role) => {
            const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
            if (!cfg) return null;
            const Icon = cfg.icon;
            return (
              <span key={role} className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-orbitron uppercase tracking-wider ${cfg.color} ${cfg.bg}`}>
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div>
        <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest mb-3">
          Vue d'ensemble
        </p>
        {statsLoading || !stats ? (
          <div className="flex items-center gap-2 text-muted-foreground/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement des stats…
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={Users}
              label="Membres staff"
              value={stats.staffCount}
              sub="Avec le rôle Staff"
              accent="border-cyan-500/20 text-cyan-400"
            />
            <StatCard
              icon={stats.botOnline ? Wifi : WifiOff}
              label="Bot Discord"
              value={stats.botOnline ? "Online" : "Offline"}
              sub={stats.botOnline ? "Connecté" : "Déconnecté"}
              accent={stats.botOnline ? "border-green-500/20 text-green-400" : "border-red-500/20 text-red-400"}
            />
            <StatCard
              icon={Trophy}
              label="Tournois à venir"
              value={stats.matcherinoCount}
              sub="Matcherino"
              accent="border-violet-500/20 text-violet-400"
            />
            <StatCard
              icon={Gavel}
              label="Modération 24h"
              value={stats.modLast24h}
              sub="Actions du bot"
              accent="border-fuchsia-500/20 text-fuchsia-400"
            />
          </div>
        )}
      </div>

      {/* Prochains tournois */}
      {stats && stats.upcomingMatcherino.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest">
              Prochains tournois
            </p>
            <Link
              href="/staff/matcherino"
              className="text-[10px] font-orbitron uppercase tracking-wider text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
            >
              Tout voir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid gap-2">
            {stats.upcomingMatcherino.map((ev) => (
              <Link
                key={ev.id}
                href="/staff/matcherino"
                className="flex items-center justify-between p-3.5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-violet-500/20 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center border border-violet-500/30 bg-violet-500/10">
                    <Trophy className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-orbitron font-bold text-sm text-white truncate">{ev.title}</p>
                    {ev.startAt && (
                      <p className="text-[11px] font-mono text-muted-foreground/50 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ev.startAt)}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-violet-400/60 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Derniers logs de modération */}
      {stats && stats.recentLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest">
              Derniers logs de modération
            </p>
            <Link
              href="/staff/moderation/logs"
              className="text-[10px] font-orbitron uppercase tracking-wider text-fuchsia-400 hover:text-fuchsia-300 inline-flex items-center gap-1"
            >
              Tout voir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid gap-2">
            {stats.recentLogs.map((log) => {
              const meta = ACTION_META[log.action] ?? { label: log.action, icon: Gavel, color: "text-muted-foreground", bg: "bg-white/5 border-white/10" };
              const Icon = meta.icon;
              const failed = log.success !== "yes";
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 border border-white/5 bg-white/[0.02]"
                >
                  <span className={`inline-flex items-center gap-1 px-2 py-1 border text-[10px] font-orbitron uppercase tracking-wider shrink-0 ${meta.color} ${meta.bg}`}>
                    <Icon className="w-3 h-3" />
                    {meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      <span className="font-medium">{log.targetUsername ?? log.targetId}</span>
                      <span className="text-muted-foreground/50 text-xs font-mono ml-2">
                        par {log.moderatorUsername ?? "—"}
                      </span>
                    </p>
                    {log.reason && (
                      <p className="text-[11px] text-muted-foreground/40 truncate mt-0.5">{log.reason}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground/40">
                      {formatRelative(log.createdAt)}
                    </span>
                    {failed && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-orbitron uppercase tracking-wider text-red-400">
                        <AlertCircle className="w-2.5 h-2.5" /> Échec
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin panel — meonix only */}
      {isAdmin && (
        <div className="p-4 border border-violet-500/20 bg-violet-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-orbitron font-bold text-sm uppercase tracking-wider text-violet-400">Panel Admin</p>
              <p className="text-xs text-muted-foreground mt-0.5">Gérer les rôles et les joueurs</p>
            </div>
            <a
              href="/meonix"
              className="inline-flex items-center gap-1.5 text-xs font-orbitron uppercase tracking-wider text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-400/50 bg-violet-500/10 hover:bg-violet-500/15 px-3 py-2 transition-colors"
            >
              Ouvrir <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div>
        <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest mb-3">
          Navigation
        </p>
        <div className="grid gap-2">
          {NAV_GROUPS.flatMap((g) => g.items).filter((n) => n.path !== "/staff").map(({ path, label, icon: Icon, category }) => (
            <Link
              key={path}
              href={path}
              className="flex items-center justify-between p-3.5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <span className="font-orbitron font-bold text-sm uppercase tracking-wider text-white">{label}</span>
                  <p className="text-[10px] text-muted-foreground/40 font-orbitron uppercase tracking-wider">{category}</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Liste Staff ──────────────────────────────────────────────────────────────
interface StaffMember {
  discordId: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  roles: string[];
}

function ListeStaff({ token }: { token: string }) {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff/members", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: StaffMember[]) => {
        setMembers(Array.isArray(data) ? data : []);
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="font-orbitron font-black text-lg uppercase tracking-widest text-white mb-1">Liste staff</h2>
        <p className="text-xs text-muted-foreground">Membres ayant le rôle Staff</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement…
        </div>
      ) : members.length === 0 ? (
        <p className="text-muted-foreground/40 text-sm font-mono">Aucun membre staff trouvé.</p>
      ) : (
        <div className="grid gap-3">
          {members.map((m, i) => (
            <motion.div
              key={m.discordId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3.5 border border-white/5 bg-white/[0.02]"
            >
              <img
                src={avatarUrl(m.discordId, m.avatar)}
                alt={m.username}
                className="w-10 h-10 rounded-full object-cover border border-cyan-500/20"
              />
              <div className="flex-1 min-w-0">
                <p className="font-orbitron font-bold text-sm uppercase tracking-wider text-white truncate">
                  {m.username}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <SiDiscord className="w-3 h-3 text-[#5865F2] shrink-0" />
                  <span className="text-[11px] font-mono text-muted-foreground/40 truncate">{m.discordId}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 shrink-0">
                {m.roles.map((role) => {
                  const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  return (
                    <span key={role} className={`inline-flex items-center gap-1 px-2 py-1 border text-[10px] font-orbitron uppercase tracking-wider ${cfg.color} ${cfg.bg}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Uptime ticker ───────────────────────────────────────────────────────────
function Uptime({ connectedAt }: { connectedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(connectedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [connectedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const label = h > 0 ? `${h}h ${pad(m)}m ${pad(s)}s` : `${pad(m)}m ${pad(s)}s`;

  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 font-mono mt-1">
      <Clock className="w-3 h-3" />
      En ligne depuis {label}
    </p>
  );
}

// ─── Bot ─────────────────────────────────────────────────────────────────────
type BotStatus = "online" | "idle" | "dnd" | "invisible";
type ActivityKind = "none" | "playing" | "listening" | "watching" | "streaming" | "competing";
type BotMode = BotStatus | "streaming";

interface BotInfo {
  connected: boolean;
  username: string | null;
  discriminator: string | null;
  avatar: string | null;
  id: string | null;
  connectedAt: string | null;
  presence: {
    status: BotStatus;
    activityKind: ActivityKind;
    activityName: string;
    streamUrl: string;
  };
}

const MODE_OPTIONS: {
  value: BotMode;
  label: string;
  sub: string;
  dot: string;
  border: string;
  bg: string;
  activeBorder: string;
  activeBg: string;
  activeText: string;
}[] = [
  {
    value: "online",
    label: "En ligne",
    sub: "Visible et disponible",
    dot: "bg-green-400",
    border: "border-white/5",      bg: "bg-white/[0.02]",
    activeBorder: "border-green-500/40", activeBg: "bg-green-500/10", activeText: "text-green-400",
  },
  {
    value: "idle",
    label: "Inactif",
    sub: "Absent / AFK",
    dot: "bg-yellow-400",
    border: "border-white/5",      bg: "bg-white/[0.02]",
    activeBorder: "border-yellow-500/40", activeBg: "bg-yellow-500/10", activeText: "text-yellow-400",
  },
  {
    value: "dnd",
    label: "Ne pas déranger",
    sub: "NPD — aucune notif",
    dot: "bg-red-400",
    border: "border-white/5",      bg: "bg-white/[0.02]",
    activeBorder: "border-red-500/40", activeBg: "bg-red-500/10", activeText: "text-red-400",
  },
  {
    value: "invisible",
    label: "Hors ligne",
    sub: "Apparaît déconnecté",
    dot: "bg-gray-500",
    border: "border-white/5",      bg: "bg-white/[0.02]",
    activeBorder: "border-gray-500/40", activeBg: "bg-gray-500/10", activeText: "text-gray-300",
  },
  {
    value: "streaming",
    label: "Streaming",
    sub: "Live Twitch — badge violet",
    dot: "bg-violet-500",
    border: "border-white/5",      bg: "bg-white/[0.02]",
    activeBorder: "border-violet-500/40", activeBg: "bg-violet-500/10", activeText: "text-violet-400",
  },
];

const EXTRA_ACTIVITY_OPTIONS: { value: ActivityKind; label: string }[] = [
  { value: "none",       label: "Aucune activité supplémentaire" },
  { value: "playing",    label: "Joue à…" },
  { value: "listening",  label: "Écoute…" },
  { value: "watching",   label: "Regarde…" },
  { value: "competing",  label: "En compétition dans…" },
];

function modeFromPresence(p: BotInfo["presence"]): BotMode {
  if (p.activityKind === "streaming") return "streaming";
  return p.status;
}

// ─── Commandes ────────────────────────────────────────────────────────────────
interface SlashCommand { name: string; description: string; }

function CommandesPage({ token }: { token: string }) {
  const [commands, setCommands] = useState<SlashCommand[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bot/commands", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error("fetch_failed");
        return r.json() as Promise<{ commands: SlashCommand[] }>;
      })
      .then((data) => setCommands(data.commands))
      .catch(() => setError("Impossible de charger les commandes"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Terminal className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-orbitron font-black text-lg uppercase tracking-widest text-white">Commandes</h2>
          <p className="text-xs text-muted-foreground/60 font-mono">Commandes slash enregistrées sur le bot VOID</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {commands && !loading && (
        <div className="grid gap-2">
          {commands.length === 0 ? (
            <p className="text-muted-foreground/40 text-sm font-mono">Aucune commande enregistrée.</p>
          ) : (
            commands.map((cmd) => (
              <div
                key={cmd.name}
                className="flex items-start gap-3 px-4 py-3 border border-white/5 bg-white/[0.02] hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <code className="font-mono text-sm text-white">/{cmd.name}</code>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{cmd.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Moderation Logs ──────────────────────────────────────────────────────────
interface ModerationLog {
  id: number;
  action: string;
  guildId: string | null;
  targetId: string;
  targetUsername: string | null;
  moderatorId: string;
  moderatorUsername: string | null;
  reason: string | null;
  durationSec: string | null;
  extra: Record<string, any> | null;
  dmDelivered: string | null;
  success: string;
  errorMessage: string | null;
  createdAt: string;
}

const ACTION_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  ban:    { label: "Ban",     icon: Ban,      color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30" },
  unban:  { label: "Unban",   icon: UserCheck,color: "text-green-400",   bg: "bg-green-500/10 border-green-500/30" },
  kick:   { label: "Kick",    icon: UserX,    color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/30" },
  mute:   { label: "Mute",    icon: VolumeX,  color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/30" },
  unmute: { label: "Unmute",  icon: Volume2,  color: "text-green-400",   bg: "bg-green-500/10 border-green-500/30" },
  move:   { label: "Move",    icon: Move,     color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/30" },
};

const ACTION_FILTERS = ["all", "ban", "unban", "kick", "mute", "unmute", "move"] as const;

function formatDuration(sec: string | null): string | null {
  if (!sec) return null;
  const s = Number(sec);
  if (!isFinite(s) || s <= 0) return null;
  if (s >= 86400) return `${Math.round(s / 86400)}j`;
  if (s >= 3600) return `${Math.round(s / 3600)}h`;
  if (s >= 60) return `${Math.round(s / 60)}min`;
  return `${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ModerationLogsPage({ token }: { token: string }) {
  const [logs, setLogs] = useState<ModerationLog[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof ACTION_FILTERS)[number]>("all");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ limit: "100", action: filter });
    fetch(`/api/moderation/logs?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("fetch_failed");
        return r.json() as Promise<{ logs: ModerationLog[]; total: number }>;
      })
      .then((data) => { setLogs(data.logs); setTotal(data.total); })
      .catch(() => setError("Impossible de charger les logs"))
      .finally(() => setLoading(false));
  }, [token, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Gavel className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-orbitron font-black text-lg uppercase tracking-widest text-white">Logs de modération</h2>
            <p className="text-xs text-muted-foreground/60 font-mono">{total} action{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Rafraîchir
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {ACTION_FILTERS.map((f) => {
          const meta = f === "all" ? null : ACTION_META[f];
          const active = filter === f;
          const Icon = meta?.icon ?? Hash;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
                active
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {f === "all" ? "Tout" : meta?.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {logs && !loading && (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-muted-foreground/40 text-sm font-mono py-8 text-center">Aucun log pour ce filtre.</p>
          ) : (
            logs.map((log) => {
              const meta = ACTION_META[log.action] ?? { label: log.action, icon: Hash, color: "text-white", bg: "bg-white/5 border-white/10" };
              const Icon = meta.icon;
              const duration = formatDuration(log.durationSec);
              const failed = log.success !== "yes";
              return (
                <div
                  key={log.id}
                  className={`border ${failed ? "border-red-500/40 bg-red-500/5" : "border-white/5 bg-white/[0.02]"} p-4 space-y-2`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-md border flex items-center justify-center ${meta.bg}`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <span className={`text-xs font-orbitron uppercase tracking-widest ${meta.color}`}>
                        {meta.label}
                      </span>
                      {duration && (
                        <span className="text-[10px] font-mono text-muted-foreground/60 px-2 py-0.5 rounded border border-white/10">
                          {duration}
                        </span>
                      )}
                      {failed && (
                        <span className="text-[10px] font-mono text-red-400 px-2 py-0.5 rounded border border-red-500/40">
                          ÉCHEC
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground/50">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-y-1 gap-x-4 text-xs">
                    <div>
                      <span className="text-muted-foreground/40 font-mono">Cible&nbsp;: </span>
                      <span className="text-white">{log.targetUsername ?? "—"}</span>
                      <span className="text-muted-foreground/40 font-mono ml-1">({log.targetId})</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/40 font-mono">Modérateur&nbsp;: </span>
                      <span className="text-white">{log.moderatorUsername ?? "—"}</span>
                      <span className="text-muted-foreground/40 font-mono ml-1">({log.moderatorId})</span>
                    </div>
                  </div>

                  {log.reason && (
                    <div className="text-xs">
                      <span className="text-muted-foreground/40 font-mono">Raison&nbsp;: </span>
                      <span className="text-white/90">{log.reason}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono pt-1">
                    {log.dmDelivered && log.dmDelivered !== "na" && (
                      <span className={log.dmDelivered === "yes" ? "text-green-400" : "text-orange-400"}>
                        MP&nbsp;: {log.dmDelivered === "yes" ? "✅ envoyé" : "❌ non reçu"}
                      </span>
                    )}
                    {log.extra?.channelName && (
                      <span className="text-cyan-400">→ #{log.extra.channelName}</span>
                    )}
                    {log.extra?.deleteDays ? (
                      <span className="text-muted-foreground/60">Messages&nbsp;: {log.extra.deleteDays}j</span>
                    ) : null}
                    {log.errorMessage && (
                      <span className="text-red-400 truncate max-w-full">Erreur&nbsp;: {log.errorMessage}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </motion.div>
  );
}

function BotPage({ token }: { token: string }) {
  const [info, setInfo] = useState<BotInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [mode, setMode] = useState<BotMode>("online");
  const [streamUrl, setStreamUrl] = useState("");
  const [streamTitle, setStreamTitle] = useState("");
  const [extraActivity, setExtraActivity] = useState<ActivityKind>("none");
  const [extraActivityName, setExtraActivityName] = useState("");

  const fetchBotStatus = useCallback(() => {
    fetch("/api/bot/status", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: BotInfo) => {
        setInfo(data);
        setMode(modeFromPresence(data.presence));
        setStreamUrl(data.presence.streamUrl ?? "");
        setStreamTitle(data.presence.activityKind === "streaming" ? data.presence.activityName : "");
        if (data.presence.activityKind !== "streaming" && data.presence.activityKind !== "none") {
          setExtraActivity(data.presence.activityKind);
          setExtraActivityName(data.presence.activityName);
        }
      })
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchBotStatus(); }, [fetchBotStatus]);

  async function handleSave() {
    if (!info?.connected) return;
    setSaving(true);
    setSaved(false);
    try {
      const isStreaming = mode === "streaming";
      const payload = {
        status:       isStreaming ? "online" : (mode as BotStatus),
        activityKind: isStreaming ? "streaming" : extraActivity,
        activityName: isStreaming ? streamTitle : extraActivityName,
        streamUrl:    isStreaming ? streamUrl : "",
      };
      const r = await fetch("/api/bot/presence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        fetchBotStatus();
      }
    } finally {
      setSaving(false);
    }
  }

  const currentMode = info ? modeFromPresence(info.presence) : null;
  const currentModeCfg = MODE_OPTIONS.find((m) => m.value === currentMode);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="font-orbitron font-black text-lg uppercase tracking-widest text-white mb-1">Bot Panel</h2>
        <p className="text-xs text-muted-foreground">Gestion du bot Discord VOID</p>
      </div>

      {/* ── Carte bot ── */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />Connexion…
        </div>
      ) : (
        <div className={`flex items-start gap-4 p-4 border ${info?.connected ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          {info?.connected && info.id && info.avatar ? (
            <img
              src={`https://cdn.discordapp.com/avatars/${info.id}/${info.avatar}.png?size=80`}
              alt={info.username ?? "bot"}
              className="w-14 h-14 rounded-full shrink-0 border-2 border-white/10"
            />
          ) : (
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${info?.connected ? "bg-green-500/10" : "bg-red-500/10"}`}>
              {info?.connected ? <Wifi className="w-6 h-6 text-green-400" /> : <WifiOff className="w-6 h-6 text-red-400" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {info?.connected && info.username ? (
                <span className="font-orbitron font-black text-sm text-white tracking-wide">{info.username}</span>
              ) : (
                <span className={`font-orbitron font-bold text-sm uppercase tracking-wider ${info?.connected ? "text-green-400" : "text-red-400"}`}>
                  {info?.connected ? "Connecté" : "Déconnecté"}
                </span>
              )}
              {info?.connected && currentModeCfg && (
                <span className={`flex items-center gap-1.5 text-xs ${currentModeCfg.activeText}`}>
                  <span className={`w-2 h-2 rounded-full ${currentModeCfg.dot}`} />
                  {currentModeCfg.label}
                </span>
              )}
            </div>
            {info?.connected && info.id && (
              <p className="text-[11px] text-muted-foreground/50 font-mono mt-0.5 truncate">ID : {info.id}</p>
            )}
            {info?.connected && info.connectedAt && <Uptime connectedAt={info.connectedAt} />}
          </div>
        </div>
      )}

      {/* ── Contrôles ── */}
      {info?.connected && (
        <div className="space-y-5">
          {/* Modes */}
          <div>
            <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest mb-3">Mode</p>
            <div className="grid grid-cols-1 gap-2">
              {MODE_OPTIONS.map((opt) => {
                const active = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    className={`flex items-center gap-3 px-4 py-3 border text-left transition-colors ${
                      active
                        ? `${opt.activeBorder} ${opt.activeBg}`
                        : `${opt.border} ${opt.bg} hover:bg-white/5`
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full shrink-0 ${opt.dot}`} />
                    <span className="flex-1">
                      <span className={`block font-orbitron font-bold text-sm uppercase tracking-wider ${active ? opt.activeText : "text-muted-foreground"}`}>
                        {opt.label}
                      </span>
                      <span className="block text-[11px] text-muted-foreground/40 mt-0.5">{opt.sub}</span>
                    </span>
                    {active && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Streaming fields */}
          <AnimatePresence>
            {mode === "streaming" && (
              <motion.div
                key="streaming-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-orbitron text-violet-400/60 uppercase tracking-widest mb-2">Streaming</p>
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-violet-500/30 bg-violet-500/5">
                    <SiTwitch className="w-4 h-4 text-violet-400 shrink-0" />
                    <input
                      type="text"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="https://twitch.tv/votre_chaine"
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-muted-foreground/40"
                    />
                    <Radio className="w-3.5 h-3.5 text-violet-400/40 shrink-0" />
                  </div>
                  <input
                    type="text"
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    placeholder="Titre du stream (optionnel)…"
                    className="w-full bg-white/[0.03] border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-violet-500/50 placeholder:text-muted-foreground/40"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Extra activity (non-streaming modes) */}
          <AnimatePresence>
            {mode !== "streaming" && (
              <motion.div
                key="extra-activity"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest mb-2">Activité (optionnel)</p>
                  <select
                    value={extraActivity}
                    onChange={(e) => setExtraActivity(e.target.value as ActivityKind)}
                    className="w-full bg-white/[0.03] border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-primary/50"
                  >
                    {EXTRA_ACTIVITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#0f0f13]">{opt.label}</option>
                    ))}
                  </select>
                  {extraActivity !== "none" && (
                    <input
                      type="text"
                      value={extraActivityName}
                      onChange={(e) => setExtraActivityName(e.target.value)}
                      placeholder="Texte de l'activité…"
                      className="w-full bg-white/[0.03] border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 font-orbitron font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-50 ${
              mode === "streaming"
                ? "bg-violet-600 hover:bg-violet-500 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "Appliqué !" : "Appliquer"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Matcherino ───────────────────────────────────────────────────────────────
interface MEvent {
  id: number;
  title: string;
  kind: string;
  startAt: string | null;
  endAt: string | null;
  finalizedAt: string | null;
  announced: boolean;
  announcedAt: string | null;
  totalBalance: number;
  participantsCount: number;
  heroImg: string;
  backgroundImg: string;
  thumbnailImg: string;
  gameTitle: string | null;
  gameImage: string | null;
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

interface AutoState {
  enabled: boolean;
  channelId: string;
  lastCheckedAt: string | null;
  nextCheckAt: string | null;
  lastAnnouncedTitle: string | null;
  lastAnnouncedAt: string | null;
}

function MatcherinoPage({ token }: { token: string }) {
  const baseUrl = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

  const [events, setEvents] = useState<MEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [sending, setSending] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState<Record<number, "ok" | "err">>({});

  const [autoState, setAutoState] = useState<AutoState | null>(null);
  const [autoChannelId, setAutoChannelId] = useState("");
  const [autoToggling, setAutoToggling] = useState(false);
  const [savingAutoChannel, setSavingAutoChannel] = useState(false);
  const [savedAutoChannel, setSavedAutoChannel] = useState(false);

  const [savingManualChannel, setSavingManualChannel] = useState(false);
  const [savedManualChannel, setSavedManualChannel] = useState(false);

  const [previewId, setPreviewId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const authHeader = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadEvents = useCallback((fresh = false) => {
    if (fresh) setRefreshing(true);
    else setLoading(true);
    const url = fresh ? `${baseUrl}/api/matcherino/events/refresh` : `${baseUrl}/api/matcherino/events`;
    fetch(url, { method: fresh ? "POST" : "GET" })
      .then((r) => r.json())
      .then((d: { events: MEvent[] }) => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [baseUrl]);

  const loadAutoState = useCallback(() => {
    fetch(`${baseUrl}/api/staff/matcherino/auto-announce/status`, { headers: authHeader })
      .then((r) => r.json())
      .then((d: AutoState) => { setAutoState(d); if (d.channelId) setAutoChannelId(d.channelId); })
      .catch(() => {});
  }, [baseUrl, token]);

  useEffect(() => {
    loadEvents();
    loadAutoState();
    fetch(`${baseUrl}/api/staff/matcherino/settings`, { headers: authHeader })
      .then((r) => r.json())
      .then((d: { channelId?: string; manualChannelId?: string }) => {
        if (d.channelId) setAutoChannelId(d.channelId);
        if (d.manualChannelId) setChannelId(d.manualChannelId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(loadAutoState, 15000);
    return () => clearInterval(id);
  }, [loadAutoState]);

  async function saveChannel(key: string, value: string, setDone: (v: boolean) => void, setSaving: (v: boolean) => void) {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await fetch(`${baseUrl}/api/staff/matcherino/settings`, {
        method: "POST", headers: authHeader,
        body: JSON.stringify({ key, value: value.trim() }),
      });
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } finally { setSaving(false); }
  }

  async function announce(eventId: number, isTest: boolean) {
    if (!channelId.trim()) return;
    setSending((p) => ({ ...p, [eventId]: true }));
    setFeedback((p) => { const n = { ...p }; delete n[eventId]; return n; });
    try {
      const r = await fetch(`${baseUrl}/api/staff/matcherino/announce`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({ eventId, channelId: channelId.trim(), isTest }),
      });
      if (r.ok) {
        if (!isTest) setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, announced: true, announcedAt: new Date().toISOString() } : e));
        setFeedback((p) => ({ ...p, [eventId]: "ok" }));
      } else setFeedback((p) => ({ ...p, [eventId]: "err" }));
    } catch { setFeedback((p) => ({ ...p, [eventId]: "err" })); }
    finally {
      setSending((p) => ({ ...p, [eventId]: false }));
      setTimeout(() => setFeedback((p) => { const n = { ...p }; delete n[eventId]; return n; }), 3000);
    }
  }

  async function toggleAutoAnnounce() {
    if (!autoState) return;
    setAutoToggling(true);
    try {
      if (autoState.enabled) {
        const r = await fetch(`${baseUrl}/api/staff/matcherino/auto-announce/stop`, { method: "POST", headers: authHeader });
        if (r.ok) setAutoState(await r.json().then((d: any) => d.state));
      } else {
        if (!autoChannelId.trim()) return;
        const r = await fetch(`${baseUrl}/api/staff/matcherino/auto-announce/start`, {
          method: "POST", headers: authHeader,
          body: JSON.stringify({ channelId: autoChannelId.trim() }),
        });
        if (r.ok) setAutoState(await r.json().then((d: any) => d.state));
      }
    } finally { setAutoToggling(false); }
  }

  async function loadPreview(eventId: number) {
    if (previewId === eventId) { setPreviewId(null); setPreviewUrl(null); return; }
    setPreviewId(eventId);
    setPreviewLoading(true);
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
    try {
      const r = await fetch(`${baseUrl}/api/staff/matcherino/preview/${eventId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const blob = await r.blob();
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } catch {} finally { setPreviewLoading(false); }
  }

  const active = events.filter((e) => !e.finalizedAt);
  const finished = events.filter((e) => !!e.finalizedAt);

  function fmtRelative(iso: string) {
    const diff = new Date(iso).getTime() - Date.now();
    const abs = Math.abs(diff);
    if (abs < 60000) return "à l'instant";
    if (abs < 3600000) return `${Math.round(abs / 60000)} min`;
    return `${Math.round(abs / 3600000)} h`;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-orbitron font-black text-lg uppercase tracking-widest text-white mb-1">Matcherino</h2>
          <p className="text-xs text-muted-foreground">Annonces de tournois vers Discord</p>
        </div>
        <button
          onClick={() => loadEvents(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-3 py-2 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-orbitron uppercase tracking-wider text-muted-foreground hover:text-white transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Sync Matcherino
        </button>
      </div>

      {/* ── Auto-announce module ── */}
      <div className={`p-4 border space-y-4 transition-colors ${autoState?.enabled ? "border-primary/40 bg-primary/5" : "border-white/10 bg-white/[0.02]"}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-orbitron uppercase tracking-widest text-primary/80 mb-0.5">Annonce automatique</p>
            <p className="text-[11px] text-muted-foreground/50">Détecte les nouveaux tournois et envoie la carte + ping automatiquement</p>
          </div>
          <button
            onClick={toggleAutoAnnounce}
            disabled={autoToggling || (!autoState?.enabled && !autoChannelId.trim())}
            className={`flex items-center gap-2 px-4 py-2 font-orbitron font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              autoState?.enabled
                ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
            }`}
          >
            {autoToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : autoState?.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {autoState?.enabled ? "Désactiver" : "Activer"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <Hash className="w-4 h-4 text-primary/40 shrink-0" />
            <input
              type="text"
              value={autoChannelId}
              onChange={(e) => { setAutoChannelId(e.target.value); setSavedAutoChannel(false); }}
              disabled={autoState?.enabled}
              placeholder="ID canal Discord pour les annonces automatiques"
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-muted-foreground/30 font-mono disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => saveChannel("matcherino.channelId", autoChannelId, setSavedAutoChannel, setSavingAutoChannel)}
            disabled={savingAutoChannel || !autoChannelId.trim() || autoState?.enabled}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-[11px] font-orbitron uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {savingAutoChannel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedAutoChannel ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />}
            {savedAutoChannel ? "Sauvegardé" : "Enregistrer"}
          </button>
        </div>

        {autoState?.enabled && (
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 border border-white/5 bg-white/[0.02]">
              <p className="text-muted-foreground/40 uppercase tracking-widest text-[10px] mb-0.5">Dernier check</p>
              <p className="text-white/70">{autoState.lastCheckedAt ? fmtRelative(autoState.lastCheckedAt) : "—"}</p>
            </div>
            <div className="p-2.5 border border-white/5 bg-white/[0.02]">
              <p className="text-muted-foreground/40 uppercase tracking-widest text-[10px] mb-0.5">Prochain check</p>
              <p className="text-white/70">{autoState.nextCheckAt ? fmtRelative(autoState.nextCheckAt) : "—"}</p>
            </div>
            {autoState.lastAnnouncedTitle && (
              <div className="col-span-2 p-2.5 border border-primary/20 bg-primary/5">
                <p className="text-muted-foreground/40 uppercase tracking-widest text-[10px] mb-0.5">Dernier annoncé</p>
                <p className="text-primary truncate">{autoState.lastAnnouncedTitle}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Manual channel ── */}
      <div className="p-4 border border-white/8 bg-white/[0.01] space-y-3">
        <p className="text-[11px] font-orbitron text-muted-foreground/50 uppercase tracking-widest">Canal manuel (annonce / test)</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <Hash className="w-4 h-4 text-muted-foreground/30 shrink-0" />
            <input
              type="text"
              value={channelId}
              onChange={(e) => { setChannelId(e.target.value); setSavedManualChannel(false); }}
              placeholder="ID canal Discord"
              className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-muted-foreground/30 font-mono"
            />
          </div>
          <button
            onClick={() => saveChannel("matcherino.manualChannelId", channelId, setSavedManualChannel, setSavingManualChannel)}
            disabled={savingManualChannel || !channelId.trim()}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-white text-[11px] font-orbitron uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {savingManualChannel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : savedManualChannel ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />}
            {savedManualChannel ? "Sauvegardé" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* ── Preview panel ── */}
      <AnimatePresence>
        {previewId !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-orbitron text-primary/70 uppercase tracking-widest">Aperçu de la carte</p>
                <button onClick={() => { setPreviewId(null); setPreviewUrl(null); }} className="text-muted-foreground/40 hover:text-white text-xs transition-colors">✕ Fermer</button>
              </div>
              {previewLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground/50 text-sm py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />Génération…
                </div>
              ) : previewUrl ? (
                <img src={previewUrl} alt="Preview carte" className="w-full border border-white/10 rounded-sm" />
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />Chargement des événements…
        </div>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground/40 text-sm font-mono">Aucun événement Matcherino trouvé.</p>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <p className="text-[11px] font-orbitron text-primary/60 uppercase tracking-widest mb-3">En cours / à venir ({active.length})</p>
              <div className="grid gap-3">
                {active.map((event, i) => (
                  <EventCard key={event.id} event={event} i={i}
                    announced={event.announced} sending={!!sending[event.id]}
                    feedback={feedback[event.id]} channelId={channelId}
                    isPreviewing={previewId === event.id}
                    onAnnounce={() => announce(event.id, false)}
                    onTest={() => announce(event.id, true)}
                    onPreview={() => loadPreview(event.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {finished.length > 0 && (
            <div>
              <p className="text-[11px] font-orbitron text-muted-foreground/30 uppercase tracking-widest mb-3">Terminés ({finished.length})</p>
              <div className="grid gap-3 opacity-60">
                {finished.map((event, i) => (
                  <EventCard key={event.id} event={event} i={i}
                    announced={event.announced} sending={!!sending[event.id]}
                    feedback={feedback[event.id]} channelId={channelId}
                    isPreviewing={previewId === event.id}
                    onAnnounce={() => announce(event.id, false)}
                    onTest={() => announce(event.id, true)}
                    onPreview={() => loadPreview(event.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function EventCard({
  event, i, announced, sending, feedback, channelId, isPreviewing, onAnnounce, onTest, onPreview,
}: {
  event: MEvent;
  i: number;
  announced: boolean;
  sending: boolean;
  feedback?: "ok" | "err";
  channelId: string;
  isPreviewing: boolean;
  onAnnounce: () => void;
  onTest: () => void;
  onPreview: () => void;
}) {
  const cover = event.heroImg || event.backgroundImg || event.thumbnailImg;
  const noChannel = !channelId.trim();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04 }}
      className={`border transition-colors ${announced ? "border-primary/30 bg-primary/5" : "border-white/5 bg-white/[0.02]"}`}
    >
      <div className="flex gap-0 overflow-hidden">
        {/* Tournament image */}
        {cover ? (
          <div className="w-24 h-24 shrink-0 overflow-hidden relative">
            <img src={cover} alt={event.title} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/60" />
          </div>
        ) : (
          <div className="w-24 h-24 shrink-0 flex items-center justify-center bg-primary/5 border-r border-white/5">
            <Trophy className="w-7 h-7 text-primary/30" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider text-white leading-tight line-clamp-1 flex-1">
                {event.title}
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground/30 shrink-0">#{event.id}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {event.gameTitle && (
                <span className="text-[10px] font-orbitron uppercase tracking-wider text-primary/70 border border-primary/20 px-1.5 py-0.5">
                  {event.gameTitle}
                </span>
              )}
              {event.startAt && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                  <Calendar className="w-3 h-3" />
                  {formatEventDate(event.startAt)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Announced badge */}
            {announced && (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 border border-primary/30 bg-primary/10 text-primary text-[10px] font-orbitron uppercase tracking-wider">
                <ToggleRight className="w-3.5 h-3.5" /> Annoncé
              </span>
            )}

            {/* Preview */}
            <button
              onClick={onPreview}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[10px] font-orbitron uppercase tracking-wider transition-colors ${
                isPreviewing
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-white/10 bg-white/[0.02] text-muted-foreground/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <ExternalLink className="w-3 h-3" />
              {isPreviewing ? "Fermer" : "Preview"}
            </button>

            {/* Test */}
            <button
              onClick={onTest}
              disabled={sending || noChannel}
              title={noChannel ? "Saisir un ID de canal d'abord" : "Envoyer un embed de test"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-yellow-500/30 bg-yellow-500/5 text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-500/10 text-[10px] font-orbitron uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
              Test
            </button>

            {/* Announce */}
            <button
              onClick={onAnnounce}
              disabled={sending || noChannel}
              title={noChannel ? "Saisir un ID de canal d'abord" : "Envoyer l'annonce dans Discord"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-orbitron uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Annoncer
            </button>

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.span
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-1 text-[10px] font-orbitron uppercase tracking-wider ${feedback === "ok" ? "text-green-400" : "text-red-400"}`}
                >
                  {feedback === "ok"
                    ? <><CheckCircle2 className="w-3 h-3" /> Envoyé</>
                    : <><AlertCircle className="w-3 h-3" /> Erreur</>}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Layout + Router ──────────────────────────────────────────────────────────
export default function Staff() {
  usePageMeta({ title: "Espace Staff — VOID Esport", description: "Zone réservée au staff VOID Esport" });

  const { session, loading } = useSession();
  const [location] = useLocation();
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

  if (!session || !isStaff) return <NotFound />;

  function renderSection() {
    if (location.startsWith("/staff/liste-staff")) return <ListeStaff token={session!.token} />;
    if (location.startsWith("/staff/matcherino")) return <MatcherinoPage token={session!.token} />;
    if (location.startsWith("/staff/bot/commandes")) return <CommandesPage token={session!.token} />;
    if (location.startsWith("/staff/bot")) return <BotPage token={session!.token} />;
    if (location.startsWith("/staff/moderation/logs")) return <ModerationLogsPage token={session!.token} />;
    return <Overview session={session!} isAdmin={isAdmin} token={session!.token} />;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-16 md:pt-20 flex">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-white/5 bg-white/[0.01] pt-8 pb-6 px-3">
          <nav className="flex flex-col gap-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.category}>
                <p className="text-[10px] font-orbitron text-muted-foreground/30 uppercase tracking-widest px-3 mb-1.5">
                  {group.category}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map(({ path, label, icon: Icon }) => {
                    const active =
                      path === "/staff" || path === "/staff/bot"
                        ? location === path
                        : location.startsWith(path);
                    return (
                      <Link
                        key={path}
                        href={path}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors font-orbitron uppercase tracking-wider ${
                          active
                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-l-2 border-transparent"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Mobile bottom tabs ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-white/5 flex">
          {NAV_GROUPS.flatMap((g) => g.items).map(({ path, label, icon: Icon }) => {
            const active =
              path === "/staff" || path === "/staff/bot"
                ? location === path
                : location.startsWith(path);
            return (
              <Link
                key={path}
                href={path}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-orbitron uppercase tracking-wider transition-colors ${
                  active ? "text-primary" : "text-muted-foreground/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 px-6 md:px-10 py-8 pb-24 md:pb-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <div key={location}>
              {renderSection()}
            </div>
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
