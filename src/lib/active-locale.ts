import type { LanguageCode } from './types.ts';

// Neutral locale-accessor module. Two slots — client (rune-backed context)
// and server (AsyncLocalStorage) — populated by their respective modules at
// load time. `t()` and `seo.ts` read via `getActiveLocale()` without ever
// importing `context.svelte.ts` (rune-using, breaks in plain node) or
// `ssr-store.ts` (pulls `node:async_hooks`, would leak into client bundle).

type Accessor = () => LanguageCode | undefined;

let clientAccessor: Accessor | null = null;
let serverAccessor: Accessor | null = null;

export function setClientLocaleAccessor(fn: Accessor): void {
	clientAccessor = fn;
}

export function setServerLocaleAccessor(fn: Accessor): void {
	serverAccessor = fn;
}

export function getActiveLocale(): LanguageCode | undefined {
	return clientAccessor?.() ?? serverAccessor?.();
}
