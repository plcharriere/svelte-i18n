import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../../src/lib/config.ts';
import {
	resolveActiveLocale,
	resolveCookieLocale,
	resolveDomainLocale,
	resolvePathLocale
} from '../../src/lib/resolver.ts';

// extractPathLocale itself is exhaustively tested in path-locale.test.ts.
// This file focuses on the resolver layer that consumes it.

const pathConfig = normalizeConfig({
	mode: 'path',
	defaultLocale: 'en',
	locales: {
		en: {},
		fr: {},
		'en-GB': { parent: 'en' }
	}
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
			domainFallback: '404',
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
