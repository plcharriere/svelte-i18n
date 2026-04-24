import type { RequestEvent, Reroute } from '@sveltejs/kit';
import { getCurrentConfig } from './config.ts';
import { extractPathLocale } from './path-locale.ts';
import type { LanguageCode } from './types.ts';

// Shared (client + server) hooks. SvelteKit's `reroute` and locale-reading
// helpers must run on both sides, so this module is intentionally kept free
// of server-only deps — importing it never pulls in `ssr-store.ts` or
// `node:async_hooks`.

export function createI18nReroute(): Reroute {
	return ({ url }: { url: URL }) => {
		const config = getCurrentConfig();
		if (config.mode !== 'path') return undefined;
		const { code, rest } = extractPathLocale(url.pathname, config);
		if (!code) return undefined;
		return rest;
	};
}

export function getRequestLocale(event: RequestEvent): LanguageCode {
	return event.locals.i18n?.locale ?? getCurrentConfig().defaultLanguage;
}
