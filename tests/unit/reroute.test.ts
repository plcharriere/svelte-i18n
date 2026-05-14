import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { normalizeConfig, setCurrentConfig } from '../../src/lib/config.ts';
import { createI18nReroute, getRequestLocale } from '../../src/lib/reroute.ts';

function reroute(url: string): string | undefined {
	const fn = createI18nReroute();
	const result = fn({ url: new URL(url) } as Parameters<typeof fn>[0]);
	return (result ?? undefined) as string | undefined;
}

describe('createI18nReroute', () => {
	it('returns undefined in cookie mode (no path rewrite)', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'cookie',
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		expect(reroute('http://x/fr/about')).toBeUndefined();
	});

	it('returns undefined in domain mode', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'domain',
				defaultLocale: 'en',
				locales: {
					en: { domains: ['example.com'] },
					fr: { domains: ['example.fr'] }
				}
			})
		);
		expect(reroute('http://example.fr/fr/about')).toBeUndefined();
	});

	describe('path mode', () => {
		const setPath = () =>
			setCurrentConfig(
				normalizeConfig({
					mode: 'path',
					defaultLocale: 'en',
					locales: { en: {}, fr: {}, 'en-GB': { parent: 'en' } }
				})
			);

		it('returns undefined for an unprefixed path', () => {
			setPath();
			expect(reroute('http://x/about')).toBeUndefined();
		});

		it('strips a non-default locale prefix', () => {
			setPath();
			expect(reroute('http://x/fr/about')).toBe('/about');
		});

		it('strips the default locale prefix when explicit', () => {
			setPath();
			expect(reroute('http://x/en/about')).toBe('/about');
		});

		it('strips a region tag prefix', () => {
			setPath();
			expect(reroute('http://x/en-GB/cart')).toBe('/cart');
		});

		it('rewrites bare locale prefix to root', () => {
			setPath();
			expect(reroute('http://x/fr')).toBe('/');
		});

		it('returns undefined for an unconfigured locale-shaped prefix', () => {
			setPath();
			expect(reroute('http://x/de/about')).toBeUndefined();
		});
	});
});

describe('getRequestLocale', () => {
	it('returns the locale from event.locals.i18n when present', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		const event = {
			locals: { i18n: { locale: 'fr' } }
		} as unknown as RequestEvent;
		expect(getRequestLocale(event)).toBe('fr');
	});

	it('falls back to the default locale when locals.i18n is missing', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		const event = { locals: {} } as unknown as RequestEvent;
		expect(getRequestLocale(event)).toBe('en');
	});
});
