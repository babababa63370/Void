import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "wouter";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("void_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("void_cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("void_cookie_consent", "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-background/95 backdrop-blur-md"
        >
          {/* Top accent line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Cookie className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nous utilisons des cookies pour améliorer votre expérience sur nos plateformes.{" "}
                <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
                  En savoir plus
                </Link>
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={decline}
                className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
              >
                Refuser
              </button>
              <button
                onClick={accept}
                className="clip-path-button font-orbitron text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 transition-all hover:box-glow"
              >
                Accepter
              </button>
              <button
                onClick={decline}
                aria-label="Fermer"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
