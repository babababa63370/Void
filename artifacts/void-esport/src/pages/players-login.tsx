import { useState } from "react";
import { motion } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";
import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";
import { usePageMeta } from "@/hooks/usePageMeta";

const STORAGE_KEY = "void_player_session";

export default function PlayersLogin() {
  usePageMeta({ title: "Player Portal", description: "VOID Esport Player Portal" });

  const [tag, setTag] = useState("");
  const [showTag, setShowTag] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tag.trim();
    if (!trimmed) return;

    setStatus("loading");
    setErrorMsg("");

    const sessionData = { discordTag: trimmed, loginAt: new Date().toISOString() };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));

    try {
      await fetch("/api/players/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordTag: trimmed }),
      });
    } catch {
      // DB failure is silent — localStorage is already saved
    }

    setStatus("success");
  };

  const stored = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as { discordTag: string; loginAt: string }) : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-[#0f0f13] border border-white/10 p-8 clip-path-card">

          {/* Logo + title */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <img src={logoPath} alt="VOID" className="w-16 h-16 object-contain relative z-10 rounded-xl" />
            </div>
            <h1 className="font-orbitron font-black text-xl uppercase tracking-widest text-white text-glow">VOID</h1>
            <p className="text-xs font-orbitron text-muted-foreground/60 uppercase tracking-[0.3em] mt-1">Player Portal</p>
          </div>

          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <CheckCircle2 className="w-12 h-12 text-primary" />
              <p className="font-orbitron text-white text-center text-sm uppercase tracking-wider">Connected</p>
              <p className="text-muted-foreground text-xs text-center font-mono">{tag.trim()}</p>
              <button
                onClick={() => { setStatus("idle"); setTag(""); }}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors uppercase tracking-wider font-orbitron mt-2"
              >
                Change account
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {stored && status === "idle" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary font-orbitron uppercase tracking-wider"
                >
                  <SiDiscord className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{stored.discordTag}</span>
                </motion.div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground/70 block">
                  Discord Tag
                </label>
                <div className="relative">
                  <SiDiscord className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type={showTag ? "text" : "password"}
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="username or user#0000"
                    autoComplete="off"
                    spellCheck={false}
                    required
                    className="w-full bg-black/40 border border-white/10 focus:border-primary/50 outline-none text-white placeholder:text-muted-foreground/30 text-sm font-mono px-10 py-3 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTag(!showTag)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showTag ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-destructive text-xs font-orbitron uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !tag.trim()}
                className="clip-path-button w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 py-3.5 text-sm transition-all hover:box-glow"
              >
                {status === "loading" ? (
                  <span className="animate-pulse">Connecting…</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Access Portal
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/25 font-orbitron uppercase tracking-widest mt-6">
          VOID Esport · Restricted
        </p>
      </motion.div>
    </div>
  );
}
