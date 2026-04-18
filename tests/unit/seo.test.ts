import { describe, expect, it } from 'vitest';
import { normalizeConfig, setCurrentConfig } from '../../src/lib/config.ts';
import { getSeoLinks } from '../../src/lib/seo.ts';

describe('getSeoLinks', () => {
	it('path mode generates locale-prefixed URLs', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				seo: true,
				defaultLanguage: 'en',
				languages: { en: {}, fr: {}, 'en-GB': { parent: 'en' } }
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
				defaultLanguage: 'en',
				languages: { en: {}, fr: {}, 'en-GB': { parent: 'en' } }
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
				defaultLanguage: 'en',
				languages: {
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
				defaultLanguage: 'en',
				languages: { en: {}, fr: {} }
			})
		);
		expect(
			getSeoLinks({ url: 'https://example.com/fr/about', locale: 'fr' })
		).toBeUndefined();
	});
});
