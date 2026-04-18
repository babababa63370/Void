import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, ExternalLink, Trophy, Users, Calendar, DollarSign,
  Loader2, AlertCircle, Clock, Gamepad2, Shield, Medal,
} from "lucide-react";
import { SiDiscord, SiTwitch, SiX, SiYoutube, SiInstagram } from "react-icons/si";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useI18n } from "@/i18n/context";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] } }),
};

interface EventDetail {
  id: number;
  title: string;
  kind: string;
  startAt: string | null;
  endAt: string | null;
  finalizedAt: string | null;
  totalBalance: number;
  participantsCount: number;
  playerLimit: number;
  entryFee: number;
  description: string;
  heroImg: string;
  backgroundImg: string;
  thumbnailImg: string;
  game: { id: number | null; title: string | null; image: string | null; slug: string | null };
  socials: { discord?: string; twitch?: string; twitter?: string; youtube?: string; instagram?: string; facebook?: string };
  zone: string | null;
  roles: Array<{ userId: number; userName: string; displayName: string; role: string; authProvider: string; supercellBgcolor?: string; supercellCharacter?: string }>;
  payouts: Array<{ place: number; amount: string }> | null;
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}
function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function roleBadge(role: string) {
  if (role === "bounty-admin") return { label: "Admin", cls: "text-primary border-primary/40 bg-primary/10" };
  if (role === "bounty-participant") return { label: "Participant", cls: "text-cyan-400 border-cyan-400/40 bg-cyan-400/10" };
  return { label: role, cls: "text-white/50 border-white/20 bg-white/5" };
}

export default function MatcherinoEvent() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useI18n();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  usePageMeta({
    title: event ? `${event.title} — VOID Esport` : "Matcherino — VOID Esport",
    description: event?.description || "VOID Esport tournament on Matcherino.",
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    fetch(`${baseUrl}/api/matcherino/events/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: EventDetail) => setEvent(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, baseUrl]);

  const isFinished = event?.endAt ? new Date(event.endAt) < new Date() : false;
  const coverImg = event?.backgroundImg || event?.heroImg || null;

  const socials = event?.socials ?? {};
  const hasSocials = Object.values(socials).some(Boolean);
  const admins = event?.roles?.filter((r) => r.role === "bounty-admin") ?? [];
  const participants = event?.roles?.filter((r) => r.role === "bounty-participant") ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-16 sm:pt-20 min-h-[45vh] flex flex-col justify-end overflow-hidden">
        {coverImg ? (
          <>
            <div className="absolute inset-0">
              <img src={coverImg} alt="" className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0a0a0e_0%,#1a0a2e_100%)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>
        )}

        <div className="relative z-10 container mx-auto px-4 sm:px-6 pb-10 pt-32">
          <a
            href={`${baseUrl}/matcherino`}
            className="inline-flex items-center gap-2 text-white/40 hover:text-white font-orbitron text-xs uppercase tracking-widest transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("matcherino_detail_back")}
          </a>

          {loading ? (
            <div className="flex items-center gap-3 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-orbitron text-sm tracking-wider">{t("matcherino_eventsLoading")}</span>
            </div>
          ) : error || !event ? (
            <div className="flex items-center gap-3 text-white/40">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="font-orbitron text-sm tracking-wider">{t("matcherino_detail_notFound")}</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {event.game?.image && (
                <img
                  src={`${event.game.image}-/resize/80x80/`}
                  alt={event.game.title ?? ""}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain border border-white/10 bg-white/5 shrink-0"
                />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {event.game?.title && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-primary/30 bg-primary/10 text-primary font-orbitron text-[10px] tracking-widest uppercase">
                      <Gamepad2 className="w-3 h-3" />
                      {event.game.title}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border font-orbitron text-[10px] tracking-widest uppercase ${isFinished ? "border-white/20 bg-white/5 text-white/40" : "border-green-500/40 bg-green-500/10 text-green-400"}`}>
                    {isFinished ? t("matcherino_tabFinished") : t("matcherino_tabActive")}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-orbitron uppercase tracking-tight text-white leading-tight">
                  {event.title}
                </h1>
              </div>
            </div>
          )}
        </div>
      </section>

      {!loading && !error && event && (
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl space-y-8">

            {/* STATS GRID */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="grid grid-cols-2 sm:grid-cols-4 border border-white/8 divide-x divide-white/8">
              <div className="flex flex-col items-center justify-center py-5 gap-1.5">
                <DollarSign className="w-4 h-4 text-primary mb-0.5" />
                <p className="font-orbitron font-bold text-white text-lg">
                  {event.totalBalance > 0 ? `$${event.totalBalance}` : t("matcherino_detail_free")}
                </p>
                <p className="text-[10px] font-orbitron uppercase tracking-widest text-white/30">{t("matcherino_detail_prize")}</p>
              </div>
              <div className="flex flex-col items-center justify-center py-5 gap-1.5">
                <Users className="w-4 h-4 text-primary mb-0.5" />
                <p className="font-orbitron font-bold text-white text-lg">{event.participantsCount}</p>
                <p className="text-[10px] font-orbitron uppercase tracking-widest text-white/30">{t("matcherino_detail_participants")}</p>
              </div>
              <div className="flex flex-col items-center justify-center py-5 gap-1.5">
                <Shield className="w-4 h-4 text-primary mb-0.5" />
                <p className="font-orbitron font-bold text-white text-lg">
                  {event.playerLimit > 0 ? event.playerLimit : t("matcherino_detail_unlimited")}
                </p>
                <p className="text-[10px] font-orbitron uppercase tracking-widest text-white/30">{t("matcherino_detail_limit")}</p>
              </div>
              <div className="flex flex-col items-center justify-center py-5 gap-1.5">
                <Trophy className="w-4 h-4 text-primary mb-0.5" />
                <p className="font-orbitron font-bold text-white text-lg">
                  {event.entryFee > 0 ? `$${event.entryFee}` : t("matcherino_detail_free")}
                </p>
                <p className="text-[10px] font-orbitron uppercase tracking-widest text-white/30">{t("matcherino_detail_entry")}</p>
              </div>
            </motion.div>

            {/* DATES */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="border border-white/8 bg-white/[0.02] divide-y divide-white/5">
              {event.startAt && (
                <div className="flex items-center gap-4 px-5 py-4">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-orbitron uppercase tracking-widest text-white/30 mb-0.5">{t("matcherino_eventsStart")}</p>
                    <p className="text-sm text-white font-medium">
                      {formatDate(event.startAt, lang)} · {formatTime(event.startAt, lang)}
                      {event.zone && <span className="text-white/30 text-xs ml-2">({event.zone})</span>}
                    </p>
                  </div>
                </div>
              )}
              {event.endAt && (
                <div className="flex items-center gap-4 px-5 py-4">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-orbitron uppercase tracking-widest text-white/30 mb-0.5">End</p>
                    <p className="text-sm text-white font-medium">
                      {formatDate(event.endAt, lang)} · {formatTime(event.endAt, lang)}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* DESCRIPTION */}
            {event.description && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
                className="border border-white/8 bg-white/[0.02] p-5 sm:p-6">
                <h2 className="font-orbitron font-bold text-xs uppercase tracking-widest text-white/40 mb-3">
                  {t("matcherino_detail_description")}
                </h2>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{event.description}</p>
              </motion.div>
            )}

            {/* PRIZE DISTRIBUTION */}
            {event.payouts && event.payouts.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
                className="border border-white/8 bg-white/[0.02] p-5 sm:p-6">
                <h2 className="font-orbitron font-bold text-xs uppercase tracking-widest text-white/40 mb-4">
                  {t("matcherino_detail_payouts")}
                </h2>
                <div className="space-y-2">
                  {event.payouts.map((p) => (
                    <div key={p.place} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <Medal className={`w-4 h-4 ${p.place === 1 ? "text-yellow-400" : p.place === 2 ? "text-gray-300" : p.place === 3 ? "text-orange-400" : "text-white/30"}`} />
                        <span className="font-orbitron text-xs text-white/60 uppercase tracking-wider">
                          {t("matcherino_detail_place")} {p.place}
                        </span>
                      </div>
                      <span className="font-orbitron font-bold text-primary text-sm">${p.amount}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ORGANIZERS */}
            {admins.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
                className="border border-white/8 bg-white/[0.02] p-5 sm:p-6">
                <h2 className="font-orbitron font-bold text-xs uppercase tracking-widest text-white/40 mb-4">
                  {t("matcherino_detail_organizers")}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {admins.map((r) => {
                    const badge = roleBadge(r.role);
                    return (
                      <div key={r.userId} className="flex items-center gap-2.5 border border-white/8 bg-white/[0.02] px-3 py-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-orbitron font-bold text-primary">
                            {r.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white leading-tight">{r.displayName}</p>
                          <span className={`text-[9px] font-orbitron uppercase tracking-wider border px-1 py-0.5 ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* PARTICIPANTS */}
            {participants.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}
                className="border border-white/8 bg-white/[0.02] p-5 sm:p-6">
                <h2 className="font-orbitron font-bold text-xs uppercase tracking-widest text-white/40 mb-4">
                  {t("matcherino_detail_participants")} ({participants.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {participants.map((r) => (
                    <div key={r.userId} className="flex items-center gap-2 border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-white/60">
                          {r.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-white/70 truncate">{r.displayName}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SOCIALS */}
            {hasSocials && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}
                className="border border-white/8 bg-white/[0.02] p-5 sm:p-6">
                <h2 className="font-orbitron font-bold text-xs uppercase tracking-widest text-white/40 mb-4">
                  {t("matcherino_detail_socials")}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {socials.discord && (
                    <a href={socials.discord} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 border border-[#5865F2]/30 bg-[#5865F2]/10 text-[#5865F2] hover:bg-[#5865F2]/20 transition-colors text-xs font-orbitron uppercase tracking-wider">
                      <SiDiscord className="w-3.5 h-3.5" /> Discord
                    </a>
                  )}
                  {socials.twitch && (
                    <a href={socials.twitch} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 border border-[#9146FF]/30 bg-[#9146FF]/10 text-[#9146FF] hover:bg-[#9146FF]/20 transition-colors text-xs font-orbitron uppercase tracking-wider">
                      <SiTwitch className="w-3.5 h-3.5" /> Twitch
                    </a>
                  )}
                  {socials.twitter && (
                    <a href={socials.twitter} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 border border-white/20 bg-white/5 text-white/70 hover:bg-white/10 transition-colors text-xs font-orbitron uppercase tracking-wider">
                      <SiX className="w-3.5 h-3.5" /> Twitter / X
                    </a>
                  )}
                  {socials.youtube && (
                    <a href={socials.youtube} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-orbitron uppercase tracking-wider">
                      <SiYoutube className="w-3.5 h-3.5" /> YouTube
                    </a>
                  )}
                  {socials.instagram && (
                    <a href={socials.instagram} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 border border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors text-xs font-orbitron uppercase tracking-wider">
                      <SiInstagram className="w-3.5 h-3.5" /> Instagram
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7} className="flex justify-center pt-2">
              <a
                href={`https://matcherino.com/tournaments/${event.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-white font-orbitron font-bold uppercase tracking-wider px-8 py-4 text-sm transition-all hover:box-glow clip-path-button"
              >
                <ExternalLink className="w-4 h-4" />
                {t("matcherino_detail_viewOn")}
              </a>
            </motion.div>

          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
