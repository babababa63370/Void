import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Bot, ShieldCheck,
  Crown, Crosshair, UserCheck, ExternalLink,
  Loader2, ChevronRight,
} from "lucide-react";
import { SiDiscord } from "react-icons/si";
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

const NAV_ITEMS = [
  { path: "/staff", label: "Overview", icon: LayoutDashboard },
  { path: "/staff/liste-staff", label: "Liste staff", icon: Users },
  { path: "/staff/bot", label: "Bot Panel", icon: Bot },
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
          {NAV_ITEMS.filter((n) => n.path !== "/staff").map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              className="flex items-center justify-between p-3.5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-orbitron font-bold text-sm uppercase tracking-wider text-white">{label}</span>
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

// ─── Bot ─────────────────────────────────────────────────────────────────────
function BotPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="font-orbitron font-black text-lg uppercase tracking-widest text-white mb-1">Bot Panel</h2>
        <p className="text-xs text-muted-foreground">Gestion du bot Discord VOID</p>
      </div>
      <div className="p-8 border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-3 text-center">
        <Bot className="w-10 h-10 text-muted-foreground/20" />
        <p className="font-orbitron text-sm uppercase tracking-wider text-muted-foreground/40">Bientôt disponible</p>
        <p className="text-xs text-muted-foreground/30">Cette section est en cours de développement.</p>
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
    if (location.startsWith("/staff/bot")) return <BotPage />;
    return <Overview session={session!} isAdmin={isAdmin} />;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-16 md:pt-20 flex">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-white/5 bg-white/[0.01] pt-8 pb-6 px-3">
          <p className="text-[10px] font-orbitron text-muted-foreground/30 uppercase tracking-widest px-3 mb-3">
            Staff Panel
          </p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
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
          </nav>
        </aside>

        {/* ── Mobile bottom tabs ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-white/5 flex">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
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
