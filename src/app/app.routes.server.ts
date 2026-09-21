import { ServerRoute, RenderMode } from '@angular/ssr';

/**
 * Server routes for SSR / build-time prerendering (SSG).
 *
 * Public/SEO pages -> RenderMode.Prerender: rendered to static HTML at build
 * time so crawlers see real markup + per-page meta.
 * Auth-gated routes -> RenderMode.Client: require login, no SEO benefit, so
 * they keep client-side rendering (served as a lazy shell).
 *
 * NOTE: `path` values must NOT start with a leading slash — they're matched
 * against the router's route config (same format as app.routes.ts).
 *
 * Convention: when adding a new public route to app.routes.ts, add a matching
 * Prerender entry here (a CI check enforces this).
 */
export const serverRoutes: ServerRoute[] = [
  // ===== Guest / public (prerendered for SEO) =====
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'home', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'admin-login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'partner-register', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: 'terms', renderMode: RenderMode.Prerender },
  { path: 'connect-sme', renderMode: RenderMode.Prerender },
  { path: 'find-supplier', renderMode: RenderMode.Prerender },
  { path: 'group-buying', renderMode: RenderMode.Prerender },
  { path: 'groups', renderMode: RenderMode.Prerender },
  // Chi tiết nhóm: id không biết trước ở build time → render client-side (giống social/:postId)
  { path: 'groups/:id', renderMode: RenderMode.Client },
  { path: 'get-offer', renderMode: RenderMode.Prerender },
  { path: 'suppliers', renderMode: RenderMode.Prerender },
  { path: 'talent', renderMode: RenderMode.Prerender },
  { path: 'community', renderMode: RenderMode.Prerender },
  { path: 'partner', renderMode: RenderMode.Prerender },
  { path: 'social', renderMode: RenderMode.Prerender },
  // Dynamic post pages: no known IDs at build time, so render client-side.
  { path: 'social/:postId', renderMode: RenderMode.Client },

  // ===== Auth-gated (client-side only — no SEO value) =====
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'user/**', renderMode: RenderMode.Client },

  // Fallback: keep anything else the client router would redirect
  { path: '**', renderMode: RenderMode.Client },
];