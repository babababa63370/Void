import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import { usePageMeta } from "@/hooks/usePageMeta";
import { motion, AnimatePresence } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { ShieldCheck, Loader2 } from "lucide-react";

const ALLOWED_ID = "1243206708604702791";
const STORAGE_KEY = "void_player_session";

interface Session {
  discordId: string;
  username: string;
  avatar: string | null;
  token: string;
}

type AccessState = "loading" | "granted" | "denied";

function avatarUrl(discordId: string, avatar: string | null, discriminator: string): string {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.webp?size=256`;
  }
  const idx = Number(
    discriminator === "0"
      ? (BigInt(discordId) >> 22n) % 6n
      : parseInt(discriminator) % 5
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

export default function Meonix() {
  usePageMeta({ title: "VOID Esport", description: "" });

  const [access, setAccess] = useState<AccessState>("loading");
  const [user, setUser] = useState<Session | null>(null);

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
        const data = await res.json() as { discordId: string; username: string; avatar: string | null };
        if (data.discordId !== ALLOWED_ID) throw new Error("forbidden");
        setUser({ ...session, discordId: data.discordId, username: data.username, avatar: data.avatar });
        setAccess("granted");
      })
      .catch(() => {
        setAccess("denied");
      });
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

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <AnimatePresence>
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg text-center"
        >
          {/* Avatar */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-110" />
            <img
              src={avatarUrl(user!.discordId, user!.avatar, "0")}
              alt={user!.username}
              className="w-28 h-28 rounded-full border-2 border-primary/60 relative z-10 shadow-[0_0_40px_rgba(124,58,237,0.4)]"
            />
            <span className="absolute bottom-0 right-0 z-20 bg-primary rounded-full p-1.5 border-2 border-background">
              <ShieldCheck className="w-4 h-4 text-white" />
            </span>
          </div>

          <h1 className="font-orbitron font-black text-3xl uppercase tracking-widest text-white text-glow mb-1">
            {user!.username}
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground/50 text-xs font-mono mb-8">
            <SiDiscord className="w-3.5 h-3.5 text-[#5865F2]" />
            {user!.discordId}
          </div>

          <div className="bg-[#0f0f13] border border-white/10 p-8 clip-path-card text-left space-y-6">
            <div className="border-b border-white/5 pb-5">
              <p className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground/40 mb-1">Statut</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-orbitron font-bold text-white uppercase tracking-wider text-sm">Membre VOID</span>
              </div>
            </div>

            <div className="border-b border-white/5 pb-5">
              <p className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground/40 mb-1">Accès</p>
              <p className="font-orbitron text-primary text-sm uppercase tracking-wider">Panel Joueur · Privé</p>
            </div>

            <div>
              <p className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground/40 mb-1">Jeu principal</p>
              <p className="font-orbitron text-white text-sm uppercase tracking-wider">Brawl Stars</p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/20 font-orbitron uppercase tracking-widest mt-8">
            VOID Esport · Zone Restreinte
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
