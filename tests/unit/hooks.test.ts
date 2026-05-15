import type { Cookies, RequestEvent, ResolveOptions } from '@sveltejs/kit';
import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeConfig, setCurrentConfig } from '../../src/lib/config.ts';
import {
	clearDictionaryCache,
	primeDictionary
} from '../../src/lib/dictionary.ts';
import { createI18nHandle } from '../../src/lib/hooks.ts';

function makeCookies(initial: Record<string, string> = {}): Cookies {
	const store = new Map(Object.entries(initial));
	const set: Array<{ name: string; value: string; opts: unknown }> = [];
	const cookies = {
		get: (name: string) => store.get(name),
		set: (name: string, value: string, opts: unknown) => {
			store.set(name, value);
			set.push({ name, value, opts });
		},
		getAll: () => [...store].map(([name, value]) => ({ name, value })),
		delete: (name: string) => store.delete(name),
		serialize: () => ''
	} as unknown as Cookies;
	(cookies as unknown as { __set: typeof set }).__set = set;
	return cookies;
}

function makeEvent(
	url: string,
	overrides: {
		routeId?: string | null;
		cookies?: Cookies;
		headers?: Record<string, string>;
	} = {}
): RequestEvent {
	const u = new URL(url);
	return {
		url: u,
		cookies: overrides.cookies ?? makeCookies(),
		request: new Request(url, {
			headers: overrides.headers ?? {}
		}),
		locals: {},
		route: { id: overrides.routeId ?? '/' }
	} as unknown as RequestEvent;
}

async function callHandle(
	event: RequestEvent,
	body = '<!doctype html><html><head></head><body></body></html>'
): Promise<{
	response: Response;
	transformedHtml?: string;
	resolveCalled: boolean;
	options?: ResolveOptions;
}> {
	let resolveCalled = false;
	let options: ResolveOptions | undefined;
	let transformedHtml: string | undefined;
	const handle = createI18nHandle();
	const response = await handle({
		event,
		resolve: ((evt, opts) => {
			resolveCalled = true;
			options = opts;
			let out = body;
			if (opts?.transformPageChunk) {
				const result = opts.transformPageChunk({
					html: out,
					done: true
				} as Parameters<NonNullable<ResolveOptions['transformPageChunk']>>[0]);
				if (typeof result === 'string') out = result;
			}
			transformedHtml = out;
			return new Response(out, {
				status: 200,
				headers: { 'content-type': 'text/html' }
			});
		}) as Parameters<typeof handle>[0]['resolve']
	});
	return { response, transformedHtml, resolveCalled, options };
}

beforeEach(() => {
	clearDictionaryCache();
	// Prime locales so loadChain doesn't try to call loaders
	primeDictionary('en', { hello: 'Hello' });
	primeDictionary('fr', { hello: 'Bonjour' });
	primeDictionary('en-GB', { hello: 'Hello (UK)' });
});

describe('createI18nHandle — path mode', () => {
	function setPathConfig(
		opts: { defaultLocalePath?: 'redirect' | 'allow' | '404' } = {}
	) {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				defaultLocalePath: opts.defaultLocalePath,
				locales: { en: {}, fr: {}, 'en-GB': { parent: 'en' } }
			})
		);
	}

	it('301-redirects /en/about → /about by default', async () => {
		setPathConfig();
		const event = makeEvent('http://x/en/about');
		const { response, resolveCalled } = await callHandle(event);
		expect(resolveCalled).toBe(false);
		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('http://x/about');
	});

	it('preserves query string on redirect', async () => {
		setPathConfig();
		const event = makeEvent('http://x/en/about?ref=foo');
		const { response } = await callHandle(event);
		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('http://x/about?ref=foo');
	});

	it('redirects /en/ → / (root)', async () => {
		setPathConfig();
		const event = makeEvent('http://x/en/');
		const { response } = await callHandle(event);
		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe('http://x/');
	});

	it('does NOT redirect non-default-locale prefixes', async () => {
		setPathConfig();
		const event = makeEvent('http://x/fr/about');
		const { response, resolveCalled } = await callHandle(event);
		expect(resolveCalled).toBe(true);
		expect(response.status).toBe(200);
	});

	it("with defaultLocalePath: 'allow', /en/about renders", async () => {
		setPathConfig({ defaultLocalePath: 'allow' });
		const event = makeEvent('http://x/en/about');
		const { response, resolveCalled } = await callHandle(event);
		expect(resolveCalled).toBe(true);
		expect(response.status).toBe(200);
	});

	it("with defaultLocalePath: '404', /en/about returns 404", async () => {
		setPathConfig({ defaultLocalePath: '404' });
		const event = makeEvent('http://x/en/about');
		const { response, resolveCalled } = await callHandle(event);
		expect(resolveCalled).toBe(false);
		expect(response.status).toBe(404);
	});

	it('substitutes %locale% and %dir% placeholders in the rendered HTML', async () => {
		setPathConfig();
		const event = makeEvent('http://x/fr/about');
		const { transformedHtml } = await callHandle(
			event,
			'<!doctype html><html lang="%locale%" dir="%dir%"><head></head><body></body></html>'
		);
		expect(transformedHtml).toContain('lang="fr"');
		expect(transformedHtml).toContain('dir="ltr"');
		expect(transformedHtml).not.toContain('%locale%');
		expect(transformedHtml).not.toContain('%dir%');
	});

	it('rewrites unprefixed internal anchors and leaves the rest alone', async () => {
		setPathConfig();
		const event = makeEvent('http://x/fr/about');
		const html = `<a href="/cart">x</a>
<a href="/fr/already">x</a>
<a href="//cdn.example.com/x">x</a>
<a href="https://other.com/y">x</a>`;
		const { transformedHtml } = await callHandle(event, html);
		expect(transformedHtml).toContain('href="/fr/cart"');
		expect(transformedHtml).toContain('href="/fr/already"');
		expect(transformedHtml).not.toContain('/fr/fr/already');
		expect(transformedHtml).toContain('href="//cdn.example.com/x"');
		expect(transformedHtml).toContain('href="https://other.com/y"');
	});

	it('does not rewrite anchors when the active locale is the default', async () => {
		setPathConfig();
		const event = makeEvent('http://x/about');
		const html = '<a href="/cart">cart</a>';
		const { transformedHtml } = await callHandle(event, html);
		expect(transformedHtml).toContain('href="/cart"');
		expect(transformedHtml).not.toContain('/en/cart');
	});

	it('exposes event.locals.i18n with locale + dictionaries', async () => {
		setPathConfig();
		const event = makeEvent('http://x/fr/about');
		await callHandle(event);
		const i18n = (
			event.locals as {
				i18n: { locale: string; dictionaries: Record<string, unknown> };
			}
		).i18n;
		expect(i18n.locale).toBe('fr');
		expect(Object.keys(i18n.dictionaries)).toContain('fr');
		expect(Object.keys(i18n.dictionaries)).toContain('en');
	});
});

describe('createI18nHandle — cookie mode', () => {
	function setCookieConfig() {
		setCurrentConfig(
			normalizeConfig({
				mode: 'cookie',
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
	}

	it('falls back to default locale when no cookie or ?lang', async () => {
		setCookieConfig();
		const event = makeEvent('http://x/about');
		await callHandle(event);
		expect((event.locals as { i18n: { locale: string } }).i18n.locale).toBe('en');
	});

	it('reads the active locale from a cookie', async () => {
		setCookieConfig();
		const event = makeEvent('http://x/about', {
			cookies: makeCookies({ locale: 'fr' })
		});
		await callHandle(event);
		expect((event.locals as { i18n: { locale: string } }).i18n.locale).toBe('fr');
	});

	it('?lang query overrides cookie and persists with httpOnly: false', async () => {
		setCookieConfig();
		const cookies = makeCookies();
		const event = makeEvent('http://x/about?lang=fr', { cookies });
		await callHandle(event);
		expect((event.locals as { i18n: { locale: string } }).i18n.locale).toBe('fr');
		const set = (cookies as unknown as { __set: Array<{ name: string; opts: { httpOnly: boolean } }> })
			.__set;
		expect(set).toHaveLength(1);
		expect(set[0].name).toBe('locale');
		expect(set[0].opts.httpOnly).toBe(false);
	});

	it('does NOT apply the path-mode redirect in cookie mode', async () => {
		setCookieConfig();
		const event = makeEvent('http://x/en/about');
		const { response, resolveCalled } = await callHandle(event);
		expect(resolveCalled).toBe(true);
		expect(response.status).toBe(200);
	});
});

describe('createI18nHandle — RTL', () => {
	it('substitutes dir="rtl" and exposes rtl on event.locals.i18n', async () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: { en: {}, ar: { rtl: true } }
			})
		);
		primeDictionary('ar', { hello: 'مرحبا' });
		const event = makeEvent('http://x/ar/about');
		const { transformedHtml } = await callHandle(
			event,
			'<!doctype html><html lang="%locale%" dir="%dir%"><head></head><body></body></html>'
		);
		expect(transformedHtml).toContain('lang="ar"');
		expect(transformedHtml).toContain('dir="rtl"');
		expect((event.locals as { i18n: { rtl: boolean } }).i18n.rtl).toBe(true);
	});
});

describe('createI18nHandle — keyManifest pruning', () => {
	it('prunes dictionaries to the manifest keys for the matched route', async () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		primeDictionary('en', {
			home: { title: 'Home' },
			cart: { title: 'Cart' },
			admin: { title: 'Admin' }
		});
		primeDictionary('fr', {
			home: { title: 'Accueil' },
			cart: { title: 'Panier' },
			admin: { title: 'Admin (fr)' }
		});
		const handleFn = createI18nHandle({
			keyManifest: { routes: { '/': ['home.title', 'cart.title'] } }
		});
		const event = makeEvent('http://x/fr/', { routeId: '/' });
		await handleFn({
			event,
			resolve: ((evt) =>
				new Response('', { status: 200 })) as Parameters<typeof handleFn>[0]['resolve']
		});
		const dicts = (
			event.locals as {
				i18n: { dictionaries: Record<string, Record<string, unknown>> };
			}
		).i18n.dictionaries;
		expect(dicts.fr).toEqual({
			home: { title: 'Accueil' },
			cart: { title: 'Panier' }
		});
		// admin.* was not in the manifest → not shipped.
		expect(dicts.fr.admin).toBeUndefined();
	});

	it('ships the full dictionary when route is not in the manifest', async () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: { en: {} }
			})
		);
		primeDictionary('en', { a: 'A', b: 'B' });
		const handleFn = createI18nHandle({
			keyManifest: { routes: { '/known': ['a'] } }
		});
		const event = makeEvent('http://x/about', { routeId: '/about' });
		await handleFn({
			event,
			resolve: ((evt) =>
				new Response('', { status: 200 })) as Parameters<typeof handleFn>[0]['resolve']
		});
		const dicts = (
			event.locals as {
				i18n: { dictionaries: Record<string, Record<string, unknown>> };
			}
		).i18n.dictionaries;
		expect(dicts.en).toEqual({ a: 'A', b: 'B' });
	});

	it('ships the full dictionary when no route id is set', async () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: { en: {} }
			})
		);
		primeDictionary('en', { a: 'A', b: 'B' });
		const event = makeEvent('http://x/about', { routeId: null });
		await callHandle(event);
		const dicts = (
			event.locals as {
				i18n: { dictionaries: Record<string, Record<string, unknown>> };
			}
		).i18n.dictionaries;
		expect(dicts.en).toEqual({ a: 'A', b: 'B' });
	});
});

describe('createI18nHandle — transformPageChunk', () => {
	it('only transforms when done=true', async () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		const handleFn = createI18nHandle();
		const event = makeEvent('http://x/fr/about');
		let received: { html: string; done: boolean } | undefined;
		let firstChunkResult: string | undefined;
		await handleFn({
			event,
			resolve: ((_evt, opts) => {
				if (opts?.transformPageChunk) {
					firstChunkResult = opts.transformPageChunk({
						html: '<html><head></head><body>partial</body></html>',
						done: false
					} as Parameters<NonNullable<ResolveOptions['transformPageChunk']>>[0]) as string;
				}
				return new Response('', { status: 200 });
			}) as Parameters<typeof handleFn>[0]['resolve']
		});
		// done: false should pass html through unchanged
		expect(firstChunkResult).toBe(
			'<html><head></head><body>partial</body></html>'
		);
		expect(received).toBeUndefined();
	});
});

describe('createI18nHandle — domain mode', () => {
	function setDomainConfig(
		fallback: 'default' | '404' = 'default'
	) {
		setCurrentConfig(
			normalizeConfig({
				mode: 'domain',
				defaultLocale: 'en',
				domainFallback: fallback,
				locales: {
					en: { domains: ['example.com'] },
					fr: { domains: ['example.fr'] }
				}
			})
		);
	}

	it('matches the configured domain to a locale', async () => {
		setDomainConfig();
		const event = makeEvent('http://example.fr/about');
		await callHandle(event);
		expect((event.locals as { i18n: { locale: string } }).i18n.locale).toBe('fr');
	});

	it("falls back to default on unmapped host with domainFallback: 'default'", async () => {
		setDomainConfig('default');
		const event = makeEvent('http://staging.example.com/about');
		await callHandle(event);
		expect((event.locals as { i18n: { locale: string } }).i18n.locale).toBe('en');
	});

	it("returns 404 on unmapped host with domainFallback: '404'", async () => {
		setDomainConfig('404');
		const event = makeEvent('http://staging.example.com/about');
		const { response, resolveCalled } = await callHandle(event);
		expect(resolveCalled).toBe(false);
		expect(response.status).toBe(404);
	});
});
