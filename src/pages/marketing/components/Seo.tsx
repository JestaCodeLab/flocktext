import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  url: string;
  image: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  jsonLd?: Record<string, unknown>;
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

function removeMetaTag(attr: 'name' | 'property', key: string) {
  document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)?.remove();
}

function setCanonicalLink(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(jsonLd: Record<string, unknown> | undefined) {
  let el = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld]');
  if (!jsonLd) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo-jsonld', '');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(jsonLd);
}

/**
 * Client-side fallback only — sets title/meta on navigation between marketing
 * pages. The authoritative tags for first load/crawlers are baked in by
 * scripts/prerender.mjs at build time.
 */
export function Seo({ title, description, url, image, type = 'website', publishedTime, jsonLd }: SeoProps) {
  useEffect(() => {
    document.title = title;
    setMetaTag('name', 'description', description);
    setCanonicalLink(url);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:image', image);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);
    if (publishedTime) {
      setMetaTag('property', 'article:published_time', publishedTime);
    } else {
      removeMetaTag('property', 'article:published_time');
    }
    setJsonLd(jsonLd);
  }, [title, description, url, image, type, publishedTime, jsonLd]);

  return null;
}
