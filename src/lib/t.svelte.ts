import { getActiveLocale } from './active-locale.ts';
import { getCurrentConfig } from './config.ts';
import { resolveMessage } from './dictionary.ts';
import { formatMessage } from './icu.ts';

// Browser-only reactive counter. `t()` reads it on every call, so bumping
// it forces every `t()` call-site wrapped in a Svelte reactive context to
// re-evaluate — used by HMR and by anything that needs to poke the UI
// without going through SvelteKit's invalidate pipeline.
//
// Lives in `.svelte.ts` so the Svelte compiler transforms reads into signal
// subscriptions. On the server `$state` is a plain value — reads always
// return 0, mutations don't propagate, and since we only bump from the
// browser there's no cross-request leakage.
let revision = $state(0);

export function bumpTranslationRevision(): void {
	revision++;
}

// Untyped internal translator. The generic, schema-typed wrapper is returned
// from `createI18n<S>()` — users should call that one, not this.
export function t(
	key: string,
	params?: Record<string, unknown>
): string {
	// Subscribe the caller's reactive effect to `revision`. In prod nothing
	// bumps it, so every `t()` is as cheap as a signal read (one integer
	// dereference); in dev a locale-file edit flips it and every reactive
	// `t()` re-runs on the spot — no navigation, no reload.
	revision;
	const config = getCurrentConfig();
	const locale = getActiveLocale() ?? config.defaultLanguage;
	const resolved = resolveMessage(key, locale, config);
	if (!resolved) return '';
	return formatMessage(resolved.locale, resolved.message, params, { key });
}
