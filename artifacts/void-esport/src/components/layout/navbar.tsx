import { Link } from "wouter";
import { SiDiscord } from "react-icons/si";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoPath from "@assets/purple_black_emblem_without_void_c4a1470f_1776350974040.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src={logoPath} alt="VOID Logo" className="w-12 h-12 object-contain" />
          <span className="font-orbitron font-bold text-2xl tracking-widest text-white text-glow">VOID</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase">About</a>
          <a href="#roster" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase">Roster</a>
          <a href="#achievements" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase">Legacy</a>
          <a href="#join" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase">Join</a>
        </nav>

        <div className="hidden md:block">
          <a 
            href="#" 
            className="clip-path-button inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 py-3 transition-all hover:box-glow"
          >
            <SiDiscord className="w-5 h-5" />
            Enter Void
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-foreground p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-background border-b border-white/5 p-4 flex flex-col gap-4">
          <a href="#about" className="p-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase" onClick={() => setIsOpen(false)}>About</a>
          <a href="#roster" className="p-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase" onClick={() => setIsOpen(false)}>Roster</a>
          <a href="#achievements" className="p-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase" onClick={() => setIsOpen(false)}>Legacy</a>
          <a href="#join" className="p-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase" onClick={() => setIsOpen(false)}>Join</a>
          <a 
            href="#" 
            className="clip-path-button inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-orbitron font-bold uppercase tracking-wider px-6 py-4 mt-2"
            onClick={() => setIsOpen(false)}
          >
            <SiDiscord className="w-5 h-5" />
            Enter Void
          </a>
        </div>
      )}
    </header>
  );
}