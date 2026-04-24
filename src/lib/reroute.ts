import type { RequestEvent, Reroute } from '@sveltejs/kit';
import { getCurrentConfig } from './config.ts';
import { extractPathLocale } from './path-locale.ts';
import type { LanguageCode } from './types.ts';

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
