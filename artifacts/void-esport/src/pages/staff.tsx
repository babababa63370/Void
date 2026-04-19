import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Bot, ShieldCheck,
  Crown, Crosshair, UserCheck, ExternalLink,
  Loader2, ChevronRight, Wifi, WifiOff, Radio, Save, Clock,
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
    ],
  },
];

// ─── Overview ────────────────────────────────────────────────────────────────
function Overview({ session, isAdmin }: { session: ReturnType<typeof useSession>["session"] & object; isAdmin: boolean }) {
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

const STATUS_OPTIONS: { value: BotStatus; label: string; color: string; dot: string }[] = [
  { value: "online",    label: "En ligne",    color: "text-green-400",  dot: "bg-green-400" },
  { value: "idle",      label: "Absent",      color: "text-yellow-400", dot: "bg-yellow-400" },
  { value: "dnd",       label: "Ne pas déranger", color: "text-red-400", dot: "bg-red-400" },
  { value: "invisible", label: "Invisible",   color: "text-gray-400",   dot: "bg-gray-400" },
];

const ACTIVITY_OPTIONS: { value: ActivityKind; label: string }[] = [
  { value: "none",       label: "Aucune activité" },
  { value: "playing",    label: "Joue à…" },
  { value: "listening",  label: "Écoute…" },
  { value: "watching",   label: "Regarde…" },
  { value: "streaming",  label: "Streaming…" },
  { value: "competing",  label: "En compétition dans…" },
];

function BotPage({ token }: { token: string }) {
  const [info, setInfo] = useState<BotInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [status, setStatus] = useState<BotStatus>("online");
  const [activityKind, setActivityKind] = useState<ActivityKind>("none");
  const [activityName, setActivityName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");

  const fetchStatus = useCallback(() => {
    fetch("/api/bot/status", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: BotInfo) => {
        setInfo(data);
        setStatus(data.presence.status);
        setActivityKind(data.presence.activityKind);
        setActivityName(data.presence.activityName);
        setStreamUrl(data.presence.streamUrl);
      })
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/bot/presence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, activityKind, activityName, streamUrl }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      fetchStatus();
    } finally {
      setSaving(false);
    }
  }

  const currentStatusCfg = STATUS_OPTIONS.find((s) => s.value === (info?.presence.status ?? status));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="font-orbitron font-black text-lg uppercase tracking-widest text-white mb-1">Bot Panel</h2>
        <p className="text-xs text-muted-foreground">Gestion du bot Discord VOID</p>
      </div>

      {/* Connection status */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground/50 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Connexion…</div>
      ) : (
        <div className={`flex items-start gap-4 p-4 border ${info?.connected ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          {/* Avatar */}
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
            {/* Name + status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {info?.connected && info.username ? (
                <span className="font-orbitron font-black text-sm text-white tracking-wide">{info.username}</span>
              ) : (
                <span className={`font-orbitron font-bold text-sm uppercase tracking-wider ${info?.connected ? "text-green-400" : "text-red-400"}`}>
                  {info?.connected ? "Connecté" : "Déconnecté"}
                </span>
              )}
              {info?.connected && currentStatusCfg && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${currentStatusCfg.dot}`} />
                  {currentStatusCfg.label}
                </span>
              )}
            </div>

            {/* ID */}
            {info?.connected && info.id && (
              <p className="text-[11px] text-muted-foreground/50 font-mono mt-0.5 truncate">
                ID : {info.id}
              </p>
            )}

            {/* Uptime */}
            {info?.connected && info.connectedAt && (
              <Uptime connectedAt={info.connectedAt} />
            )}
          </div>
        </div>
      )}

      {/* Presence controls */}
      {info?.connected && (
        <div className="space-y-5">
          {/* Status */}
          <div>
            <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest mb-3">Statut</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 border text-sm font-orbitron uppercase tracking-wider transition-colors ${
                    status === opt.value
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-white/5 bg-white/[0.02] text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div>
            <p className="text-[11px] font-orbitron text-muted-foreground/40 uppercase tracking-widest mb-3">Activité</p>
            <div className="space-y-2">
              <select
                value={activityKind}
                onChange={(e) => setActivityKind(e.target.value as ActivityKind)}
                className="w-full bg-white/[0.03] border border-white/10 text-white text-sm font-orbitron uppercase tracking-wider px-3 py-2.5 focus:outline-none focus:border-primary/50"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0f0f13] normal-case">
                    {opt.label}
                  </option>
                ))}
              </select>

              {activityKind !== "none" && (
                <input
                  type="text"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  placeholder={activityKind === "streaming" ? "Nom du stream…" : "Texte de l'activité…"}
                  className="w-full bg-white/[0.03] border border-white/10 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
                />
              )}

              {activityKind === "streaming" && (
                <div className="flex items-center gap-2 px-3 py-2.5 border border-violet-500/20 bg-violet-500/5">
                  <SiTwitch className="w-4 h-4 text-violet-400 shrink-0" />
                  <input
                    type="text"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                    placeholder="https://twitch.tv/votrechaîne"
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-muted-foreground/40"
                  />
                  <Radio className="w-3.5 h-3.5 text-violet-400/50 shrink-0" />
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "Sauvegardé !" : "Appliquer"}
          </button>
        </div>
      )}
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
    if (location.startsWith("/staff/bot")) return <BotPage token={session!.token} />;
    return <Overview session={session!} isAdmin={isAdmin} />;
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
                    const active = path === "/staff" ? location === "/staff" : location.startsWith(path);
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
            const active = path === "/staff" ? location === "/staff" : location.startsWith(path);
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
