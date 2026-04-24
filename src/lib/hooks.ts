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
	LanguageCode,
	ResolvedI18nConfig
} from './types.ts';

// Wire the server-side locale source. Happens on first import of this
// module, which is only reachable via `@plcharriere/svelte-i18n/server`, so
// `node:async_hooks` never ends up in the client graph.
setServerLocaleAccessor(getServerLocale);

// Populated on `event.locals.i18n` by the server handle. Same shape as the
// client-side `I18nPageData` but with required fields since the server
// always produces them.
export type I18nLocals = Required<Omit<I18nPageData, 'seo'>>;

// Per-route key manifest. The Vite plugin populates `manifest.ts` at build
// time; without the plugin it stays empty and the handle ships full dicts.
// Consumers can also pass an explicit `keyManifest` to override the default.
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

		// Prune to the keys this route statically uses. The fallback-aware
		// projection lets each ancestor ship only the keys its descendant is
		// missing — a complete locale's fallback ships as `{}`. Unknown routes
		// (missing from the manifest) keep the full dict so runtime `t()` calls
		// don't silently fail — better to over-ship than to break.
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

// Matches `href="/..."` or `href='/...'` on anchor-like tags. Captures the
// quote style and the path+query+hash so we can re-emit the attribute with the
// same quotes. Skips:
//   - protocol-relative `//cdn.com/x`
//   - fragment-only `#top` (doesn't start with `/`)
//   - mailto:/tel:/http(s): (doesn't start with `/`)
//   - already-prefixed `/en-GB/...` (filtered in the callback)
// `\shref=` avoids `data-href=` false matches.
const HREF_RE = /\shref=(["'])(\/[^"']*)\1/g;

function rewriteAnchors(
	html: string,
	code: LanguageCode,
	config: ResolvedI18nConfig
): string {
	const prefix = `/${code}`;
	return html.replace(HREF_RE, (match, quote: string, href: string) => {
		if (href.startsWith('//')) return match;
		const { code: existing } = extractPathLocale(href, config);
		if (existing) return match;
		// `/` → `/<code>/`, anything else → `/<code>/rest`
		const path = href === '/' ? '/' : href;
		return ` href=${quote}${prefix}${path}${quote}`;
	});
}

