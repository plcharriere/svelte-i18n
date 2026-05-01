import { extractPathLocale } from './path-locale.ts';
import { getCurrentConfig } from './config.ts';
import { getActiveLocale } from './active-locale.ts';
import type { SeoLinks } from './types.ts';

export type SeoContext = {
	url: URL | string;
	locale?: string;
};

export function getSeoLinks(context?: SeoContext): SeoLinks | undefined {
	const config = getCurrentConfig();
	if (!config.seo) return undefined;
	const url = new URL(
		typeof context?.url === 'string'
			? context.url
			: context?.url?.toString() ??
				(typeof window !== 'undefined' ? window.location.href : 'http://localhost/')
	);
	const activeLocale =
		context?.locale ?? getActiveLocale() ?? config.defaultLocale;

	const canonicalPath = stripLocaleFromPath(url.pathname, config);

	const alternates = config.codes.map((code) => ({
		hreflang: code,
		href: buildLocaleHref(url, canonicalPath, code, config)
	}));

	const canonical = buildLocaleHref(url, canonicalPath, activeLocale, config);
	const xDefault = buildLocaleHref(
		url,
		canonicalPath,
		config.defaultLocale,
		config
	);

	return { canonical, alternates, xDefault };
}

function stripLocaleFromPath(
	pathname: string,
	config: ReturnType<typeof getCurrentConfig>
): string {
	if (config.mode !== 'path') return pathname || '/';
	const { rest } = extractPathLocale(pathname, config);
	return rest || '/';
}

function buildLocaleHref(
	url: URL,
	canonicalPath: string,
	code: string,
	config: ReturnType<typeof getCurrentConfig>
): string {
	const isDefault = code === config.defaultLocale;
	if (config.mode === 'path') {
		const prefix = isDefault ? '' : `/${code}`;
		const pathPart = canonicalPath === '/' ? '' : canonicalPath;
		const target = new URL(url);
		target.pathname = prefix + (pathPart || '/');
		if (target.pathname === '') target.pathname = '/';
		target.search = '';
		return target.toString();
	}
	if (config.mode === 'cookie') {
		const target = new URL(url);
		target.pathname = canonicalPath;
		const params = new URLSearchParams(target.search);
		if (isDefault) {
			params.delete('lang');
		} else {
			params.set('lang', code);
		}
		const qs = params.toString();
		target.search = qs ? `?${qs}` : '';
		return target.toString();
	}
	const def = config.locales[code];
	const host = def?.domains?.[0];
	if (!host) return url.toString();
	const target = new URL(url);
	target.host = host;
	target.pathname = canonicalPath;
	target.search = '';
	return target.toString();
}
