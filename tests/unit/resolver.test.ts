import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../../src/lib/config.ts';
import { extractPathLocale } from '../../src/lib/path-locale.ts';
import {
	resolveActiveLocale,
	resolveCookieLocale,
	resolveDomainLocale,
	resolvePathLocale
} from '../../src/lib/resolver.ts';

const pathConfig = normalizeConfig({
	mode: 'path',
	defaultLocale: 'en',
	locales: {
		en: {},
		fr: {},
		'en-GB': { parent: 'en' },
		pt: {},
		zh: {},
		'zh-Hant': { parent: 'zh' },
		'zh-Hant-CN': { parent: 'zh-Hant' },
		es: {},
		'es-419': { parent: 'es' }
	}
});

describe('extractPathLocale', () => {
	it('recognises known locale prefix', () => {
		expect(extractPathLocale('/fr/about', pathConfig)).toEqual({
			code: 'fr',
			rest: '/about'
		});
	});

	it('recognises variants like en-GB', () => {
		expect(extractPathLocale('/en-GB/cart', pathConfig)).toEqual({
			code: 'en-GB',
			rest: '/cart'
		});
	});

	it('returns undefined for unknown prefix', () => {
		expect(extractPathLocale('/about', pathConfig)).toEqual({
			code: undefined,
			rest: '/about'
		});
	});

	it('rest defaults to / when nothing after prefix', () => {
		expect(extractPathLocale('/fr', pathConfig)).toEqual({
			code: 'fr',
			rest: '/'
		});
	});

	it('matches BCP-47 script subtags (zh-Hant)', () => {
		expect(extractPathLocale('/zh-Hant/about', pathConfig)).toEqual({
			code: 'zh-Hant',
			rest: '/about'
		});
	});

	it('matches BCP-47 script + region (zh-Hant-CN)', () => {
		expect(extractPathLocale('/zh-Hant-CN/about', pathConfig)).toEqual({
			code: 'zh-Hant-CN',
			rest: '/about'
		});
	});

	it('matches UN M.49 numeric regions (es-419)', () => {
		expect(extractPathLocale('/es-419/about', pathConfig)).toEqual({
			code: 'es-419',
			rest: '/about'
		});
	});

	it('case-insensitively matches configured variants (en-gb → en-GB)', () => {
		expect(extractPathLocale('/en-gb/about', pathConfig)).toEqual({
			code: 'en-GB',
			rest: '/about'
		});
	});

	it('preserves trailing slash on the rest path', () => {
		expect(extractPathLocale('/fr/about/', pathConfig)).toEqual({
			code: 'fr',
			rest: '/about/'
		});
	});

	it('rejects a language-shaped prefix that is not configured', () => {
		expect(extractPathLocale('/xx/about', pathConfig)).toEqual({
			code: undefined,
			rest: '/xx/about'
		});
	});
});

describe('resolvePathLocale', () => {
	it('returns default when no prefix', () => {
		expect(resolvePathLocale(new URL('http://x/about'), pathConfig)).toBe('en');
	});
	it('returns prefix locale', () => {
		expect(resolvePathLocale(new URL('http://x/fr/about'), pathConfig)).toBe('fr');
	});
});

describe('resolveDomainLocale', () => {
	const domainConfig = normalizeConfig({
		mode: 'domain',
		defaultLocale: 'en',
		locales: {
			en: { domains: ['example.com', 'en.example.com'] },
			fr: { domains: ['example.fr'] }
		}
	});

	it('matches by host', () => {
		expect(resolveDomainLocale(new URL('https://example.fr/'), domainConfig)).toBe('fr');
		expect(resolveDomainLocale(new URL('https://example.com/'), domainConfig)).toBe('en');
	});

	it('returns null for unknown host', () => {
		expect(resolveDomainLocale(new URL('https://other.com/'), domainConfig)).toBeNull();
	});
});

// Minimal `RequestEvent` stub with just the fields `resolveCookieLocale` reads.
// Full-type casting keeps the test payload small without pulling the whole
// SvelteKit shape.
function mockEvent({
	search = '',
	cookie
}: { search?: string; cookie?: string } = {}): RequestEvent {
	const url = new URL(`http://example.com/about${search}`);
	return {
		url,
		cookies: {
			get: (name: string) =>
				cookie && name === 'locale' ? cookie : undefined
		}
	} as unknown as RequestEvent;
}

describe('resolveCookieLocale', () => {
	const cookieConfig = normalizeConfig({
		mode: 'cookie',
		defaultLocale: 'en',
		locales: { en: {}, fr: {}, pt: {} }
	});

	it('returns the default when nothing is set', () => {
		expect(resolveCookieLocale(mockEvent(), cookieConfig)).toEqual({
			code: 'en'
		});
	});

	it('reads the cookie when the query string is absent', () => {
		expect(
			resolveCookieLocale(mockEvent({ cookie: 'fr' }), cookieConfig)
		).toEqual({ code: 'fr' });
	});

	it('?lang wins over the cookie and is persisted', () => {
		const res = resolveCookieLocale(
			mockEvent({ search: '?lang=pt', cookie: 'fr' }),
			cookieConfig
		);
		expect(res).toEqual({ code: 'pt', persist: 'pt' });
	});

	it('ignores an invalid ?lang value and falls back to the cookie', () => {
		const res = resolveCookieLocale(
			mockEvent({ search: '?lang=xx', cookie: 'fr' }),
			cookieConfig
		);
		expect(res).toEqual({ code: 'fr' });
	});

	it('ignores an invalid cookie and falls back to the default', () => {
		const res = resolveCookieLocale(
			mockEvent({ cookie: 'xx' }),
			cookieConfig
		);
		expect(res).toEqual({ code: 'en' });
	});
});

describe('resolveActiveLocale', () => {
	it('dispatches to path mode', () => {
		const res = resolveActiveLocale(
			{ url: new URL('http://x/fr/about') } as RequestEvent,
			pathConfig
		);
		expect(res).toEqual({ code: 'fr' });
	});

	it('dispatches to cookie mode with persist flag', () => {
		const cookieConfig = normalizeConfig({
			mode: 'cookie',
			defaultLocale: 'en',
			locales: { en: {}, fr: {} }
		});
		const res = resolveActiveLocale(
			mockEvent({ search: '?lang=fr' }),
			cookieConfig
		);
		expect(res).toEqual({ code: 'fr', persistCookie: 'fr' });
	});

	it('dispatches to domain mode and flags rejected on unknown host', () => {
		const strictDomain = normalizeConfig({
			mode: 'domain',
			defaultLocale: 'en',
			domainFallback: 'reject',
			locales: { en: { domains: ['example.com'] } }
		});
		const res = resolveActiveLocale(
			{ url: new URL('https://other.com/') } as RequestEvent,
			strictDomain
		);
		expect(res.rejected).toBe(true);
	});

	it('domain mode with fallback=default returns default without rejecting', () => {
		const lenientDomain = normalizeConfig({
			mode: 'domain',
			defaultLocale: 'en',
			locales: { en: { domains: ['example.com'] } }
		});
		const res = resolveActiveLocale(
			{ url: new URL('https://other.com/') } as RequestEvent,
			lenientDomain
		);
		expect(res).toEqual({ code: 'en' });
	});
});
