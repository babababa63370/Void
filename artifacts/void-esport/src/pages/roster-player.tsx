import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Crosshair, UserCheck, ArrowLeft, Pencil, X,
  Music, Music2, Link2, Plus, Trash2, Loader2, Save, ExternalLink,
  Image, Video, Palette, Trophy, Star, Shield, ChevronDown, ChevronUp,
} from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { useI18n } from "@/i18n/context";
import { usePageMeta } from "@/hooks/usePageMeta";
import NotFound from "@/pages/not-found";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  discordId: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  role: string | null;
  customAvatar: string | null;
  banner: string | null;
  background: string | null;
  backgroundVideo: string | null;
  cardBackground: string | null;
  font: string | null;
  music: string | null;
  links: string | null;
  brawlTag: string | null;
}

interface LinkItem { label: string; url: string }
interface Session { discordId: string; token: string }

type BgMode = "style" | "image-url" | "video";
type CardBgMode = "style" | "image-url";

interface EditState {
  customAvatar: string;
  banner: string;
  background: string;
  backgroundVideo: string;
  bgMode: BgMode;
  cardBackground: string;
  cardBgMode: CardBgMode;
  font: string;
  music: string;
  links: LinkItem[];
  brawlTag: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  alpha: { label: "Alpha", Icon: Crown, color: "text-violet-400", border: "border-violet-500/40", bg: "bg-violet-500/10", glow: "rgba(139,92,246,0.4)" },
  omega: { label: "Omega", Icon: Crosshair, color: "text-fuchsia-400", border: "border-fuchsia-500/40", bg: "bg-fuchsia-500/10", glow: "rgba(217,70,239,0.4)" },
  staff: { label: "Staff", Icon: UserCheck, color: "text-cyan-400", border: "border-cyan-500/40", bg: "bg-cyan-500/10", glow: "rgba(34,211,238,0.4)" },
} as const;

const FONTS = [
  { name: "Orbitron", gf: null },
  { name: "Rajdhani", gf: "Rajdhani:wght@400;600;700" },
  { name: "Exo 2", gf: "Exo+2:wght@400;600;700" },
  { name: "Audiowide", gf: "Audiowide" },
  { name: "Russo One", gf: "Russo+One" },
  { name: "Share Tech Mono", gf: "Share+Tech+Mono" },
  { name: "VT323", gf: "VT323" },
  { name: "Press Start 2P", gf: "Press+Start+2P" },
];

const BG_PRESETS = [
  { label: "Void", v: "linear-gradient(135deg,#0a0a0e 0%,#1a0a2e 100%)" },
  { label: "Nuit", v: "#0a0a0e" },
  { label: "Cyber", v: "linear-gradient(135deg,#0a0a1a 0%,#001a2e 100%)" },
  { label: "Sang", v: "linear-gradient(135deg,#0a0a0e 0%,#2e0808 100%)" },
  { label: "Forest", v: "linear-gradient(135deg,#080e08 0%,#0a2e0a 100%)" },
  { label: "Aurora", v: "linear-gradient(135deg,#0a0a1a 0%,#0a2e2e 100%)" },
];

const DEFAULT_BG = "linear-gradient(135deg,#0a0a0e 0%,#1a0a2e 100%)";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function discordAvatar(discordId: string, avatar: string | null, discriminator: string): string {
  if (avatar) return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.webp?size=256`;
  const idx = Number(discriminator === "0" ? (BigInt(discordId) >> 22n) % 6n : parseInt(discriminator) % 5);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function getAvatar(p: ProfileData): string {
  return p.customAvatar || discordAvatar(p.discordId, p.avatar, p.discriminator);
}

function getSession(): Session | null {
  try { const r = localStorage.getItem("void_player_session"); return r ? JSON.parse(r) as Session : null; }
  catch { return null; }
}

function parseLinks(raw: string | null): LinkItem[] {
  try { return raw ? (JSON.parse(raw) as LinkItem[]) : []; } catch { return []; }
}

function loadFont(name: string | null) {
  if (!name || name === "Orbitron") return;
  if (document.getElementById(`gf-${name}`)) return;
  const f = FONTS.find((x) => x.name === name);
  if (!f?.gf) return;
  const el = document.createElement("link");
  el.id = `gf-${name}`;
  el.rel = "stylesheet";
  el.href = `https://fonts.googleapis.com/css2?family=${f.gf}&display=swap`;
  document.head.appendChild(el);
}

function detectBgMode(bg: string | null, vid: string | null): BgMode {
  if (vid) return "video";
  if (!bg) return "style";
  if (bg.startsWith("http") || bg.startsWith("/api/storage")) return "image-url";
  return "style";
}

function detectCardBgMode(bg: string | null): CardBgMode {
  if (!bg) return "style";
  if (bg.startsWith("http")) return "image-url";
  return "style";
}

// ─── Music Player ─────────────────────────────────────────────────────────────

function MusicPlayer({ src }: { src: string }) {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.src = src;
    el.loop = true;
    el.volume = 0.5;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    return () => { el.pause(); el.src = ""; };
  }, [src]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play().catch(() => {}); setPlaying(true); }
  }

  return (
    <>
      <audio ref={audioRef} />
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={toggle}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-orbitron uppercase tracking-wider shadow-xl"
      >
        {playing ? <Music className="w-3.5 h-3.5 text-primary animate-pulse" /> : <Music2 className="w-3.5 h-3.5 text-muted-foreground/60" />}
        {playing ? t("player_musicPlaying") : t("player_musicPaused")}
      </motion.button>
    </>
  );
}

// ─── BG Section in Edit Panel ─────────────────────────────────────────────────

function BgSection({
  data, onChange,
}: {
  data: EditState;
  onChange: (updates: Partial<EditState>) => void;
}) {
  const { t } = useI18n();

  const modeBtn = (mode: BgMode, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => onChange({ bgMode: mode, ...(mode === "video" ? { background: "" } : { backgroundVideo: "" }) })}
      className={`flex-1 flex flex-col items-center gap-1 py-2.5 border text-[10px] font-orbitron uppercase tracking-wider transition-all ${data.bgMode === mode ? "border-primary text-primary bg-primary/10" : "border-white/10 text-white/40 hover:border-white/20"}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {modeBtn("style", <Palette className="w-3.5 h-3.5" />, t("player_bgColor"))}
        {modeBtn("image-url", <Image className="w-3.5 h-3.5" />, "Image URL")}
        {modeBtn("video", <Video className="w-3.5 h-3.5" />, t("player_bgVideo"))}
      </div>

      {data.bgMode === "style" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {BG_PRESETS.map((p) => (
              <button
                key={p.v}
                onClick={() => onChange({ background: p.v })}
                className={`px-2.5 py-1.5 text-[10px] font-orbitron uppercase tracking-wider border transition-all ${data.background === p.v ? "border-primary text-primary" : "border-white/10 text-white/50"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 font-mono"
            value={data.background}
            onChange={(e) => onChange({ background: e.target.value })}
            placeholder={t("player_bgHexPlaceholder")}
          />
        </div>
      )}

      {data.bgMode === "image-url" && (
        <input
          className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 font-mono"
          value={data.background}
          onChange={(e) => onChange({ background: e.target.value })}
          placeholder="https://...image.jpg"
        />
      )}

      {data.bgMode === "video" && (
        <div className="space-y-2">
          <input
            className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 font-mono"
            value={data.backgroundVideo}
            onChange={(e) => onChange({ backgroundVideo: e.target.value })}
            placeholder="https://...video.mp4"
          />
          <p className="text-[10px] text-white/25">{t("player_bgVideoHint")}</p>
        </div>
      )}
    </div>
  );
}

// ─── Card BG Section in Edit Panel ────────────────────────────────────────────

function CardBgSection({
  data, onChange,
}: {
  data: EditState;
  onChange: (updates: Partial<EditState>) => void;
}) {
  const { t } = useI18n();

  const modeBtn = (mode: CardBgMode, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => onChange({ cardBgMode: mode })}
      className={`flex-1 flex flex-col items-center gap-1 py-2.5 border text-[10px] font-orbitron uppercase tracking-wider transition-all ${data.cardBgMode === mode ? "border-primary text-primary bg-primary/10" : "border-white/10 text-white/40 hover:border-white/20"}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-white/30">{t("player_editCardBgDesc")}</p>
      <div className="flex gap-1.5">
        {modeBtn("style", <Palette className="w-3.5 h-3.5" />, t("player_bgColor"))}
        {modeBtn("image-url", <Image className="w-3.5 h-3.5" />, "Image URL")}
      </div>

      {data.cardBgMode === "style" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {BG_PRESETS.map((p) => (
              <button
                key={p.v}
                onClick={() => onChange({ cardBackground: p.v })}
                className={`px-2.5 py-1.5 text-[10px] font-orbitron uppercase tracking-wider border transition-all ${data.cardBackground === p.v ? "border-primary text-primary" : "border-white/10 text-white/50"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 font-mono"
            value={data.cardBackground}
            onChange={(e) => onChange({ cardBackground: e.target.value })}
            placeholder={t("player_bgHexPlaceholder")}
          />
        </div>
      )}

      {data.cardBgMode === "image-url" && (
        <div className="space-y-2">
          <input
            className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 font-mono"
            value={data.cardBackground}
            onChange={(e) => onChange({ cardBackground: e.target.value })}
            placeholder="https://...image.jpg"
          />
          {data.cardBackground?.startsWith("http") && (
            <div className="relative h-14 overflow-hidden border border-white/10">
              <img src={data.cardBackground} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────

function EditPanel({
  initial, token, onSave, onClose,
}: {
  initial: EditState; token: string;
  onSave: (d: EditState) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<EditState>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof EditState>(k: K, v: EditState[K]) {
    setData((prev) => ({ ...prev, [k]: v }));
  }

  function update(updates: Partial<EditState>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function setLink(i: number, field: keyof LinkItem, v: string) {
    setData((prev) => {
      const links = [...prev.links];
      links[i] = { ...links[i], [field]: v };
      return { ...prev, links };
    });
  }

  function addLink() {
    if (data.links.length >= 5) return;
    setData((prev) => ({ ...prev, links: [...prev.links, { label: "", url: "" }] }));
  }

  function removeLink(i: number) {
    setData((prev) => ({ ...prev, links: prev.links.filter((_, idx) => idx !== i) }));
  }

  async function save() {
    setSaving(true);
    try {
      const isVideo = data.bgMode === "video";
      await fetch("/api/players/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customAvatar: data.customAvatar || null,
          banner: data.banner || null,
          background: isVideo ? null : (data.background || null),
          backgroundVideo: isVideo ? (data.backgroundVideo || null) : null,
          cardBackground: data.cardBackground || null,
          font: data.font || null,
          music: data.music || null,
          links: data.links.filter((l) => l.label || l.url).length
            ? JSON.stringify(data.links.filter((l) => l.label || l.url))
            : null,
          brawlTag: data.brawlTag || null,
        }),
      });
      onSave(data);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 font-mono";
  const labelCls = "text-[10px] font-orbitron uppercase tracking-widest text-white/40 mb-1.5 block";
  const sectionCls = "space-y-1.5 pb-5 border-b border-white/5";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0d0d12] border-l border-white/10 flex flex-col shadow-2xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            <h2 className="font-orbitron font-bold text-sm uppercase tracking-widest text-white">{t("player_editTitle")}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 no-scrollbar">

          {/* Photo de profil */}
          <div className={sectionCls}>
            <label className={labelCls}>{t("player_editAvatar")}</label>
            <input className={inputCls} value={data.customAvatar} onChange={(e) => set("customAvatar", e.target.value)} placeholder="https://..." />
            <p className="text-[10px] text-white/25 mt-1">{t("player_editAvatarHint")}</p>
          </div>

          {/* Bannière */}
          <div className={sectionCls}>
            <label className={labelCls}>{t("player_editBanner")}</label>
            <input className={inputCls} value={data.banner} onChange={(e) => set("banner", e.target.value)} placeholder="https://...banner.jpg" />
          </div>

          {/* Fond de page */}
          <div className={sectionCls}>
            <label className={labelCls}>{t("player_editPageBg")}</label>
            <BgSection data={data} onChange={update} />
          </div>

          {/* Fond de carte */}
          <div className={sectionCls}>
            <label className={labelCls}>{t("player_editCardBg")}</label>
            <CardBgSection data={data} onChange={update} />
          </div>

          {/* Police */}
          <div className={sectionCls}>
            <label className={labelCls}>{t("player_editFont")}</label>
            <div className="grid grid-cols-2 gap-1.5">
              {FONTS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => set("font", f.name)}
                  style={{ fontFamily: f.name }}
                  className={`px-3 py-2.5 text-sm border text-left transition-all ${data.font === f.name ? "border-primary text-primary bg-primary/10" : "border-white/10 text-white/60 hover:border-white/20 bg-white/3"}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Musique */}
          <div className={sectionCls}>
            <label className={labelCls}>{t("player_editMusic")}</label>
            <input className={inputCls} value={data.music} onChange={(e) => set("music", e.target.value)} placeholder="https://.../song.mp3" />
            <p className="text-[10px] text-white/25 mt-1">{t("player_editMusicHint")}</p>
          </div>

          {/* Liens */}
          <div className={sectionCls}>
            <label className={labelCls}>{t("player_editLinksLabel")} ({data.links.length}/5)</label>
            <div className="space-y-2">
              {data.links.map((link, i) => (
                <div key={i} className="flex gap-1.5">
                  <div className="flex-1 space-y-1">
                    <input className={inputCls} value={link.label} onChange={(e) => setLink(i, "label", e.target.value)} placeholder={t("player_editLinksLabelInput")} />
                    <input className={inputCls} value={link.url} onChange={(e) => setLink(i, "url", e.target.value)} placeholder="https://..." />
                  </div>
                  <button onClick={() => removeLink(i)} className="self-center w-8 h-8 flex items-center justify-center text-red-400/60 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {data.links.length < 5 && (
                <button onClick={addLink} className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/15 hover:border-white/30 text-xs font-orbitron uppercase tracking-wider text-white/40 hover:text-white/60 transition-all">
                  <Plus className="w-3.5 h-3.5" /> {t("player_editLinksAdd")}
                </button>
              )}
            </div>
          </div>

          {/* Tag Brawl Stars */}
          <div className="space-y-1.5">
            <label className={labelCls}>{t("player_editBrawlTag")}</label>
            <input className={inputCls} value={data.brawlTag} onChange={(e) => set("brawlTag", e.target.value)} placeholder="#XXXXXX" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/5 shrink-0 flex gap-3">
          <button onClick={onClose} disabled={saving} className="flex-1 py-3 border border-white/10 text-white/60 text-xs font-orbitron uppercase tracking-wider hover:bg-white/5 transition-colors">
            {t("player_editCancel")}
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-orbitron uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? t("player_editSaving") : t("player_editSave")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── BrawlProfile ─────────────────────────────────────────────────────────────

interface BrawlBrawler {
  id: number;
  name: string;
  power: number;
  rank: number;
  trophies: number;
  highestTrophies: number;
  gears: { name: string; level: number }[];
  starPowers: { id: number; name: string }[];
  gadgets: { id: number; name: string }[];
}

interface BrawlPlayer {
  tag: string;
  name: string;
  nameColor: string;
  icon: { id: number };
  trophies: number;
  highestTrophies: number;
  expLevel: number;
  expPoints: number;
  isQualifiedFromChampionshipChallenge: boolean;
  victories3v3: number;
  soloVictories: number;
  duoVictories: number;
  bestRoboRumbleTime: number;
  bestTimeAsBigBrawler: number;
  club: { tag: string; name: string } | null;
  brawlers: BrawlBrawler[];
}

function BrawlProfile({ tag }: { tag: string }) {
  const [data, setData] = useState<BrawlPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  useEffect(() => {
    const clean = tag.replace(/^#/, "");
    fetch(`${baseUrl}/api/brawl/player/${encodeURIComponent(clean)}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: r.statusText })) as { error: string };
          throw new Error(err.error ?? r.statusText);
        }
        return r.json() as Promise<BrawlPlayer>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tag, baseUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-white/40 text-xs font-orbitron uppercase tracking-widest">
        Profil introuvable
      </div>
    );
  }

  const maxTrophies = Math.max(...data.brawlers.map((b) => b.highestTrophies), 1);
  const top5 = [...data.brawlers]
    .sort((a, b) => b.highestTrophies - a.highestTrophies)
    .slice(0, 5);

  const nameColor = data.nameColor?.replace("0xff", "#") ?? "#ffffff";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mt-4 w-full rounded-none border border-white/10 bg-black/50 backdrop-blur-md overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-black/30">
        <div className="flex items-center gap-2">
          <img
            src={`https://cdn.brawlify.com/profile-icons/regular/${data.icon.id}.png`}
            alt="icon"
            className="w-9 h-9 rounded-full border border-white/10 object-contain bg-white/5"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div>
            <p className="font-orbitron font-bold text-sm leading-tight" style={{ color: nameColor }}>
              {data.name}
            </p>
            <p className="text-[10px] text-white/30 font-mono">{data.tag}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/30 font-orbitron uppercase tracking-widest">Niveau</p>
          <p className="font-orbitron font-bold text-primary text-base">{data.expLevel}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-white/8 border-b border-white/8">
        <div className="flex flex-col items-center py-3 gap-0.5">
          <Trophy className="w-3.5 h-3.5 text-yellow-400 mb-0.5" />
          <p className="font-orbitron font-bold text-white text-sm">{data.trophies.toLocaleString()}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Trophées</p>
        </div>
        <div className="flex flex-col items-center py-3 gap-0.5">
          <Star className="w-3.5 h-3.5 text-orange-400 mb-0.5" />
          <p className="font-orbitron font-bold text-white text-sm">{data.highestTrophies.toLocaleString()}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Record</p>
        </div>
        <div className="flex flex-col items-center py-3 gap-0.5">
          <Shield className="w-3.5 h-3.5 text-primary mb-0.5" />
          <p className="font-orbitron font-bold text-white text-sm">{data.brawlers.length}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Brawlers</p>
        </div>
      </div>

      {/* Victories */}
      <div className="grid grid-cols-3 divide-x divide-white/8 border-b border-white/8 bg-white/[0.02]">
        <div className="flex flex-col items-center py-2.5">
          <p className="font-orbitron font-bold text-white text-xs">{data.victories3v3.toLocaleString()}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">3v3</p>
        </div>
        <div className="flex flex-col items-center py-2.5">
          <p className="font-orbitron font-bold text-white text-xs">{data.soloVictories.toLocaleString()}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Solo</p>
        </div>
        <div className="flex flex-col items-center py-2.5">
          <p className="font-orbitron font-bold text-white text-xs">{data.duoVictories.toLocaleString()}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Duo</p>
        </div>
      </div>

      {/* Club */}
      {data.club && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 text-xs text-white/50 font-orbitron">
          <span className="text-primary">🏆</span>
          <span className="truncate">{data.club.name}</span>
          <span className="text-white/20 font-mono text-[10px]">{data.club.tag}</span>
        </div>
      )}

      {/* Top Brawlers */}
      <div className="px-4 py-3">
        <p className="text-[9px] text-white/30 font-orbitron uppercase tracking-widest mb-2.5">Top Brawlers</p>
        <div className="space-y-2">
          {top5.map((b) => (
            <div key={b.id} className="flex items-center gap-3">
              <img
                src={`https://cdn.brawlify.com/brawlers/borderless/${b.id}.png`}
                alt={b.name}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-orbitron uppercase tracking-wide text-white/70 truncate">{b.name}</span>
                  <span className="text-[10px] font-orbitron text-yellow-400 ml-2 shrink-0">{b.highestTrophies.toLocaleString()}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full"
                    style={{ width: `${(b.highestTrophies / maxTrophies) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-[9px] font-orbitron text-white/25 shrink-0">Pwr {b.power}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RosterPlayer() {
  const { t } = useI18n();
  const { username } = useParams<{ username: string }>();
  const [, navigate] = useLocation();
  const decodedUsername = decodeURIComponent(username ?? "");

  const [player, setPlayer] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showBrawl, setShowBrawl] = useState(false);

  usePageMeta({
    title: player ? `${player.username} — VOID Esport` : "Joueur",
    description: player ? `Profil de ${player.username} — VOID Esport` : "",
  });

  const session = getSession();
  const isOwn = !!session && player?.discordId === session.discordId;

  const fetchProfile = useCallback(() => {
    if (!decodedUsername) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/players/profile/${encodeURIComponent(decodedUsername)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { player: ProfileData };
        setPlayer(data.player);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [decodedUsername]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { if (player?.font) loadFont(player.font); }, [player?.font]);

  const handleSave = useCallback((d: EditState) => {
    const isVideo = d.bgMode === "video";
    setPlayer((prev) => prev ? {
      ...prev,
      customAvatar: d.customAvatar || null,
      banner: d.banner || null,
      background: isVideo ? null : (d.background || null),
      backgroundVideo: isVideo ? (d.backgroundVideo || null) : null,
      cardBackground: d.cardBackground || null,
      font: d.font || null,
      music: d.music || null,
      links: d.links.length ? JSON.stringify(d.links.filter((l) => l.label || l.url)) : null,
      brawlTag: d.brawlTag || null,
    } : prev);
    loadFont(d.font || null);
    setEditOpen(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0a0e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (notFound || !player) return <NotFound />;

  const role = ROLE_CONFIG[player.role as keyof typeof ROLE_CONFIG];
  const links = parseLinks(player.links);
  const fontFamily = player.font || "Orbitron";
  const hasVideo = !!player.backgroundVideo;
  const bg = player.background || DEFAULT_BG;
  const isImageBg = bg.startsWith("http") || bg.startsWith("/api/storage");

  const editInitial: EditState = {
    customAvatar: player.customAvatar ?? "",
    banner: player.banner ?? "",
    background: player.background ?? "",
    backgroundVideo: player.backgroundVideo ?? "",
    bgMode: detectBgMode(player.background, player.backgroundVideo),
    cardBackground: player.cardBackground ?? "",
    cardBgMode: detectCardBgMode(player.cardBackground),
    font: player.font ?? "Orbitron",
    music: player.music ?? "",
    links: parseLinks(player.links),
    brawlTag: player.brawlTag ?? "",
  };

  return (
    <div className="min-h-[100dvh] relative overflow-x-hidden">
      {/* ── Background ── */}
      {hasVideo ? (
        <video
          key={player.backgroundVideo!}
          src={player.backgroundVideo!}
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-0"
        />
      ) : isImageBg ? (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${bg}")` }}
        />
      ) : (
        <div className="fixed inset-0 z-0" style={{ background: bg }} />
      )}
      {/* Overlay for readability on images/videos */}
      {(hasVideo || isImageBg) && (
        <div className="fixed inset-0 z-0 bg-black/50" />
      )}

      {/* ── Fixed overlay buttons ── */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-4 pb-2 pointer-events-none">
        <button
          onClick={() => navigate("/roster")}
          className="pointer-events-auto flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-md border border-white/10 text-white/70 hover:text-white text-xs font-orbitron uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("nav_roster")}</span>
        </button>

        {isOwn && (
          <button
            onClick={() => setEditOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-3 py-2 bg-primary/80 backdrop-blur-md border border-primary/40 text-white text-xs font-orbitron uppercase tracking-wider hover:bg-primary transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("player_editBtn")}</span>
          </button>
        )}
      </div>

      {/* ── Content (above backgrounds) ── */}
      <div className="relative z-10">
        {/* Banner */}
        <div
          className="w-full h-44 sm:h-56"
          style={
            player.banner
              ? { backgroundImage: `url("${player.banner}")`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: role ? `linear-gradient(135deg, ${role.glow}33, transparent)` : "rgba(124,58,237,0.1)" }
          }
        >
          <div className="w-full h-full bg-gradient-to-b from-transparent to-black/40" />
          {!player.banner && (
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          )}
        </div>

        {/* Avatar + info */}
        <div className="max-w-lg mx-auto px-4 pb-24">
          <div className="flex flex-col items-center -mt-16">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl scale-110 opacity-60" style={{ background: role?.glow ?? "rgba(124,58,237,0.4)" }} />
              <img
                src={getAvatar(player)}
                alt={player.username}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-black/50 relative z-10 object-cover shadow-2xl"
              />
            </div>
          </div>

          <div className="flex flex-col items-center mt-4 mb-6">
            <h1
              style={{ fontFamily }}
              className="font-bold text-2xl sm:text-3xl uppercase tracking-widest text-white text-center mb-2 drop-shadow-[0_0_20px_rgba(124,58,237,0.5)]"
            >
              {player.username}
            </h1>

            {player.brawlTag && (
              <div className="flex flex-col items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 text-sm font-mono text-white/60">
                  <span className="text-primary font-bold">#</span>
                  {player.brawlTag.replace(/^#/, "")}
                </div>
                <button
                  onClick={() => setShowBrawl((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-orbitron text-[10px] tracking-widest uppercase transition-colors active:scale-95"
                >
                  {showBrawl ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showBrawl ? "Masquer profil" : "Afficher profil"}
                </button>
                <AnimatePresence>
                  {showBrawl && <BrawlProfile tag={player.brawlTag} />}
                </AnimatePresence>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {role && (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-orbitron uppercase tracking-widest ${role.color} ${role.border} ${role.bg}`}>
                  <role.Icon className="w-3 h-3" />
                  Division {role.label}
                </span>
              )}
              <span className="flex items-center gap-1.5 px-3 py-1.5 border border-[#5865F2]/30 bg-[#5865F2]/10 text-[#5865F2] text-xs font-orbitron uppercase tracking-widest">
                <SiDiscord className="w-3 h-3" />
                VOID Esport
              </span>
            </div>
          </div>

          {/* Links */}
          {links.length > 0 && (
            <div className="space-y-2 mb-6">
              {links.map((link, i) => (
                <motion.a
                  key={i}
                  href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between px-5 py-3.5 bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/25 hover:bg-black/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Link2 className="w-3.5 h-3.5 text-primary/70" />
                    <span style={{ fontFamily }} className="text-sm font-bold text-white uppercase tracking-wider">
                      {link.label || link.url}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                </motion.a>
              ))}
            </div>
          )}

          <p className="text-center text-[10px] text-white/15 font-orbitron uppercase tracking-widest mt-8">
            {t("player_profileFooter")}
          </p>
        </div>
      </div>

      {/* ── Music player ── */}
      {player.music && <MusicPlayer src={player.music} />}

      {/* ── Edit panel ── */}
      <AnimatePresence>
        {editOpen && session && (
          <EditPanel
            initial={editInitial}
            token={session.token}
            onSave={handleSave}
            onClose={() => setEditOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
