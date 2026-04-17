import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
}

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
  }, [title, description]);
}
