import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Target,
  Link2,
  X,
  Pencil,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  CloudDownload,
} from "lucide-react";
import { Link } from "wouter";
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

interface PayPalStatus {
  configured: boolean;
  environment: "live" | "sandbox";
  lastSync: string | null;
  lastError: string | null;
}

interface Settings {
  enabled: boolean;
  paypalUrl: string;
  goalAmountCents: number;
  goalLabel: string;
  showDonors: boolean;
  paypal?: PayPalStatus;
}

interface SyncResult {
  inserted: number;
  scanned: number;
  windowStart: string;
  windowEnd: string;
  pages: number;
}

interface Tip {
  id: number;
  amountCents: number;
  currency: string;
  donorName: string | null;
  message: string | null;
  source: string;
  receivedAt: string;
  createdAt: string;
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

function formatAmount(cents: number, currency: string): string {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
  disabled,
  testId,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-orbitron font-bold text-sm text-white">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        disabled={disabled}
        data-testid={testId}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          value ? "bg-primary" : "bg-white/10"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function TipForm({
  initial,
  onSubmit,
  onCancel,
  saving,
}: {
  initial: Partial<Tip>;
  onSubmit: (data: {
    amount: number;
    currency: string;
    donorName: string;
    message: string;
    receivedAt: string;
  }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [amount, setAmount] = useState(
    initial.amountCents != null ? (initial.amountCents / 100).toString() : "",
  );
  const [currency, setCurrency] = useState(initial.currency ?? "EUR");
  const [donorName, setDonorName] = useState(initial.donorName ?? "");
  const [message, setMessage] = useState(initial.message ?? "");
  const [receivedAt, setReceivedAt] = useState(
    initial.receivedAt
      ? new Date(initial.receivedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );

  const numericAmount = Number(amount.replace(",", "."));
  const valid = Number.isFinite(numericAmount) && numericAmount > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        className="relative z-10 w-full md:max-w-lg bg-[#0d0d12] border border-white/10 md:rounded-lg overflow-hidden"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <h3 className="font-orbitron font-bold text-sm uppercase tracking-widest text-white">
              {initial.id ? "Modifier le don" : "Nouveau don"}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60">
                Montant
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                data-testid="input-tip-amount"
                className="mt-1 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white font-mono focus:border-primary/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60">
                Devise
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:border-primary/60 focus:outline-none"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60">
              Nom du donateur (vide = anonyme)
            </label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Anonyme"
              data-testid="input-tip-donor"
              className="mt-1 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:border-primary/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60">
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={280}
              placeholder="Merci pour votre soutien !"
              className="mt-1 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:border-primary/60 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60">
              Date de réception
            </label>
            <input
              type="datetime-local"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              className="mt-1 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:border-primary/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/5 bg-white/[0.02]">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-orbitron uppercase tracking-wider text-muted-foreground hover:text-white"
          >
            Annuler
          </button>
          <button
            disabled={!valid || saving}
            onClick={() =>
              onSubmit({
                amount: numericAmount,
                currency,
                donorName: donorName.trim(),
                message: message.trim(),
                receivedAt: new Date(receivedAt).toISOString(),
              })
            }
            data-testid="button-tip-save"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-orbitron uppercase tracking-wider disabled:opacity-40 hover:bg-primary/90"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Enregistrer
          </button>
        </div>

        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </motion.div>
    </motion.div>
  );
}

export default function MeonixTips() {
  usePageMeta({ title: "Tips Admin", description: "" });

  const [access, setAccess] = useState<AccessState>("loading");
  const [user, setUser] = useState<Session | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingTip, setEditingTip] = useState<Partial<Tip> | null>(null);
  const [savingTip, setSavingTip] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Local form state for goal label / paypal url (debounced save)
  const [paypalUrl, setPaypalUrl] = useState("");
  const [goalLabel, setGoalLabel] = useState("");
  const [goalAmount, setGoalAmount] = useState("");

  const loadAll = useCallback(async (token: string) => {
    setRefreshing(true);
    try {
      const [settingsRes, tipsRes] = await Promise.all([
        fetch("/api/tips/settings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/tips", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (settingsRes.ok) {
        const s = (await settingsRes.json()) as Settings;
        setSettings(s);
        setPaypalUrl(s.paypalUrl);
        setGoalLabel(s.goalLabel);
        setGoalAmount(s.goalAmountCents > 0 ? (s.goalAmountCents / 100).toString() : "");
      }
      if (tipsRes.ok) {
        const data = (await tipsRes.json()) as { tips: Tip[] };
        setTips(data.tips);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session?.token) {
      setAccess("denied");
      return;
    }

    fetch("/api/auth/verify", { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid");
        const data = (await res.json()) as {
          discordId: string;
          username: string;
          avatar: string | null;
        };
        if (data.discordId !== ALLOWED_ID) throw new Error("forbidden");
        setUser({ ...session, discordId: data.discordId, username: data.username, avatar: data.avatar });
        setAccess("granted");
        void loadAll(session.token);
      })
      .catch(() => setAccess("denied"));
  }, [loadAll]);

  async function patchSettings(patch: Partial<{ enabled: boolean; paypalUrl: string; goalAmountCents: number; goalLabel: string; showDonors: boolean }>) {
    if (!user) return;
    setSavingSettings(true);
    try {
      const res = await fetch("/api/tips/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const next = (await res.json()) as Settings;
        setSettings(next);
      }
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveTip(data: {
    amount: number;
    currency: string;
    donorName: string;
    message: string;
    receivedAt: string;
  }) {
    if (!user || !editingTip) return;
    setSavingTip(true);
    try {
      const url = editingTip.id ? `/api/tips/${editingTip.id}` : "/api/tips";
      const method = editingTip.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          amountCents: Math.round(data.amount * 100),
          currency: data.currency,
          donorName: data.donorName || null,
          message: data.message || null,
          receivedAt: data.receivedAt,
        }),
      });
      if (res.ok) {
        await loadAll(user.token);
        setEditingTip(null);
      }
    } finally {
      setSavingTip(false);
    }
  }

  async function switchPayPalEnv(env: "live" | "sandbox") {
    if (!user) return;
    setSyncError(null);
    try {
      const res = await fetch("/api/tips/paypal-env", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ env }),
      });
      if (res.ok) {
        const data = (await res.json()) as { paypal: PayPalStatus };
        setSettings((prev) => (prev ? { ...prev, paypal: data.paypal } : prev));
      }
    } catch (err) {
      setSyncError(String(err));
    }
  }

  async function runPayPalSync() {
    if (!user) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/tips/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string;
          detail?: string;
        };
        setSyncError(err.detail || err.error || `HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as {
        ok: true;
        result: SyncResult;
        paypal: PayPalStatus;
      };
      setSyncResult(data.result);
      setSettings((prev) => (prev ? { ...prev, paypal: data.paypal } : prev));
      // Reload tips list to show newly inserted ones
      await loadAll(user.token);
    } catch (err) {
      setSyncError(String(err));
    } finally {
      setSyncing(false);
    }
  }

  async function deleteTip(id: number) {
    if (!user) return;
    if (!confirm("Supprimer ce don ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tips/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        setTips((prev) => prev.filter((t) => t.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (access === "loading") {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (access === "denied") return <NotFound />;
  if (!settings || !user) return null;

  const totalCents = tips.reduce((sum, t) => sum + t.amountCents, 0);
  const displayCurrency = tips[0]?.currency ?? "EUR";
  const progress =
    settings.goalAmountCents > 0
      ? Math.min(100, Math.round((totalCents / settings.goalAmountCents) * 100))
      : 0;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4">
        {/* Top nav */}
        <div className="pt-6 flex items-center justify-between gap-2">
          <Link
            href="/meonix"
            className="inline-flex items-center gap-2 text-xs font-orbitron uppercase tracking-widest text-white/40 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Meonix
          </Link>
          <button
            onClick={() => void loadAll(user.token)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-[11px] font-orbitron uppercase tracking-wider text-muted-foreground/50 active:text-primary transition-colors py-2 px-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        {/* Header */}
        <div className="pt-10 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/30 bg-primary/10 mb-4">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span className="font-orbitron text-[10px] uppercase tracking-widest text-primary">
                Meonix · Tips Admin
              </span>
            </div>
            <h1 className="font-orbitron font-black text-2xl md:text-3xl uppercase tracking-tight text-white">
              Page de dons
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Contrôle l'affichage de la page <span className="text-primary font-mono">/donate</span>, l'objectif et la liste des dons reçus.
            </p>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="border border-white/10 bg-[#0a0a0e] p-4">
            <p className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60 mb-1">
              Total reçu
            </p>
            <p className="font-orbitron font-black text-xl text-white">
              {formatAmount(totalCents, displayCurrency)}
            </p>
          </div>
          <div className="border border-white/10 bg-[#0a0a0e] p-4">
            <p className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60 mb-1">
              Nombre de dons
            </p>
            <p className="font-orbitron font-black text-xl text-white">{tips.length}</p>
          </div>
        </div>

        {/* Settings */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="border border-white/10 bg-[#0a0a0e] p-5 mb-6"
        >
          <h2 className="font-orbitron font-bold text-xs uppercase tracking-widest text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Paramètres
          </h2>

          <div className="divide-y divide-white/5">
            <ToggleRow
              label="Activer la page /donate"
              description="Désactivé = redirection vers 404 + lien masqué dans la navbar."
              value={settings.enabled}
              onChange={(v) => void patchSettings({ enabled: v })}
              disabled={savingSettings}
              testId="toggle-tips-enabled"
            />
            <ToggleRow
              label="Afficher les donateurs"
              description="Liste publique des derniers dons (nom + message)."
              value={settings.showDonors}
              onChange={(v) => void patchSettings({ showDonors: v })}
              disabled={savingSettings}
              testId="toggle-tips-donors"
            />
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                Lien PayPal
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="url"
                  value={paypalUrl}
                  onChange={(e) => setPaypalUrl(e.target.value)}
                  placeholder="https://www.paypal.com/paypalme/..."
                  data-testid="input-paypal-url"
                  className="flex-1 bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white font-mono focus:border-primary/60 focus:outline-none"
                />
                <button
                  onClick={() => void patchSettings({ paypalUrl })}
                  disabled={savingSettings || paypalUrl === settings.paypalUrl}
                  data-testid="button-save-paypal"
                  className="px-3 py-2 bg-primary/20 border border-primary/40 text-primary text-xs font-orbitron uppercase tracking-wider disabled:opacity-40 hover:bg-primary/30"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  Objectif (€)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  onBlur={() => {
                    const n = Number(goalAmount.replace(",", "."));
                    const cents = Number.isFinite(n) ? Math.round(n * 100) : 0;
                    if (cents !== settings.goalAmountCents) {
                      void patchSettings({ goalAmountCents: cents });
                    }
                  }}
                  placeholder="0"
                  data-testid="input-goal-amount"
                  className="mt-1 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white font-mono focus:border-primary/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60">
                  Libellé objectif
                </label>
                <input
                  type="text"
                  value={goalLabel}
                  onChange={(e) => setGoalLabel(e.target.value)}
                  onBlur={() => {
                    if (goalLabel !== settings.goalLabel) {
                      void patchSettings({ goalLabel });
                    }
                  }}
                  placeholder="Cagnotte tournoi"
                  data-testid="input-goal-label"
                  className="mt-1 w-full bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:border-primary/60 focus:outline-none"
                />
              </div>
            </div>

            {settings.goalAmountCents > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] font-orbitron uppercase tracking-wider text-muted-foreground/60 mb-2">
                  <span>Progression</span>
                  <span className="text-primary">{progress}%</span>
                </div>
                <div className="h-2 bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50 pt-2">
              {settings.enabled ? (
                <>
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span>Page publique active</span>
                  <Link
                    href="/donate"
                    className="ml-auto text-primary hover:underline font-orbitron uppercase tracking-wider"
                  >
                    Voir →
                  </Link>
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 text-amber-400" />
                  <span>Page désactivée (404)</span>
                </>
              )}
            </div>
          </div>
        </motion.section>

        {/* PayPal sync */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="border border-white/10 bg-[#0a0a0e] p-5 mb-6"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-orbitron font-bold text-xs uppercase tracking-widest text-white flex items-center gap-2">
                <CloudDownload className="w-3.5 h-3.5 text-primary" />
                Sync PayPal
                {settings.paypal?.environment === "sandbox" && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-orbitron uppercase tracking-wider">
                    Sandbox
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
                Récupère automatiquement les dons reçus via l'API PayPal officielle (compte Business requis).
              </p>
            </div>
            <button
              onClick={() => void runPayPalSync()}
              disabled={syncing || !settings.paypal?.configured}
              data-testid="button-paypal-sync"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-orbitron uppercase tracking-wider transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {syncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudDownload className="w-3.5 h-3.5" />
              )}
              {syncing ? "Sync..." : "Synchroniser"}
            </button>
          </div>

          {/* Env toggle */}
          <div className="mb-4">
            <label className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60 mb-2 block">
              Environnement PayPal
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 border border-white/10">
              {(["live", "sandbox"] as const).map((env) => {
                const active = settings.paypal?.environment === env;
                return (
                  <button
                    key={env}
                    onClick={() => void switchPayPalEnv(env)}
                    disabled={syncing || active}
                    data-testid={`button-paypal-env-${env}`}
                    className={`px-3 py-2 text-[11px] font-orbitron uppercase tracking-wider transition-colors ${
                      active
                        ? env === "live"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "text-muted-foreground/60 hover:text-white border border-transparent"
                    }`}
                  >
                    {env === "live" ? "Live (production)" : "Sandbox (test)"}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-1.5 leading-relaxed">
              Si tu as créé l'app PayPal en mode <span className="text-amber-300">Sandbox</span> sur le dashboard, choisis Sandbox. Sinon, garde Live.
            </p>
          </div>

          <div className="space-y-2 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              {settings.paypal?.configured ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
              )}
              <span className="text-muted-foreground/70">
                {settings.paypal?.configured
                  ? "API PayPal configurée"
                  : "PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET manquants"}
              </span>
            </div>

            {settings.paypal?.lastSync && (
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span>Dernière sync : {formatDate(settings.paypal.lastSync)}</span>
              </div>
            )}

            {settings.paypal?.lastError && !syncResult && !syncError && (
              <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/30 text-red-300">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                <span className="break-all">Dernière erreur : {settings.paypal.lastError}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {syncError && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/30 text-red-300"
                >
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span className="break-all">{syncError}</span>
                </motion.div>
              )}
              {syncResult && !syncError && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  data-testid="text-sync-result"
                >
                  <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>
                    {syncResult.inserted} nouveau{syncResult.inserted > 1 ? "x" : ""} don
                    {syncResult.inserted > 1 ? "s" : ""} ajouté{syncResult.inserted > 1 ? "s" : ""}
                    {" "}({syncResult.scanned} transaction{syncResult.scanned > 1 ? "s" : ""} analysée{syncResult.scanned > 1 ? "s" : ""})
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[10px] text-muted-foreground/40 pt-1">
              Sync auto toutes les 5 min lors des visites de /donate. Tu peux aussi forcer manuellement.
            </p>
          </div>
        </motion.section>

        {/* Tips list */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-orbitron font-bold text-xs uppercase tracking-widest text-white flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-primary" />
              Dons reçus
              <span className="text-[10px] font-mono text-muted-foreground/40">({tips.length})</span>
            </h2>
            <button
              onClick={() => setEditingTip({})}
              data-testid="button-add-tip"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-orbitron uppercase tracking-wider transition-colors active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {tips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-white/5 bg-[#0a0a0e]">
                <Heart className="w-8 h-8 mb-3 text-muted-foreground/20" />
                <p className="font-orbitron text-[11px] uppercase tracking-widest text-muted-foreground/30">
                  Aucun don pour l'instant
                </p>
              </div>
            ) : (
              tips.map((tip, i) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="flex items-center gap-3 p-4 border border-white/5 bg-[#0a0a0e]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="font-orbitron font-bold text-white text-sm truncate">
                        {tip.donorName || (
                          <span className="text-muted-foreground/50 italic">Anonyme</span>
                        )}
                      </p>
                      <span className="text-[10px] font-mono text-muted-foreground/30">
                        #{tip.id}
                      </span>
                    </div>
                    {tip.message && (
                      <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                        "{tip.message}"
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-muted-foreground/40 mt-1">
                      {formatDate(tip.receivedAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className="font-orbitron font-black text-base text-primary"
                      data-testid={`tip-amount-${tip.id}`}
                    >
                      {formatAmount(tip.amountCents, tip.currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTip(tip)}
                        data-testid={`button-edit-tip-${tip.id}`}
                        className="w-7 h-7 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => void deleteTip(tip.id)}
                        disabled={deletingId === tip.id}
                        data-testid={`button-delete-tip-${tip.id}`}
                        className="w-7 h-7 flex items-center justify-center rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deletingId === tip.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>

        <p className="text-center text-[10px] text-muted-foreground/15 font-orbitron uppercase tracking-widest pb-8">
          VOID Esport · Tips Admin
        </p>
      </div>

      <AnimatePresence>
        {editingTip && (
          <TipForm
            initial={editingTip}
            onSubmit={saveTip}
            onCancel={() => setEditingTip(null)}
            saving={savingTip}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
