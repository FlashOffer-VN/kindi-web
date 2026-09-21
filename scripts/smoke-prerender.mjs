#!/usr/bin/env node
/**
 * CI check: after `ng build` (prerender/SSG), assert that each route declared
 * in `prerendered-routes.json` actually produced a static HTML file in
 * `dist/kindi-ui/browser/`.
 *
 * This guards against the Angular CLI caveat where a route can be *listed* in
 * the manifest even if its render failed silently — we want the real files.
 *
 * Usage: node scripts/smoke-prerender.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'dist/kindi-ui/prerendered-routes.json');
const browserDir = resolve(root, 'dist/kindi-ui/browser');

if (!existsSync(manifestPath)) {
  console.error('❌ dist/kindi-ui/prerendered-routes.json not found. Run `ng build` first.');
  process.exit(1);
}

const { routes } = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entries = Object.entries(routes || {});

if (!entries.length) {
  console.error('❌ prerendered-routes.json is empty — no routes were prerendered.');
  process.exit(1);
}

const missing = [];
for (const [route] of entries) {
  // "/" -> browser/index.html ; "/home" -> browser/home/index.html
  const rel = route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`;
  if (!existsSync(resolve(browserDir, rel))) {
    missing.push(route);
  }
}

if (missing.length) {
  console.error(
    `❌ ${missing.length} prerendered route(s) produced no HTML file:\n` +
      missing.map((m) => `   - ${m}`).join('\n')
  );
  process.exit(1);
}

console.log(`✅ Prerender smoke test passed: ${entries.length} routes have static HTML.`);
