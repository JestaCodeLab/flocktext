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

// Vercel serves a matching static file before it ever evaluates a rewrite
// (see https://vercel.com/docs/project-configuration/vercel-json#rewrites -
// "precedence is given to the filesystem prior to rewrites being applied").
// dist/index.html is a static file at the root, so a rewrite with source
// "/" is never reached - the prerendered "/" output must be index.html
// itself. The pristine vite-built shell (used as the SPA fallback for
// /login, /app, etc.) is preserved separately as app-shell.html before we
// overwrite index.html.
function outputPathFor(routePath) {
  if (routePath === '/') return path.join(distDir, 'index.html');
  return path.join(distDir, routePath.replace(/^\//, ''), 'index.html');
}

async function main() {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf-8');
  await writeFile(path.join(distDir, 'app-shell.html'), template);

  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { render, prerenderRoutes } = await vite.ssrLoadModule('/src/entry-server.tsx');
    const { SITE_URL } = await vite.ssrLoadModule('/src/pages/marketing/data/seo.ts');

    for (const routePath of prerenderRoutes) {
      const { html, title, description, url, image, imageWidth, imageHeight, type, publishedTime, jsonLd } =
        render(routePath);

      // article:published_time and the JSON-LD block only apply to blog posts -
      // built separately and spliced in before </head> since the base template
      // has no placeholder tags for them (unlike the og/twitter meta below,
      // which always exist in the template and are swapped via .replace()).
      const extraHead = [
        publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />` : '',
        jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '',
      ]
        .filter(Boolean)
        .join('\n    ');

      const page = template
        .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
        .replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
        .replace(/<link rel="canonical" href=".*?"\s*\/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`)
        .replace(/<meta property="og:type" content=".*?"\s*\/>/, `<meta property="og:type" content="${escapeHtml(type ?? 'website')}" />`)
        .replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
        .replace(/<meta property="og:url" content=".*?"\s*\/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
        .replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${escapeHtml(image)}" />`)
        .replace(/<meta property="og:image:width" content=".*?"\s*\/>/, `<meta property="og:image:width" content="${imageWidth}" />`)
        .replace(/<meta property="og:image:height" content=".*?"\s*\/>/, `<meta property="og:image:height" content="${imageHeight}" />`)
        .replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta name="twitter:description" content=".*?"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
        .replace(/<meta name="twitter:image" content=".*?"\s*\/>/, `<meta name="twitter:image" content="${escapeHtml(image)}" />`)
        .replace('</head>', extraHead ? `    ${extraHead}\n  </head>` : '</head>')
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
