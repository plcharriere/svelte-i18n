import type { Handle } from '@sveltejs/kit';
import { setServerLocaleAccessor } from './active-locale.ts';
import { fallbackChain, getCurrentConfig } from './config.ts';
import { getCachedDictionary, loadChain } from './dictionary.ts';
import { manifest as builtinManifest } from './manifest.ts';
import { extractPathLocale } from './path-locale.ts';
import { pruneDicts } from './prune.ts';
import { resolveActiveLocale } from './resolver.ts';
import { getServerLocale, runWithI18n } from './ssr-store.ts';
import type {
	Dictionary,
	I18nPageData,
	LocaleCode,
	ResolvedI18nConfig
} from './types.ts';

setServerLocaleAccessor(getServerLocale);

export type I18nLocals = Required<Omit<I18nPageData, 'seo'>>;

export interface I18nKeyManifest {
	routes: Record<string, string[]>;
}

export interface I18nHandleOptions {
	/** Per-route key manifest. Defaults to the one emitted by the Vite plugin
	 * (`svelteI18n()`). Provide explicitly to override or to supply your own. */
	keyManifest?: I18nKeyManifest;
}

export function createI18nHandle(options: I18nHandleOptions = {}): Handle {
	const manifest = options.keyManifest ?? builtinManifest;
	return async ({ event, resolve }) => {
		const config = getCurrentConfig();
		const resolution = resolveActiveLocale(event, config);

		if (resolution.rejected) {
			return new Response('Not Found', { status: 404 });
		}

		if (config.mode === 'cookie' && resolution.persistCookie) {
			event.cookies.set(config.cookieName, resolution.persistCookie, {
				path: '/',
				maxAge: 60 * 60 * 24 * 365,
				sameSite: 'lax',
				httpOnly: false
			});
		}

		await loadChain(resolution.code, config);

		const rtl = config.locales[resolution.code]?.rtl ?? false;
		const chain = fallbackChain(resolution.code, config);
		const dictionaries: Record<LocaleCode, Dictionary> = {};
		for (const code of chain) {
			const dict = getCachedDictionary(code);
			if (dict) dictionaries[code] = dict;
		}

		const routeId = event.route?.id;
		const allowed = manifest && routeId ? manifest.routes[routeId] : undefined;
		const deliveredDicts = allowed
			? pruneDicts(chain, dictionaries, allowed)
			: dictionaries;

		event.locals.i18n = {
			locale: resolution.code,
			rtl,
			dictionaries: deliveredDicts
		};

		const dir = rtl ? 'rtl' : 'ltr';
		return runWithI18n({ locale: resolution.code }, () =>
			resolve(event, {
				transformPageChunk: ({ html, done }) => {
					if (!done) return html;
					let out = html.replace(/<html\b[^>]*>/, (htmlTag) => {
						let next = htmlTag
							.replace(/\s+lang="[^"]*"/, '')
							.replace(/\s+dir="[^"]*"/, '');
						next = next.replace(
							/^<html/,
							`<html lang="${resolution.code}" dir="${dir}"`
						);
						return next;
					});
					if (
						config.mode === 'path' &&
						resolution.code !== config.defaultLocale
					) {
						out = rewriteAnchors(out, resolution.code, config);
					}
					return out;
				}
			})
		);
	};
}

const HREF_RE = /\shref=(["'])(\/[^"']*)\1/g;

function rewriteAnchors(
	html: string,
	code: LocaleCode,
	config: ResolvedI18nConfig
): string {
	const prefix = `/${code}`;
	return html.replace(HREF_RE, (match, quote: string, href: string) => {
		if (href.startsWith('//')) return match;
		const { code: existing } = extractPathLocale(href, config);
		if (existing) return match;
		const path = href === '/' ? '/' : href;
		return ` href=${quote}${prefix}${path}${quote}`;
	});
}
