import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
}

const GLITCH_CHARS = ["█", "▓", "▒", "░", "╬", "║", "═", "▄", "▀", "■", "◆", "◈", "▪", "Ø", "§", "†", "◊", "▲", "▼", "◉"];

function setMetaTag(selector: string, content: string) {
  const el = document.querySelector(selector);
  if (el) {
    el.setAttribute("content", content);
  } else {
    const [attr, val] = selector.replace("[", "").replace("]", "").split("=");
    const meta = document.createElement("meta");
    meta.setAttribute(attr.trim(), val.trim().replace(/"/g, ""));
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }
}

function glitchString(str: string): string {
  const chars = str.split("");
  const numGlitch = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < numGlitch; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    if (chars[idx] !== " ") {
      chars[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }
  }
  return chars.join("");
}

export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    const fullTitle = `${title} — VOID Esport`;
    const url = window.location.href;

    document.title = fullTitle;
    setMetaTag('meta[name="description"]', description);
    setMetaTag('meta[property="og:title"]', fullTitle);
    setMetaTag('meta[property="og:description"]', description);
    setMetaTag('meta[property="og:url"]', url);
    setMetaTag('meta[name="twitter:title"]', fullTitle);
    setMetaTag('meta[name="twitter:description"]', description);

    let glitchTimeout: ReturnType<typeof setTimeout>;

    const runGlitch = () => {
      document.title = glitchString(fullTitle);
      glitchTimeout = setTimeout(() => {
        document.title = fullTitle;
      }, 120);
    };

    const interval = setInterval(runGlitch, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(glitchTimeout);
      document.title = fullTitle;
    };
  }, [title, description]);
}
