import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Trophy, Zap, Target, Flame, Users, Calendar, DollarSign, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useI18n } from "@/i18n/context";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const featureIcons = [Trophy, Target, Zap, Flame];

interface MatcherinoEvent {
  id: number;
  title: string;
  kind: string;
  startAt: string;
  endAt: string | null;
  totalBalance: number;
  participantsCount: number;
  heroImg: string;
  game: {
    id: number;
    title: string;
    image: string;
  };
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
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
  const [error, setError] = useState(false);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    fetch(`${baseUrl}/api/matcherino/events`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data: { events: MatcherinoEvent[] }) => {
        setEvents(data.events);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,100vw)] h-[min(700px,100vw)] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center py-20">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/30 bg-primary/10 text-primary font-orbitron text-xs tracking-[0.25em] uppercase mb-6"
          >
            <Flame className="w-3 h-3" />
            {t("matcherino_badge")}
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-6xl sm:text-8xl md:text-9xl font-black font-orbitron tracking-tighter uppercase mb-6"
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
            className="text-base md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed mb-10"
          >
            {t("matcherino_heroDesc")}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <a
              href="https://matcherino.com/u/VOID%20e-sport/2423612/events"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 text-base transition-all hover:box-glow"
            >
              <ExternalLink className="w-5 h-5" />
              {t("matcherino_heroCta")}
            </a>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* LIVE EVENTS */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-orbitron tracking-[0.3em] uppercase text-primary mb-4">
              {t("matcherino_eventsLabel")}
            </p>
            <h2 className="text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              {t("matcherino_eventsTitle")}
            </h2>
          </motion.div>

          {loading && (
            <div className="flex items-center justify-center gap-3 text-muted-foreground py-16">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-orbitron text-sm tracking-wider">{t("matcherino_eventsLoading")}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-3 text-muted-foreground py-16">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="font-orbitron text-sm tracking-wider">{t("matcherino_eventsError")}</span>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <Trophy className="w-10 h-10 text-primary/30 mx-auto mb-4" />
              <p className="font-orbitron text-sm tracking-wider">{t("matcherino_eventsEmpty")}</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 max-w-5xl mx-auto">
              {events.map((event, i) => (
                <motion.a
                  key={event.id}
                  href={`https://matcherino.com/t/${event.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.08}
                  className="group bg-background p-6 hover:bg-primary/5 transition-colors flex flex-col gap-4"
                >
                  {event.heroImg ? (
                    <div className="w-full h-32 overflow-hidden">
                      <img
                        src={event.heroImg}
                        alt={event.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center border border-primary/10 bg-primary/5">
                      {event.game?.image ? (
                        <img
                          src={`${event.game.image}-/resize/80x80/`}
                          alt={event.game.title}
                          className="w-16 h-16 object-contain opacity-60"
                        />
                      ) : (
                        <Trophy className="w-10 h-10 text-primary/30" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-2">
                    <p className="text-xs font-orbitron text-primary tracking-widest uppercase">{event.game?.title ?? "Tournament"}</p>
                    <h3 className="font-orbitron font-bold text-sm tracking-wide uppercase text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-primary/60 shrink-0" />
                      <span className="truncate">{formatDate(event.startAt, lang)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-primary/60 shrink-0" />
                      <span>{event.participantsCount} {t("matcherino_eventsParticipants")}</span>
                    </div>
                    {event.totalBalance > 0 && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <DollarSign className="w-3 h-3 text-primary/60 shrink-0" />
                        <span className="text-primary font-semibold">${event.totalBalance} {t("matcherino_eventsPrize")}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-orbitron uppercase tracking-wider text-primary group-hover:gap-3 transition-all">
                    <ExternalLink className="w-3 h-3" />
                    {t("matcherino_eventsJoin")}
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs font-orbitron tracking-[0.3em] uppercase text-primary mb-4">
              {t("matcherino_featuresLabel")}
            </p>
            <h2 className="text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              {t("matcherino_featuresTitle")}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 max-w-4xl mx-auto">
            {features.map(({ icon: Icon, titleKey, descKey }, i) => (
              <motion.div
                key={titleKey}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.08}
                className="bg-background p-8 group hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 border border-primary/20 bg-primary/10 mb-5 group-hover:border-primary/40 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-orbitron font-bold text-sm tracking-wider uppercase text-foreground mb-2">
                  {t(titleKey as any)}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(descKey as any)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,100vw)] h-[min(500px,100vw)] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <p className="text-xs font-orbitron tracking-[0.3em] uppercase text-primary mb-4">
              {t("matcherino_ctaLabel")}
            </p>
            <h2 className="text-3xl md:text-5xl font-black font-orbitron tracking-tight uppercase mb-5 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              {t("matcherino_ctaTitle")}
            </h2>
            <p className="text-muted-foreground mb-10 text-base md:text-lg leading-relaxed">
              {t("matcherino_ctaDesc")}
            </p>
            <a
              href="https://matcherino.com/u/VOID%20e-sport/2423612/events"
              target="_blank"
              rel="noopener noreferrer"
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 text-base transition-all hover:box-glow"
            >
              <ExternalLink className="w-5 h-5" />
              {t("matcherino_ctaBtn")}
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
