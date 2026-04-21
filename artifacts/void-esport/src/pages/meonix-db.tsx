import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Loader2,
  ShieldCheck,
  Download,
  Trash2,
  RefreshCw,
  HardDriveDownload,
  ArrowRightLeft,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Server,
  Clock,
  FileJson,
} from "lucide-react";
import NotFound from "@/pages/not-found";
import { usePageMeta } from "@/hooks/usePageMeta";

const ALLOWED_ID = "1243206708604702791";
const STORAGE_KEY = "void_player_session";

interface Session {
  discordId: string;
  username: string;
  avatar: string | null;
  token: string;
}

interface DbInfo {
  connected: boolean;
  error: string | null;
  tables: Record<string, number>;
  configured?: boolean;
}

interface Status {
  current: DbInfo;
  old: DbInfo;
}

interface Backup {
  name: string;
  size: number;
  createdAt: string;
}

interface MigrationReport {
  table: string;
  copied: number;
  skipped: number;
  error?: string;
}

type AccessState = "loading" | "granted" | "denied";

function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DbCard({ title, info, badge }: { title: string; info: DbInfo; badge: string }) {
  const tableEntries = Object.entries(info.tables);
  const totalRows = tableEntries.reduce((sum, [, n]) => sum + (n > 0 ? n : 0), 0);

  return (
    <div className="border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center border ${info.connected ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-red-500/40 bg-red-500/10 text-red-400"}`}>
            <Server className="w-4 h-4" />
          </div>
          <div>
            <p className="font-orbitron font-bold text-sm uppercase tracking-widest text-white">{title}</p>
            <p className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60">{badge}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-[10px] font-orbitron uppercase tracking-widest border ${info.connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
          {info.connected ? "OK" : info.configured === false ? "Non configurée" : "Erreur"}
        </span>
      </div>

      {info.error && (
        <p className="text-xs text-red-400/80 font-mono mb-3 break-all">{info.error}</p>
      )}

      {info.connected && (
        <div className="space-y-1.5">
          {tableEntries.length === 0 && (
            <p className="text-xs text-muted-foreground/60 font-mono">Aucune table</p>
          )}
          {tableEntries.map(([table, count]) => (
            <div key={table} className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">{table}</span>
              <span className="text-white">{count >= 0 ? count.toLocaleString("fr-FR") : "—"}</span>
            </div>
          ))}
          {tableEntries.length > 0 && (
            <div className="flex items-center justify-between text-xs font-orbitron uppercase tracking-wider pt-2 mt-2 border-t border-white/5">
              <span className="text-muted-foreground/60">Total</span>
              <span className="text-violet-400 font-bold">{totalRows.toLocaleString("fr-FR")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MeonixDb() {
  usePageMeta({ title: "DB Admin — VOID Esport", description: "Gestion de la base de données" });

  const [access, setAccess] = useState<AccessState>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [migrationMode, setMigrationMode] = useState<"merge" | "replace">("merge");
  const [migrationReport, setMigrationReport] = useState<MigrationReport[] | null>(null);
  const [confirmMigrate, setConfirmMigrate] = useState(false);

  // Auth
  useEffect(() => {
    const stored = getSession();
    if (!stored) {
      setAccess("denied");
      return;
    }
    fetch("/api/auth/verify", { headers: { Authorization: `Bearer ${stored.token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { discordId: string }) => {
        if (data.discordId !== ALLOWED_ID) throw new Error("forbidden");
        setSession(stored);
        setAccess("granted");
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setAccess("denied");
      });
  }, []);

  const showToast = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${session?.token ?? ""}`,
    "Content-Type": "application/json",
  }), [session]);

  const loadStatus = useCallback(async () => {
    if (!session) return;
    setStatusLoading(true);
    try {
      const r = await fetch("/api/meonix/db/status", { headers: authHeaders() });
      if (!r.ok) throw new Error();
      setStatus(await r.json());
    } catch {
      showToast("err", "Impossible de charger le statut");
    } finally {
      setStatusLoading(false);
    }
  }, [session, authHeaders]);

  const loadBackups = useCallback(async () => {
    if (!session) return;
    try {
      const r = await fetch("/api/meonix/db/backups", { headers: authHeaders() });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setBackups(d.backups);
    } catch {
      showToast("err", "Impossible de charger les backups");
    }
  }, [session, authHeaders]);

  useEffect(() => {
    if (access === "granted") {
      loadStatus();
      loadBackups();
    }
  }, [access, loadStatus, loadBackups]);

  const createBackup = async (source: "current" | "old") => {
    setBusy(`backup-${source}`);
    try {
      const r = await fetch("/api/meonix/db/backup", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ source }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "failed");
      showToast("ok", `Backup créé : ${d.totalRows} lignes (${d.tables} tables)`);
      await loadBackups();
    } catch (err: any) {
      showToast("err", err?.message ?? "Backup échoué");
    } finally {
      setBusy(null);
    }
  };

  const downloadBackup = (name: string) => {
    const a = document.createElement("a");
    a.href = `/api/meonix/db/backups/${name}/download?_=${Date.now()}`;
    // Workaround for needing auth header on download: open in new tab with token via a fetch+blob
    fetch(a.href, { headers: { Authorization: `Bearer ${session?.token ?? ""}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => showToast("err", "Téléchargement échoué"));
  };

  const deleteBackup = async (name: string) => {
    if (!confirm(`Supprimer le backup "${name}" ?`)) return;
    setBusy(`del-${name}`);
    try {
      const r = await fetch(`/api/meonix/db/backups/${name}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!r.ok) throw new Error();
      showToast("ok", "Backup supprimé");
      await loadBackups();
    } catch {
      showToast("err", "Suppression échouée");
    } finally {
      setBusy(null);
    }
  };

  const runMigration = async () => {
    setBusy("migrate");
    setMigrationReport(null);
    try {
      const r = await fetch("/api/meonix/db/migrate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ mode: migrationMode }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMigrationReport(d.report ?? null);
        throw new Error(d.error ?? "failed");
      }
      setMigrationReport(d.report);
      const totalCopied = (d.report as MigrationReport[]).reduce((s, x) => s + x.copied, 0);
      showToast("ok", `Migration OK : ${totalCopied} lignes copiées`);
      await loadStatus();
    } catch (err: any) {
      showToast("err", err?.message ?? "Migration échouée");
    } finally {
      setBusy(null);
      setConfirmMigrate(false);
    }
  };

  if (access === "loading") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (access === "denied") return <NotFound />;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-4 right-4 z-50 px-4 py-3 border ${toast.kind === "ok" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300"} flex items-center gap-2 shadow-lg`}
        >
          {toast.kind === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-xs font-orbitron">{toast.msg}</span>
        </motion.div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/meonix" className="inline-flex items-center gap-2 text-xs font-orbitron uppercase tracking-widest text-muted-foreground hover:text-white transition-colors mb-3">
              <ArrowLeft className="w-3 h-3" />
              Retour
            </a>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center border border-violet-500/40 bg-violet-500/10 text-violet-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-orbitron font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">DB Admin</h1>
                <p className="text-xs text-muted-foreground/70 font-mono mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-violet-400" />
                  Meonix only · {session?.username}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={loadStatus}
            disabled={statusLoading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/20 text-xs font-orbitron uppercase tracking-widest text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${statusLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* DB Status */}
        <section className="mb-10">
          <h2 className="text-[11px] font-orbitron uppercase tracking-[0.3em] text-muted-foreground/50 mb-4">État des bases</h2>
          {!status ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-orbitron">Chargement…</span>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <DbCard title="Nouvelle DB" badge="DATABASE_URL · cible" info={status.current} />
              <DbCard title="Ancienne DB" badge="OLD_DATABASE_URL · source" info={status.old} />
            </div>
          )}
        </section>

        {/* Backups */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-orbitron uppercase tracking-[0.3em] text-muted-foreground/50">Backups</h2>
            <div className="flex gap-2">
              <button
                onClick={() => createBackup("current")}
                disabled={busy === "backup-current" || !status?.current.connected}
                className="inline-flex items-center gap-2 px-3 py-2 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-orbitron uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy === "backup-current" ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDriveDownload className="w-3 h-3" />}
                Backup nouvelle
              </button>
              <button
                onClick={() => createBackup("old")}
                disabled={busy === "backup-old" || !status?.old.connected}
                className="inline-flex items-center gap-2 px-3 py-2 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-orbitron uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy === "backup-old" ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDriveDownload className="w-3 h-3" />}
                Backup ancienne
              </button>
            </div>
          </div>

          <div className="border border-white/10 bg-white/[0.02]">
            {backups.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground/60">
                <FileJson className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-orbitron uppercase tracking-widest">Aucun backup</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {backups.map((b) => (
                  <div key={b.name} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileJson className="w-4 h-4 text-violet-400/60 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-white truncate">{b.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground/60 flex items-center gap-2 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDate(b.createdAt)}
                          <span>·</span>
                          {formatSize(b.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => downloadBackup(b.name)}
                        className="p-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBackup(b.name)}
                        disabled={busy === `del-${b.name}`}
                        className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        title="Supprimer"
                      >
                        {busy === `del-${b.name}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Migration */}
        <section>
          <h2 className="text-[11px] font-orbitron uppercase tracking-[0.3em] text-muted-foreground/50 mb-4">Migration ancienne → nouvelle</h2>
          <div className="border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-start gap-3 mb-5 p-3 border border-amber-500/20 bg-amber-500/5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Copie les lignes de l'ancienne DB vers la nouvelle. Seules les tables et colonnes communes sont copiées.
                <strong className="text-amber-300"> Fais un backup avant.</strong>
              </p>
            </div>

            <div className="mb-5">
              <p className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60 mb-2">Mode</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMigrationMode("merge")}
                  className={`flex-1 px-4 py-3 border text-left transition-colors ${migrationMode === "merge" ? "border-violet-500/50 bg-violet-500/10" : "border-white/10 hover:border-white/20"}`}
                >
                  <p className={`text-xs font-orbitron uppercase tracking-widest ${migrationMode === "merge" ? "text-violet-300" : "text-white"}`}>
                    Merge (upsert)
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Met à jour si la clé existe, insère sinon</p>
                </button>
                <button
                  onClick={() => setMigrationMode("replace")}
                  className={`flex-1 px-4 py-3 border text-left transition-colors ${migrationMode === "replace" ? "border-red-500/50 bg-red-500/10" : "border-white/10 hover:border-white/20"}`}
                >
                  <p className={`text-xs font-orbitron uppercase tracking-widest ${migrationMode === "replace" ? "text-red-300" : "text-white"}`}>
                    Replace (truncate)
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Vide les tables cibles avant d'insérer</p>
                </button>
              </div>
            </div>

            {!confirmMigrate ? (
              <button
                onClick={() => setConfirmMigrate(true)}
                disabled={!status?.old.connected || !status?.current.connected}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-sm font-orbitron uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Lancer la migration
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmMigrate(false)}
                  disabled={busy === "migrate"}
                  className="flex-1 px-4 py-3 border border-white/10 hover:border-white/20 text-xs font-orbitron uppercase tracking-widest text-muted-foreground hover:text-white transition-colors disabled:opacity-40"
                >
                  Annuler
                </button>
                <button
                  onClick={runMigration}
                  disabled={busy === "migrate"}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-orbitron uppercase tracking-widest transition-colors disabled:opacity-40"
                >
                  {busy === "migrate" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Confirmer ({migrationMode})
                </button>
              </div>
            )}

            {migrationReport && migrationReport.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/5">
                <p className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60 mb-3">Rapport</p>
                <div className="space-y-1.5">
                  {migrationReport.map((row) => (
                    <div key={row.table} className="flex items-center justify-between text-xs font-mono py-1.5 px-3 bg-white/[0.02]">
                      <span className="text-white">{row.table}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400">+{row.copied}</span>
                        {row.skipped > 0 && <span className="text-muted-foreground">~{row.skipped}</span>}
                        {row.error && (
                          <span className="text-red-400 text-[10px] max-w-[200px] truncate" title={row.error}>
                            {row.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
