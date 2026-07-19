import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Client-side fallback only — sets title/meta on navigation between marketing
 * pages. The authoritative tags for first load/crawlers are baked in by
 * scripts/prerender.mjs at build time.
 */
export function Seo({ title, description }: SeoProps) {
  useEffect(() => {
    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
  }, [title, description]);

  return null;
}
