import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, Gift, Target, ExternalLink, Sparkles } from "lucide-react";
import NotFound from "@/pages/not-found";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useI18n } from "@/i18n/context";

interface PublicTip {
  id: number;
  amountCents: number;
  currency: string;
  donorName: string | null;
  message: string | null;
  receivedAt: string;
}

interface PublicData {
  enabled: boolean;
  paypalUrl: string;
  goalAmountCents: number;
  goalLabel: string;
  showDonors: boolean;
  totalCents: number;
  count: number;
  recent: PublicTip[];
}

type State =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "ready"; data: PublicData };

function formatAmount(cents: number, currency: string): string {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Donate() {
  const { t } = useI18n();
  usePageMeta({
    title: t("donate_metaTitle"),
    description: t("donate_metaDesc"),
  });

  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    fetch("/api/tips/public")
      .then(async (res) => {
        if (res.status === 404) {
          setState({ kind: "disabled" });
          return;
        }
        if (!res.ok) throw new Error("fetch_failed");
        const data = (await res.json()) as PublicData;
        setState({ kind: "ready", data });
      })
      .catch(() => setState({ kind: "disabled" }));
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (state.kind === "disabled") {
    return <NotFound />;
  }

  const { data } = state;
  const currency = data.recent[0]?.currency ?? "EUR";
  const hasGoal = data.goalAmountCents > 0;
  const progress = hasGoal
    ? Math.min(100, Math.round((data.totalCents / data.goalAmountCents) * 100))
    : 0;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 pt-28 md:pt-36 pb-16 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-primary/30 bg-primary/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="font-orbitron text-[11px] uppercase tracking-widest text-primary">
              {t("donate_badge")}
            </span>
          </div>
          <h1 className="font-orbitron font-black text-4xl md:text-6xl uppercase tracking-tight text-white mb-4 text-glow">
            {t("donate_title")}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {t("donate_subtitle")}
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="grid grid-cols-2 gap-3 md:gap-4 mb-6"
        >
          <div className="border border-white/10 bg-[#0a0a0e] p-5 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60">
                {t("donate_statTotal")}
              </span>
            </div>
            <p className="font-orbitron font-black text-2xl md:text-4xl text-white">
              {formatAmount(data.totalCents, currency)}
            </p>
          </div>
          <div className="border border-white/10 bg-[#0a0a0e] p-5 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60">
                {t("donate_statCount")}
              </span>
            </div>
            <p className="font-orbitron font-black text-2xl md:text-4xl text-white">
              {data.count}
            </p>
          </div>
        </motion.div>

        {/* Goal */}
        {hasGoal && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="border border-white/10 bg-[#0a0a0e] p-5 md:p-6 mb-6"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[10px] font-orbitron uppercase tracking-widest text-muted-foreground/60 truncate">
                  {data.goalLabel || t("donate_goal")}
                </span>
              </div>
              <span className="font-orbitron text-xs uppercase tracking-wider text-primary shrink-0">
                {progress}%
              </span>
            </div>
            <div className="relative h-2.5 bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-primary to-accent"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-muted-foreground/50">
              <span>{formatAmount(data.totalCents, currency)}</span>
              <span>{formatAmount(data.goalAmountCents, currency)}</span>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.a
          href={data.paypalUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="clip-path-button w-full inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 py-5 transition-all hover:box-glow"
          data-testid="link-donate-paypal"
        >
          <Heart className="w-5 h-5" />
          {t("donate_ctaPaypal")}
          <ExternalLink className="w-4 h-4 opacity-60" />
        </motion.a>

        {/* Recent donors */}
        {data.showDonors && data.recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mt-10"
          >
            <h2 className="font-orbitron font-bold text-sm uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              {t("donate_recentTitle")}
            </h2>
            <div className="space-y-2">
              {data.recent.map((tip, i) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  className="flex items-center justify-between gap-3 p-4 border border-white/5 bg-[#0a0a0e]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-orbitron font-bold text-sm text-white truncate">
                      {tip.donorName || t("donate_anonymous")}
                    </p>
                    {tip.message && (
                      <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                        "{tip.message}"
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-muted-foreground/40 mt-1">
                      {formatDate(tip.receivedAt)}
                    </p>
                  </div>
                  <span className="font-orbitron font-black text-base md:text-lg text-primary shrink-0">
                    {formatAmount(tip.amountCents, tip.currency)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <p className="text-center text-[11px] text-muted-foreground/40 mt-10">
          {t("donate_thanks")}
        </p>
      </div>
    </div>
  );
}
