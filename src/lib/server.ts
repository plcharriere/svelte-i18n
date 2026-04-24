// Server entry. Split so the shared `createI18nReroute` + `getRequestLocale`
// helpers (also used client-side by SvelteKit) don't drag `hooks.ts`'s
// server-only transitive deps (`ssr-store.ts` → `node:async_hooks`) into the
// client graph when `src/hooks.ts` imports them.
export { createI18nHandle } from './hooks.ts';
export type { I18nHandleOptions, I18nKeyManifest, I18nLocals } from './hooks.ts';
export { createI18nReroute, getRequestLocale } from './reroute.ts';
