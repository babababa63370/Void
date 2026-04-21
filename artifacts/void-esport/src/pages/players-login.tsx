import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { LogOut, AlertCircle, Loader2, ShieldCheck, ArrowLeft, Mail, Lock, User as UserIcon } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const STORAGE_KEY = "void_player_session";

interface PlayerUser {
  discordId: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  email?: string | null;
  authType?: "discord" | "email";
  token: string;
}

function avatarUrl(user: PlayerUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.webp?size=128`;
  }
  if (!/^\d+$/.test(user.discordId)) return `https://cdn.discordapp.com/embed/avatars/0.png`;
  const idx = Number(user.discriminator === "0" ? (BigInt(user.discordId) >> 22n) % 6n : parseInt(user.discriminator) % 5);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function getRedirectUri(): string {
  return `${window.location.origin}/players-login`;
}

const ERROR_MESSAGES: Record<string, string> = {
  discord_token_failed: "Code Discord invalide ou expiré.",
  exchange_failed: "Erreur d'authentification Discord.",
  not_configured: "Discord OAuth non configuré. Contacte un admin.",
  missing_fields: "Tous les champs sont requis.",
  invalid_email: "Email invalide.",
  password_too_short: "Mot de passe trop court (min. 8 caractères).",
  invalid_username: "Pseudo invalide (2-32 caractères).",
  email_taken: "Cet email est déjà utilisé.",
  username_taken: "Ce pseudo est déjà pris.",
  invalid_credentials: "Email ou mot de passe incorrect.",
};

export default function PlayersLogin() {
  usePageMeta({ title: "Player Portal", description: "VOID Esport Player Portal" });

  const [user, setUser] = useState<PlayerUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PlayerUser) : null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<"discord" | "login" | "signup">("discord");

  // Email form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // Handle OAuth callback: ?code=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    window.history.replaceState({}, "", window.location.pathname);

    setStatus("loading");

    fetch("/api/auth/discord/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri: getRedirectUri() }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "exchange_failed");
        }
        return res.json() as Promise<PlayerUser>;
      })
      .then((data) => {
        const session: PlayerUser = { ...data, authType: "discord" };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setUser(session);
        setStatus("idle");
      })
      .catch((err: Error) => {
        setErrorMsg(ERROR_MESSAGES[err.message] ?? "Erreur d'authentification.");
        setStatus("error");
      });
  }, []);

  const handleDiscordLogin = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/auth/discord/url?redirectUri=${encodeURIComponent(getRedirectUri())}`);
      if (!res.ok) throw new Error("not_configured");
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      setErrorMsg(ERROR_MESSAGES.not_configured);
      setStatus("error");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const endpoint = mode === "signup" ? "/api/auth/email/signup" : "/api/auth/email/login";
    const body =
      mode === "signup"
        ? { email, password, username }
        : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as PlayerUser & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "invalid_credentials");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setUser(data);
      setStatus("idle");
      setEmail("");
      setPassword("");
      setUsername("");
    } catch (err) {
      const code = (err as Error).message;
      setErrorMsg(ERROR_MESSAGES[code] ?? "Erreur. Réessaie.");
      setStatus("error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setStatus("idle");
    setErrorMsg("");
    setMode("discord");
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <a href="/" className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-xs font-orbitron uppercase tracking-widest text-white/40 hover:text-primary transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to home
      </a>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="bg-[#0f0f13] border border-white/10 p-8 clip-path-card">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <ShieldCheck className="w-12 h-12 text-primary relative z-10" />
            </div>
            <h1 className="font-orbitron font-black text-xl uppercase tracking-widest text-white text-glow">VOID</h1>
            <p className="text-xs font-orbitron text-muted-foreground/60 uppercase tracking-[0.3em] mt-1">Player Portal</p>
          </div>

          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-5"
              >
                <div className="relative">
                  <img src={avatarUrl(user)} alt={user.username} className="w-20 h-20 rounded-full border-2 border-primary/40" />
                  <span className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  </span>
                </div>

                <div className="text-center">
                  <p className="font-orbitron font-bold text-white text-sm uppercase tracking-wider">{user.username}</p>
                  <p className="text-muted-foreground/40 text-[10px] font-mono mt-1 break-all">
                    {user.authType === "email" ? user.email : `ID: ${user.discordId}`}
                  </p>
                  <p className="text-muted-foreground/30 text-[9px] font-orbitron uppercase tracking-widest mt-1">
                    {user.authType === "email" ? "Compte Email" : "Compte Discord"}
                  </p>
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
              <motion.div
                key="auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Mode tabs */}
                <div className="grid grid-cols-3 gap-1 bg-white/3 border border-white/10 p-1">
                  {(["discord", "login", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setErrorMsg("");
                        setStatus("idle");
                      }}
                      className={`text-[10px] font-orbitron uppercase tracking-wider py-2 transition-colors ${
                        mode === m ? "bg-primary/20 text-primary" : "text-muted-foreground/50 hover:text-white/70"
                      }`}
                    >
                      {m === "discord" ? "Discord" : m === "login" ? "Login" : "Sign up"}
                    </button>
                  ))}
                </div>

                {status === "error" && (
                  <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-xs text-destructive font-orbitron uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="leading-snug">{errorMsg}</span>
                  </div>
                )}

                {mode === "discord" && (
                  <>
                    <p className="text-center text-muted-foreground/50 text-sm leading-relaxed">
                      Connecte-toi avec ton compte Discord.
                    </p>
                    <button
                      onClick={handleDiscordLogin}
                      disabled={status === "loading"}
                      className="clip-path-button w-full inline-flex items-center justify-center gap-2.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-60 text-white font-orbitron font-bold uppercase tracking-wider px-6 py-4 text-sm transition-all"
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
                  </>
                )}

                {(mode === "login" || mode === "signup") && (
                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    {mode === "signup" && (
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <input
                          type="text"
                          placeholder="Pseudo"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          minLength={2}
                          maxLength={32}
                          className="w-full bg-white/3 border border-white/10 focus:border-primary/40 outline-none pl-10 pr-3 py-3 text-sm text-white placeholder:text-muted-foreground/30 transition-colors"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="w-full bg-white/3 border border-white/10 focus:border-primary/40 outline-none pl-10 pr-3 py-3 text-sm text-white placeholder:text-muted-foreground/30 transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={mode === "signup" ? 8 : undefined}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        className="w-full bg-white/3 border border-white/10 focus:border-primary/40 outline-none pl-10 pr-3 py-3 text-sm text-white placeholder:text-muted-foreground/30 transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="clip-path-button w-full inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-orbitron font-bold uppercase tracking-wider px-6 py-4 text-sm transition-all"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{mode === "signup" ? "Création…" : "Connexion…"}</span>
                        </>
                      ) : (
                        <span>{mode === "signup" ? "Créer un compte" : "Se connecter"}</span>
                      )}
                    </button>
                  </form>
                )}
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
