import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";
import { SiDiscord, SiX, SiYoutube, SiTwitch } from "react-icons/si";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-12 md:py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src={logoPath} alt="VOID Logo" className="w-10 h-10 object-contain" />
              <span className="font-orbitron font-bold text-2xl tracking-widest text-white">VOID</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
              Forged in darkness, driven by competition. VOID is the premier Brawl Stars esport community for players who demand excellence and thrive in the void.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-none clip-path-button bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all">
                <SiDiscord className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-none clip-path-button bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all">
                <SiX className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-none clip-path-button bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all">
                <SiYoutube className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-none clip-path-button bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/5 transition-all">
                <SiTwitch className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-orbitron font-semibold text-white tracking-wider mb-6">Navigate</h4>
            <ul className="space-y-3">
              <li><a href="#about" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wide">About</a></li>
              <li><a href="#roster" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wide">Roster</a></li>
              <li><a href="#achievements" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wide">Legacy</a></li>
              <li><a href="#join" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wide">Join</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-orbitron font-semibold text-white tracking-wider mb-6">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wide">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wide">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm uppercase tracking-wide">Rules</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">
            © {new Date().getFullYear()} VOID ESPORTS. ALL RIGHTS RESERVED.
          </p>
          <p className="text-muted-foreground/50 text-xs tracking-widest">
            NOT AFFILIATED WITH SUPERCELL.
          </p>
        </div>
      </div>
    </footer>
  );
}