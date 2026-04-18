import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Trophy, Zap, Target, Flame, Users, Calendar, DollarSign, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useI18n } from "@/i18n/context";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const featureIcons = [Trophy, Target, Zap, Flame];

interface MatcherinoEvent {
  id: number;
  title: string;
  kind: string;
  startAt: string | null;
  endAt: string | null;
  totalBalance: number;
  participantsCount: number;
  heroImg: string;
  backgroundImg: string;
  thumbnailImg: string;
  gameId: number | null;
  gameTitle: string | null;
  gameImage: string | null;
  gameSlug: string | null;
  fetchedAt: string;
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Matcherino() {
  const { t, lang } = useI18n();

  usePageMeta({
    title: "Matcherino — VOID Esport",
    description: t("matcherino_heroDesc"),
  });

  const features = [
    { icon: featureIcons[0], titleKey: "matcherino_f1Title", descKey: "matcherino_f1Desc" },
    { icon: featureIcons[1], titleKey: "matcherino_f2Title", descKey: "matcherino_f2Desc" },
    { icon: featureIcons[2], titleKey: "matcherino_f3Title", descKey: "matcherino_f3Desc" },
    { icon: featureIcons[3], titleKey: "matcherino_f4Title", descKey: "matcherino_f4Desc" },
  ];

  const [events, setEvents] = useState<MatcherinoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const loadEvents = (fresh = false) => {
    if (fresh) setRefreshing(true);
    else setLoading(true);
    setError(false);

    const url = fresh
      ? `${baseUrl}/api/matcherino/events/refresh`
      : `${baseUrl}/api/matcherino/events`;

    fetch(url, { method: fresh ? "POST" : "GET" })
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data: { events: MatcherinoEvent[] }) => {
        setEvents(data.events);
        if (data.events.length > 0) {
          const latest = data.events.reduce((a, b) =>
            new Date(a.fetchedAt) > new Date(b.fetchedAt) ? a : b,
          );
          setLastSync(latest.fetchedAt);
        }
      })
      .catch(() => setError(true))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => { loadEvents(); }, []);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[75vh] sm:min-h-[85vh] flex items-center justify-center pt-16 sm:pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,100vw)] h-[min(700px,100vw)] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 border border-primary/30 bg-primary/10 text-primary font-orbitron text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-5 sm:mb-6"
          >
            <Flame className="w-3 h-3" />
            {t("matcherino_badge")}
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-orbitron tracking-tighter uppercase mb-4 sm:mb-6"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-primary text-glow">
              Matcherino
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-xl sm:max-w-2xl font-medium leading-relaxed mb-8 sm:mb-10 px-2"
          >
            {t("matcherino_heroDesc")}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="w-full sm:w-auto px-4 sm:px-0"
          >
            <a
              href="https://matcherino.com/u/VOID%20e-sport/2423612/events"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 sm:px-8 py-4 text-sm sm:text-base transition-all hover:box-glow active:scale-95"
            >
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("matcherino_heroCta")}
            </a>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* LIVE EVENTS */}
      <section className="py-14 sm:py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-14"
          >
            <p className="text-[10px] sm:text-xs font-orbitron tracking-[0.3em] uppercase text-primary mb-3 sm:mb-4">
              {t("matcherino_eventsLabel")}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              {t("matcherino_eventsTitle")}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-5">
              {lastSync && (
                <span className="text-[10px] text-muted-foreground font-orbitron tracking-wider">
                  {t("matcherino_eventsLastSync")} · {formatDate(lastSync, lang)}
                </span>
              )}
              <button
                onClick={() => loadEvents(true)}
                disabled={refreshing || loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-orbitron text-[10px] tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? t("matcherino_eventsRefreshing") : t("matcherino_eventsRefresh")}
              </button>
            </div>
          </motion.div>

          {loading && (
            <div className="flex items-center justify-center gap-3 text-muted-foreground py-12 sm:py-16">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary" />
              <span className="font-orbitron text-xs sm:text-sm tracking-wider">{t("matcherino_eventsLoading")}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-3 text-muted-foreground py-12 sm:py-16">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              <span className="font-orbitron text-xs sm:text-sm tracking-wider">{t("matcherino_eventsError")}</span>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center text-muted-foreground py-12 sm:py-16">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-primary/30 mx-auto mb-4" />
              <p className="font-orbitron text-xs sm:text-sm tracking-wider">{t("matcherino_eventsEmpty")}</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-px sm:bg-white/5 max-w-5xl mx-auto">
              {events.map((event, i) => (
                <motion.a
                  key={event.id}
                  href={`https://matcherino.com/tournaments/${event.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.08}
                  className="group bg-background border border-white/5 sm:border-0 p-0 hover:bg-primary/5 transition-colors flex flex-col overflow-hidden active:scale-[0.99]"
                >
                  {/* Image */}
                  {(event.backgroundImg || event.heroImg || event.gameImage) ? (
                    <div className="w-full h-40 sm:h-36 overflow-hidden relative">
                      <img
                        src={event.backgroundImg || event.heroImg || `${event.gameImage ?? ""}-/resize/600x/`}
                        alt={event.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent pointer-events-none" />
                      {event.gameTitle && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-background/70 backdrop-blur-sm border border-primary/20 text-primary font-orbitron text-[9px] tracking-widest uppercase">
                          {event.gameTitle}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-40 sm:h-36 flex items-center justify-center bg-primary/5 border-b border-primary/10">
                      <Trophy className="w-10 h-10 text-primary/30" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex flex-col gap-3 p-4 sm:p-5 flex-1">
                    <h3 className="font-orbitron font-bold text-sm sm:text-sm tracking-wide uppercase text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>

                    {/* Meta */}
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-auto">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-primary/60 shrink-0" />
                        {event.startAt ? (
                          <>
                            <span>{formatDate(event.startAt, lang)}</span>
                            <span className="text-primary/40">·</span>
                            <span>{formatTime(event.startAt, lang)}</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-primary/60 shrink-0" />
                        <span>{event.participantsCount} {t("matcherino_eventsParticipants")}</span>
                        {event.totalBalance > 0 && (
                          <>
                            <span className="text-primary/40">·</span>
                            <DollarSign className="w-3 h-3 text-primary/60 shrink-0" />
                            <span className="text-primary font-semibold">${event.totalBalance}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] font-orbitron uppercase tracking-wider text-primary">
                        {t("matcherino_eventsJoin")}
                      </span>
                      <ExternalLink className="w-3 h-3 text-primary/60 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-14 sm:py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-14"
          >
            <p className="text-[10px] sm:text-xs font-orbitron tracking-[0.3em] uppercase text-primary mb-3 sm:mb-4">
              {t("matcherino_featuresLabel")}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              {t("matcherino_featuresTitle")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-px sm:bg-white/5 max-w-4xl mx-auto">
            {features.map(({ icon: Icon, titleKey, descKey }, i) => (
              <motion.div
                key={titleKey}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.08}
                className="bg-background border border-white/5 sm:border-0 p-5 sm:p-8 group hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 border border-primary/20 bg-primary/10 mb-4 sm:mb-5 group-hover:border-primary/40 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <h3 className="font-orbitron font-bold text-xs sm:text-sm tracking-wider uppercase text-foreground mb-2">
                  {t(titleKey as any)}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{t(descKey as any)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,100vw)] h-[min(500px,100vw)] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center max-w-xl sm:max-w-2xl mx-auto"
          >
            <p className="text-[10px] sm:text-xs font-orbitron tracking-[0.3em] uppercase text-primary mb-3 sm:mb-4">
              {t("matcherino_ctaLabel")}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase mb-4 sm:mb-5 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              {t("matcherino_ctaTitle")}
            </h2>
            <p className="text-muted-foreground mb-8 sm:mb-10 text-sm sm:text-base md:text-lg leading-relaxed">
              {t("matcherino_ctaDesc")}
            </p>
            <div className="px-4 sm:px-0">
              <a
                href="https://matcherino.com/u/VOID%20e-sport/2423612/events"
                target="_blank"
                rel="noopener noreferrer"
                className="clip-path-button w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 sm:px-8 py-4 text-sm sm:text-base transition-all hover:box-glow active:scale-95"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                {t("matcherino_ctaBtn")}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
