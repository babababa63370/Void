import { motion } from "framer-motion";
import { SiDiscord } from "react-icons/si";
import { ChevronRight, Trophy, Crosshair, Users, Target, Zap, Shield, Crown } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070')] bg-cover bg-center opacity-5 mix-blend-luminosity" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Grid Pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <img src={logoPath} alt="VOID Esports" className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-8xl font-black font-orbitron tracking-tighter mb-6 uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 text-glow"
          >
            Embrace<br />The <span className="text-primary">Void</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 font-medium tracking-wide"
          >
            The premier competitive Brawl Stars community. No mercy. No retreat. Only absolute dominance.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-6"
          >
            <a 
              href="#" 
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 text-lg transition-all hover:box-glow-strong"
            >
              <SiDiscord className="w-6 h-6" />
              Enter The Void
            </a>
            <a 
              href="#about" 
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground font-orbitron font-bold uppercase tracking-wider px-8 py-4 text-lg transition-all backdrop-blur-sm"
            >
              Discover
              <ChevronRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-orbitron">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent" />
        </motion.div>
      </section>

      {/* MANIFESTO / ABOUT */}
      <section id="about" className="py-24 md:py-32 relative bg-void-gradient border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-sm font-orbitron text-primary uppercase tracking-[0.3em] mb-4">The Manifesto</h2>
              <h3 className="text-4xl md:text-5xl font-black font-orbitron uppercase tracking-tight mb-8">
                Born in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Darkness</span>
              </h3>
              <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <p>
                  VOID is not just a clan. We are a collective of elite competitors who thrive in the high-pressure environment of Brawl Stars esports.
                </p>
                <p>
                  Founded on principles of relentless improvement, strategic mastery, and unwavering loyalty. When you face us, you face the void. And the void always consumes.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-6">
                <div className="border border-white/10 bg-black/40 p-6 clip-path-card hover:border-primary/50 transition-colors">
                  <Target className="w-8 h-8 text-primary mb-4" />
                  <h4 className="font-orbitron font-bold text-white uppercase mb-2">Precision</h4>
                  <p className="text-sm text-muted-foreground">Flawless execution in every draft, every rotation, every match.</p>
                </div>
                <div className="border border-white/10 bg-black/40 p-6 clip-path-card hover:border-primary/50 transition-colors">
                  <Shield className="w-8 h-8 text-primary mb-4" />
                  <h4 className="font-orbitron font-bold text-white uppercase mb-2">Resilience</h4>
                  <p className="text-sm text-muted-foreground">We adapt, we overcome. No setback is permanent in the void.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square flex items-center justify-center"
            >
              <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_20s_linear_infinite] opacity-50" />
              <div className="absolute inset-4 border border-primary/40 rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-50" />
              <div className="absolute inset-8 border border-white/10 rounded-full animate-[spin_10s_linear_infinite] opacity-50" />
              <div className="bg-black border border-white/10 p-12 clip-path-card relative z-10 box-glow backdrop-blur-sm">
                <img src={logoPath} alt="VOID Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DIVISIONS / ROSTER */}
      <section id="roster" className="py-24 md:py-32 bg-black border-t border-white/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-orbitron text-primary uppercase tracking-[0.3em] mb-4">The Vanguard</h2>
            <h3 className="text-4xl md:text-5xl font-black font-orbitron uppercase tracking-tight mb-6">
              Elite Divisions
            </h3>
            <p className="text-muted-foreground text-lg">
              Our rosters are segmented by skill, dedication, and competitive drive. Find your place within the hierarchy of the Void.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Division 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 clip-path-card" />
              <div className="bg-[#0f0f13] border border-white/10 p-8 h-full clip-path-card relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:border-primary/50">
                <Crown className="w-12 h-12 text-primary mb-6" />
                <h4 className="text-2xl font-orbitron font-bold uppercase text-white mb-2">VOID Alpha</h4>
                <div className="text-xs font-orbitron text-primary tracking-widest mb-6">TIER 1 • ESPORTS</div>
                <p className="text-muted-foreground mb-8">
                  The apex predators. Our primary competitive roster participating in major tournaments and high-stakes scrims.
                </p>
                <ul className="space-y-3 mb-8 border-t border-white/10 pt-6">
                  <li className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requirement</span>
                    <span className="font-orbitron text-white">Masters +</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Focus</span>
                    <span className="font-orbitron text-white">Tournaments</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Division 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 clip-path-card" />
              <div className="bg-[#0f0f13] border border-white/10 p-8 h-full clip-path-card relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:border-primary/50">
                <Crosshair className="w-12 h-12 text-white mb-6" />
                <h4 className="text-2xl font-orbitron font-bold uppercase text-white mb-2">VOID Omega</h4>
                <div className="text-xs font-orbitron text-muted-foreground tracking-widest mb-6">TIER 2 • ACADEMY</div>
                <p className="text-muted-foreground mb-8">
                  The proving grounds. High-potential players grinding to hone their skills and earn a spot on the Alpha roster.
                </p>
                <ul className="space-y-3 mb-8 border-t border-white/10 pt-6">
                  <li className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requirement</span>
                    <span className="font-orbitron text-white">Legendary III+</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Focus</span>
                    <span className="font-orbitron text-white">Scrims / Dev</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Division 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 clip-path-card" />
              <div className="bg-[#0f0f13] border border-white/10 p-8 h-full clip-path-card relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:border-primary/50">
                <Users className="w-12 h-12 text-white mb-6" />
                <h4 className="text-2xl font-orbitron font-bold uppercase text-white mb-2">VOID Nexus</h4>
                <div className="text-xs font-orbitron text-muted-foreground tracking-widest mb-6">TIER 3 • COMMUNITY</div>
                <p className="text-muted-foreground mb-8">
                  The foundation. A highly active community of skilled players pushing ranks and participating in server events.
                </p>
                <ul className="space-y-3 mb-8 border-t border-white/10 pt-6">
                  <li className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requirement</span>
                    <span className="font-orbitron text-white">Mythic +</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Focus</span>
                    <span className="font-orbitron text-white">Ranked Grind</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS MARQUEE */}
      <section id="achievements" className="py-20 bg-primary/5 border-y border-white/5 overflow-hidden flex flex-col justify-center">
        <div className="container mx-auto px-4 mb-12 text-center">
          <h2 className="text-sm font-orbitron text-primary uppercase tracking-[0.3em] mb-4">Our Legacy</h2>
          <h3 className="text-3xl font-black font-orbitron uppercase tracking-tight">
            Hall of Fame
          </h3>
        </div>
        
        <div className="relative w-full flex overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-16 shrink-0">
                <div className="flex items-center gap-4 text-white/50">
                  <Trophy className="w-8 h-8 text-primary" />
                  <span className="font-orbitron text-2xl font-bold uppercase">BSEC S4 Champions</span>
                </div>
                <div className="flex items-center gap-4 text-white/50">
                  <Zap className="w-8 h-8 text-accent" />
                  <span className="font-orbitron text-2xl font-bold uppercase">Top 10 Global PL</span>
                </div>
                <div className="flex items-center gap-4 text-white/50">
                  <Trophy className="w-8 h-8 text-primary" />
                  <span className="font-orbitron text-2xl font-bold uppercase">ESL Weekly Winners</span>
                </div>
                <div className="flex items-center gap-4 text-white/50">
                  <Zap className="w-8 h-8 text-accent" />
                  <span className="font-orbitron text-2xl font-bold uppercase">100k+ Club Trophies</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / JOIN */}
      <section id="join" className="py-32 relative overflow-hidden">
        {/* Cinematic background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=2070')] bg-cover bg-center opacity-10 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/20 blur-[150px] pointer-events-none rounded-t-full" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto border border-white/10 bg-black/60 backdrop-blur-md p-12 md:p-20 clip-path-slant"
          >
            <div className="mb-8 flex justify-center">
              <img src={logoPath} alt="VOID Logo" className="w-24 h-24 object-contain" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black font-orbitron uppercase tracking-tight mb-6">
              Ready to step into the <span className="text-primary text-glow">Void?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Join our Discord server to apply for a roster spot or become part of the community. Read the requirements channel upon entry.
            </p>
            <a 
              href="#" 
              className="clip-path-button inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-10 py-5 text-xl transition-all hover:box-glow-strong w-full sm:w-auto"
            >
              <SiDiscord className="w-6 h-6" />
              Join The Discord
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Global Marquee Animation definition */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}} />
    </div>
  );
}