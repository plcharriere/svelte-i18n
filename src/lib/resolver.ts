import type { RequestEvent } from '@sveltejs/kit';
import { extractPathLocale } from './path-locale.ts';
import type { LanguageCode, ResolvedI18nConfig } from './types.ts';

// Server-only resolvers. Touched only by `hooks.ts`, which is reachable
// exclusively via the `./server` entry — so nothing in here ships to the
// browser. Path-segment extraction lives in `path-locale.ts` because the
// client needs it too.

export function resolvePathLocale(
	url: URL,
	config: ResolvedI18nConfig
): LanguageCode {
	const { code } = extractPathLocale(url.pathname, config);
	return code ?? config.defaultLanguage;
}

export function resolveCookieLocale(
	event: RequestEvent,
	config: ResolvedI18nConfig
): { code: LanguageCode; persist?: LanguageCode } {
	const queryLang = event.url.searchParams.get('lang');
	if (queryLang && config.languages[queryLang]) {
		return { code: queryLang, persist: queryLang };
	}
	const cookie = event.cookies.get(config.cookieName);
	if (cookie && config.languages[cookie]) {
		return { code: cookie };
	}
	return { code: config.defaultLanguage };
}

export function resolveDomainLocale(
	url: URL,
	config: ResolvedI18nConfig
): LanguageCode | null {
	const host = url.host;
	for (const code of config.codes) {
		const def = config.languages[code];
		if (def.domains?.includes(host)) return code;
	}
	return null;
}

export function resolveActiveLocale(
	event: RequestEvent,
	config: ResolvedI18nConfig
): { code: LanguageCode; persistCookie?: LanguageCode; rejected?: boolean } {
	if (config.mode === 'path') {
		return { code: resolvePathLocale(event.url, config) };
	}
	if (config.mode === 'cookie') {
		const res = resolveCookieLocale(event, config);
		return { code: res.code, persistCookie: res.persist };
	}
	// domain
	const match = resolveDomainLocale(event.url, config);
	if (match) return { code: match };
	if (config.domainFallback === 'reject') {
		return { code: config.defaultLanguage, rejected: true };
	}
	return { code: config.defaultLanguage };
}
