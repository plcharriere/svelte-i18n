import type { Handle, RequestEvent, Reroute } from '@sveltejs/kit';
import { setServerLocaleAccessor } from './active-locale.ts';
import { fallbackChain } from './config.ts';
import { getCachedDictionary, loadChain } from './dictionary.ts';
import { extractPathLocale } from './path-locale.ts';
import { resolveActiveLocale } from './resolver.ts';
import { getCurrentConfig } from './config.ts';
import { getServerLocale, runWithI18n } from './ssr-store.ts';
import type {
	Dictionary,
	I18nPageData,
	LanguageCode,
	ResolvedI18nConfig
} from './types.ts';

// Wire the server-side locale source. Happens on first import of this
// module, which is only reachable via `@plcharriere/svelte-i18n/server`, so
// `node:async_hooks` never ends up in the client graph.
setServerLocaleAccessor(getServerLocale);
// I18nPageData is re-used structurally by I18nLocals below.

// Populated on `event.locals.i18n` by the server handle. Same shape as the
// client-side `I18nPageData` but with required fields since the server
// always produces them.
export type I18nLocals = Required<Omit<I18nPageData, 'seo'>>;

export function createI18nHandle(): Handle {
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
				sameSite: 'lax'
			});
		}

		await loadChain(resolution.code, config);

		const rtl = config.languages[resolution.code]?.rtl ?? false;
		const chain = fallbackChain(resolution.code, config);
		const dictionaries: Record<LanguageCode, Dictionary> = {};
		for (const code of chain) {
			const dict = getCachedDictionary(code);
			if (dict) dictionaries[code] = dict;
		}
		event.locals.i18n = {
			locale: resolution.code,
			rtl,
			dictionaries
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
					// Path mode: rewrite unprefixed internal `href="/..."`
					// to carry the active locale so crawlers (which don't run
					// our `beforeNavigate` interceptor) follow the right URL.
					// Default language stays unprefixed — that's the canonical
					// shape in this mode.
					if (
						config.mode === 'path' &&
						resolution.code !== config.defaultLanguage
					) {
						out = rewriteAnchors(out, resolution.code, config);
					}
					return out;
				}
			})
		);
	};
}

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

// Matches `href="/..."` on anchor-like tags. Captures the path+query+hash so
// we can prepend the locale prefix inside the callback. Skips:
//   - protocol-relative `//cdn.com/x`
//   - fragment-only `#top` (doesn't start with `/`)
//   - mailto:/tel:/http(s): (doesn't start with `/`)
//   - already-prefixed `/en-GB/...` (filtered in the callback)
// Only touches double-quoted hrefs — single-quoted is extremely rare in
// SvelteKit-rendered output. `\shref=` avoids `data-href=` false matches.
const HREF_RE = /\shref="(\/[^"]*)"/g;

function rewriteAnchors(
	html: string,
	code: LanguageCode,
	config: ResolvedI18nConfig
): string {
	const prefix = `/${code}`;
	return html.replace(HREF_RE, (match, href: string) => {
		if (href.startsWith('//')) return match;
		const { code: existing } = extractPathLocale(href, config);
		if (existing) return match;
		// `/` → `/<code>/`, anything else → `/<code>/rest`
		const path = href === '/' ? '/' : href;
		return ` href="${prefix}${path}"`;
	});
}
