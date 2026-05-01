import type { RequestEvent } from '@sveltejs/kit';
import { extractPathLocale } from './path-locale.ts';
import type { LocaleCode, ResolvedI18nConfig } from './types.ts';

export function resolvePathLocale(
	url: URL,
	config: ResolvedI18nConfig
): LocaleCode {
	const { code } = extractPathLocale(url.pathname, config);
	return code ?? config.defaultLocale;
}

export function resolveCookieLocale(
	event: RequestEvent,
	config: ResolvedI18nConfig
): { code: LocaleCode; persist?: LocaleCode } {
	const queryLang = event.url.searchParams.get('lang');
	if (queryLang && config.locales[queryLang]) {
		return { code: queryLang, persist: queryLang };
	}
	const cookie = event.cookies.get(config.cookieName);
	if (cookie && config.locales[cookie]) {
		return { code: cookie };
	}
	return { code: config.defaultLocale };
}

export function resolveDomainLocale(
	url: URL,
	config: ResolvedI18nConfig
): LocaleCode | null {
	const host = url.host;
	for (const code of config.codes) {
		const def = config.locales[code];
		if (def.domains?.includes(host)) return code;
	}
	return null;
}

export function resolveActiveLocale(
	event: RequestEvent,
	config: ResolvedI18nConfig
): { code: LocaleCode; persistCookie?: LocaleCode; rejected?: boolean } {
	if (config.mode === 'path') {
		return { code: resolvePathLocale(event.url, config) };
	}
	if (config.mode === 'cookie') {
		const res = resolveCookieLocale(event, config);
		return { code: res.code, persistCookie: res.persist };
	}
	const match = resolveDomainLocale(event.url, config);
	if (match) return { code: match };
	if (config.domainFallback === 'reject') {
		return { code: config.defaultLocale, rejected: true };
	}
	return { code: config.defaultLocale };
}
