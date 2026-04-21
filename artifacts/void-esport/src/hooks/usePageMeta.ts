import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
  /** If provided, used as the canonical URL. Otherwise current location is used. */
  canonical?: string;
  /** OpenGraph image URL. Defaults to /opengraph.jpg */
  image?: string;
}

const GLITCH_CHARS = ["█", "▓", "▒", "░", "╬", "║", "═", "▄", "▀", "■", "◆", "◈", "▪", "Ø", "§", "†", "◊", "▲", "▼", "◉"];
const SITE_ORIGIN = "https://void.meonix.me";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/opengraph.jpg`;

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

function setLink(rel: string, href: string, extraAttrs: Record<string, string> = {}) {
  const attrSelector = Object.entries(extraAttrs)
    .map(([k, v]) => `[${k}="${v}"]`)
    .join("");
  const selector = `link[rel="${rel}"]${attrSelector}`;
  let el = document.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    for (const [k, v] of Object.entries(extraAttrs)) el.setAttribute(k, v);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function isCrawler(): boolean {
  if (typeof navigator === "undefined") return false;
  return /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp|linkedin|google/i.test(
    navigator.userAgent,
  );
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

export function usePageMeta({ title, description, canonical, image }: PageMeta) {
  useEffect(() => {
    const fullTitle = `${title} — VOID Esport`;
    const url = canonical ?? window.location.href.split("#")[0].split("?")[0];
    const ogImage = image ?? DEFAULT_OG_IMAGE;

    document.title = fullTitle;
    setMetaTag('meta[name="description"]', description);
    setMetaTag('meta[property="og:title"]', fullTitle);
    setMetaTag('meta[property="og:description"]', description);
    setMetaTag('meta[property="og:url"]', url);
    setMetaTag('meta[property="og:image"]', ogImage);
    setMetaTag('meta[name="twitter:title"]', fullTitle);
    setMetaTag('meta[name="twitter:description"]', description);
    setMetaTag('meta[name="twitter:image"]', ogImage);
    setLink("canonical", url);

    // Skip the glitch animation entirely for crawlers and reduced-motion users —
    // a flickering <title> can confuse SEO tools and is bad for accessibility.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (isCrawler() || reduced) return;

    let glitchTimeout: ReturnType<typeof setTimeout>;
    const runGlitch = () => {
      if (document.visibilityState !== "visible") return;
      document.title = glitchString(fullTitle);
      glitchTimeout = setTimeout(() => {
        document.title = fullTitle;
      }, 120);
    };

    // Wait 30s before first glitch (crawlers usually finish rendering by then)
    // and then run every 30s instead of every 5s.
    const startTimeout = setTimeout(() => {
      runGlitch();
    }, 30000);
    const interval = setInterval(runGlitch, 30000);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
      clearTimeout(glitchTimeout);
      document.title = fullTitle;
    };
  }, [title, description, canonical, image]);
}
