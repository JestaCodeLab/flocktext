// Prerenders the marketing routes (/, /pricing, /contact) to static HTML
// after `vite build`, so crawlers and link-unfurlers that don't execute JS
// get real content and correct per-route meta tags. Every other route stays
// a pure client-rendered SPA (served via dist/index.html's SPA fallback).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// dist/index.html doubles as the SPA fallback shell for every non-marketing
// route (/login, /app, etc. all rewrite to it) - so the "/" route's
// prerendered output can't live there too, or those routes would flash the
// marketing home page and inherit its <title>. It gets its own file instead,
// with an explicit vercel.json rewrite mapping "/" to it.
function outputPathFor(routePath) {
  if (routePath === '/') return path.join(distDir, '__marketing-home.html');
  return path.join(distDir, routePath.replace(/^\//, ''), 'index.html');
}

async function main() {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf-8');

  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { render, prerenderRoutes } = await vite.ssrLoadModule('/src/entry-server.tsx');
    const { SITE_URL } = await vite.ssrLoadModule('/src/pages/marketing/data/seo.ts');

    for (const routePath of prerenderRoutes) {
      const { html, title, description, url, image, imageWidth, imageHeight } = render(routePath);

      const page = template
        .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
        .replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
        .replace(/<link rel="canonical" href=".*?"\s*\/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`)
        .replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
        .replace(/<meta property="og:url" content=".*?"\s*\/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
        .replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${escapeHtml(image)}" />`)
        .replace(/<meta property="og:image:width" content=".*?"\s*\/>/, `<meta property="og:image:width" content="${imageWidth}" />`)
        .replace(/<meta property="og:image:height" content=".*?"\s*\/>/, `<meta property="og:image:height" content="${imageHeight}" />`)
        .replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta name="twitter:description" content=".*?"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
        .replace(/<meta name="twitter:image" content=".*?"\s*\/>/, `<meta name="twitter:image" content="${escapeHtml(image)}" />`)
        .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

      const outFile = outputPathFor(routePath);
      await mkdir(path.dirname(outFile), { recursive: true });
      await writeFile(outFile, page);
      console.log(`Prerendered ${routePath} -> ${path.relative(root, outFile)}`);
    }

    const today = new Date().toISOString().slice(0, 10);
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${prerenderRoutes
  .map((routePath) => `  <url>\n    <loc>${escapeHtml(`${SITE_URL}${routePath}`)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
  .join('\n')}
</urlset>
`;
    await writeFile(path.join(distDir, 'sitemap.xml'), sitemap);
    console.log(`Wrote sitemap.xml -> ${prerenderRoutes.length} routes`);
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
