# Kindi-UI — Development Conventions

Angular 20 SPA, **prerendered static SSR (SSG)** for SEO, deployed to Vercel.
The app is fully standalone (`bootstrapApplication`) with lazy `loadComponent`
routes. `ng build` prerenders each public route to static HTML at build time.

## SSR-first rules (enforced in CI — follow them or the build breaks)

1. **Never touch `window`, `document`, `localStorage`, or `navigator`
   unguarded.** During prerender these globals don't exist — a bare usage
   crashes `ng build`.
   - Use `isBrowser()` from `@core/utils/platform` to guard.
   - Use `storageGet` / `storageSet` / `storageRemove` from
     `@core/utils/storage` instead of `localStorage.*`.
   - Guarding example:
     ```ts
     if (isBrowser()) {
       window.scrollTo({ top: 0, behavior: 'smooth' });
     }
     ```
   - `scripts/check-browser-globals.mjs` fails CI if a file uses these globals
     without importing `isBrowser`/`isPlatformBrowser`.

2. **Adding a new public (guest) route?** Register it in BOTH files:
   - `src/app/app.routes.ts` (the router config)
   - `src/app/app.routes.server.ts` with `renderMode: RenderMode.Prerender`
     so it gets statically prerendered (SEO). Auth-gated routes
     (`/admin/**`, `/user/**`) stay `RenderMode.Client`.
   - Server route `path` values must NOT start with a leading slash.
   - `scripts/check-server-routes.mjs` fails CI if a public route is missing
     from the server config.

3. **Dynamic/parameterized routes** (`/social/:postId`): use
   `RenderMode.Client` unless you provide `getPrerenderParams` (Angular will
   error otherwise).

## i18n & prerender

- Translations load via `@ngx-translate`. On the server, `ServerTranslateLoader`
  (`src/app/server-translate.loader.ts`) reads `src/assets/i18n/*.json` from
  disk so prerendered HTML contains real translated text (not raw keys).
- `appInitializer` returns the `translate.use()` promise so bootstrap waits for
  translations before the first render / snapshot.

## Building

```bash
npm run env && ng build                 # dev build
npm run build:production                # prod + prerender (what Vercel runs)
node scripts/smoke-prerender.mjs        # verify static HTML per route
```

## Deploy

- `vercel.json`: build command `npm run build:production`, output directory
  `dist/kindi-ui/browser`. The `index.csr.html` → `index.html` rewrite
  prevents Vercel serving the CSR shell for `/`.
- CI (`.github/workflows/ci.yml`) runs the three check scripts before build.
