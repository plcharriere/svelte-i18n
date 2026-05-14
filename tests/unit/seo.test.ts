import { describe, expect, it } from 'vitest';
import { normalizeConfig, setCurrentConfig } from '../../src/lib/config.ts';
import { getSeoLinks } from '../../src/lib/seo.ts';

describe('getSeoLinks', () => {
	it('path mode generates locale-prefixed URLs', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				seo: true,
				defaultLocale: 'en',
				locales: { en: {}, fr: {}, 'en-GB': { parent: 'en' } }
			})
		);
		const seo = getSeoLinks({
			url: 'https://example.com/fr/about',
			locale: 'fr'
		})!;
		expect(seo.canonical).toBe('https://example.com/fr/about');
		// Default locale is always unprefixed — one canonical form per page.
		expect(seo.alternates).toEqual([
			{ hreflang: 'en', href: 'https://example.com/about' },
			{ hreflang: 'fr', href: 'https://example.com/fr/about' },
			{ hreflang: 'en-GB', href: 'https://example.com/en-GB/about' }
		]);
		expect(seo.xDefault).toBe('https://example.com/about');
	});

	it('cookie mode generates ?lang= URLs', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'cookie',
				seo: true,
				defaultLocale: 'en',
				locales: { en: {}, fr: {}, 'en-GB': { parent: 'en' } }
			})
		);
		const seo = getSeoLinks({
			url: 'https://example.com/about?lang=fr',
			locale: 'fr'
		})!;
		expect(seo.canonical).toBe('https://example.com/about?lang=fr');
		expect(seo.xDefault).toBe('https://example.com/about');
		// Default locale has no ?lang= — it's the unparameterized canonical form.
		expect(seo.alternates[0]).toEqual({
			hreflang: 'en',
			href: 'https://example.com/about'
		});
	});

	it('domain mode uses configured domains', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'domain',
				seo: true,
				defaultLocale: 'en',
				locales: {
					en: { domains: ['example.com'] },
					fr: { domains: ['example.fr'] }
				}
			})
		);
		const seo = getSeoLinks({
			url: 'https://example.fr/about',
			locale: 'fr'
		})!;
		expect(seo.canonical).toBe('https://example.fr/about');
		expect(seo.alternates).toContainEqual({
			hreflang: 'fr',
			href: 'https://example.fr/about'
		});
		expect(seo.alternates).toContainEqual({
			hreflang: 'en',
			href: 'https://example.com/about'
		});
	});

	it('returns undefined when seo is disabled', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: { en: {}, fr: {} },
				seo: false
			})
		);
		expect(
			getSeoLinks({ url: 'https://example.com/fr/about', locale: 'fr' })
		).toBeUndefined();
	});

	it('path mode at root canonicalises to the unprefixed default URL', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				seo: true,
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		const seo = getSeoLinks({ url: 'https://example.com/', locale: 'en' })!;
		expect(seo.canonical).toBe('https://example.com/');
		expect(seo.alternates).toContainEqual({
			hreflang: 'fr',
			href: 'https://example.com/fr/'
		});
	});

	it('path mode strips the locale prefix from the canonical path', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				seo: true,
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		// Same canonical regardless of which prefix the request used.
		const fromFr = getSeoLinks({
			url: 'https://example.com/fr/about',
			locale: 'fr'
		})!;
		const fromEn = getSeoLinks({
			url: 'https://example.com/about',
			locale: 'en'
		})!;
		expect(fromFr.xDefault).toBe('https://example.com/about');
		expect(fromEn.xDefault).toBe('https://example.com/about');
	});

	it('domain mode: returns origin URL when locale has no configured domain', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'domain',
				seo: true,
				defaultLocale: 'en',
				locales: {
					en: { domains: ['example.com'] },
					fr: { domains: ['example.fr'] },
					ar: {}
				}
			})
		);
		const seo = getSeoLinks({
			url: 'https://example.com/about',
			locale: 'en'
		})!;
		// `ar` has no domain — its alternate falls back to the request URL.
		expect(
			seo.alternates.find((a) => a.hreflang === 'ar')?.href
		).toBe('https://example.com/about');
	});

	it('accepts a URL object for context.url', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				seo: true,
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		const seo = getSeoLinks({
			url: new URL('https://example.com/fr/about'),
			locale: 'fr'
		})!;
		expect(seo.canonical).toBe('https://example.com/fr/about');
	});

	it('uses getActiveLocale when no locale is passed in context', async () => {
		const { setServerLocaleAccessor } = await import(
			'../../src/lib/active-locale.ts'
		);
		setServerLocaleAccessor(() => 'fr');
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				seo: true,
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		const seo = getSeoLinks({ url: 'https://example.com/fr/about' })!;
		expect(seo.canonical).toBe('https://example.com/fr/about');
		setServerLocaleAccessor(() => undefined);
	});
});
