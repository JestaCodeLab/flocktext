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

    for (const routePath of prerenderRoutes) {
      const { html, title, description } = render(routePath);

      const page = template
        .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
        .replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
        .replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
        .replace('<div id="root"></div>', `<div id="root">${html}</div>`);

      const outFile = outputPathFor(routePath);
      await mkdir(path.dirname(outFile), { recursive: true });
      await writeFile(outFile, page);
      console.log(`Prerendered ${routePath} -> ${path.relative(root, outFile)}`);
    }
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
