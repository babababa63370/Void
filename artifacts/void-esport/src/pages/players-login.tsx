import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { LogOut, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const STORAGE_KEY = "void_player_session";

interface DiscordUser {
  discordId: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  token: string;
}

function avatarUrl(user: DiscordUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.webp?size=128`;
  }
  const idx = Number(user.discriminator === "0" ? (BigInt(user.discordId) >> 22n) % 6n : parseInt(user.discriminator) % 5);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function getRedirectUri(): string {
  return `${window.location.origin}/players-login`;
}

export default function PlayersLogin() {
  usePageMeta({ title: "Player Portal", description: "VOID Esport Player Portal" });

  const [user, setUser] = useState<DiscordUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as DiscordUser) : null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Handle OAuth callback: ?code=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    // Clean URL immediately
    window.history.replaceState({}, "", window.location.pathname);

    setStatus("loading");

    fetch("/api/auth/discord/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri: getRedirectUri() }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error ?? "exchange_failed");
        }
        return res.json() as Promise<DiscordUser>;
      })
      .then((data) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setUser(data);
        setStatus("idle");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message === "discord_token_failed" ? "Code Discord invalide ou expiré." : "Erreur d'authentification.");
        setStatus("error");
      });
  }, []);

  const handleLogin = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/auth/discord/url?redirectUri=${encodeURIComponent(getRedirectUri())}`);
      if (!res.ok) throw new Error("not_configured");
      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch {
      setErrorMsg("Discord OAuth non configuré. Contacte un admin.");
      setStatus("error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="bg-[#0f0f13] border border-white/10 p-8 clip-path-card">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <SiDiscord className="w-12 h-12 text-[#5865F2] relative z-10" />
            </div>
            <h1 className="font-orbitron font-black text-xl uppercase tracking-widest text-white text-glow">VOID</h1>
            <p className="text-xs font-orbitron text-muted-foreground/60 uppercase tracking-[0.3em] mt-1">Player Portal</p>
          </div>

          <AnimatePresence mode="wait">
            {/* Connected state */}
            {user ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-5"
              >
                <div className="relative">
                  <img
                    src={avatarUrl(user)}
                    alt={user.username}
                    className="w-20 h-20 rounded-full border-2 border-primary/40"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  </span>
                </div>

                <div className="text-center">
                  <p className="font-orbitron font-bold text-white text-sm uppercase tracking-wider">{user.username}</p>
                  <p className="text-muted-foreground/40 text-xs font-mono mt-1">ID: {user.discordId}</p>
                </div>

                <div className="w-full bg-primary/10 border border-primary/20 px-4 py-2.5 text-center">
                  <p className="text-primary font-orbitron text-xs uppercase tracking-widest">Accès accordé</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors font-orbitron uppercase tracking-wider"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Se déconnecter
                </button>
              </motion.div>
            ) : (
              /* Login state */
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <p className="text-center text-muted-foreground/50 text-sm leading-relaxed">
                  Connecte-toi avec ton compte Discord pour accéder au portail VOID.
                </p>

                {status === "error" && (
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-xs text-destructive font-orbitron uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={status === "loading"}
                  className="clip-path-button w-full inline-flex items-center justify-center gap-2.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-60 disabled:cursor-not-allowed text-white font-orbitron font-bold uppercase tracking-wider px-6 py-4 text-sm transition-all"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connexion…</span>
                    </>
                  ) : (
                    <>
                      <SiDiscord className="w-5 h-5" />
                      <span>Login with Discord</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground/25 font-orbitron uppercase tracking-widest mt-6">
          VOID Esport · Restricted
        </p>
      </motion.div>
    </div>
  );
}
