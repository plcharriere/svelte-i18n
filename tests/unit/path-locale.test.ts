import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../../src/lib/config.ts';
import { extractPathLocale } from '../../src/lib/path-locale.ts';

const config = normalizeConfig({
	mode: 'path',
	defaultLocale: 'en',
	locales: {
		en: {},
		fr: {},
		'en-GB': { parent: 'en' },
		'pt-BR': { parent: 'pt' },
		pt: {},
		'zh-Hant': {},
		'es-419': {}
	}
});

describe('extractPathLocale', () => {
	it('returns undefined code for the root path', () => {
		expect(extractPathLocale('/', config)).toEqual({
			code: undefined,
			rest: '/'
		});
	});

	it('returns undefined for an unprefixed path', () => {
		expect(extractPathLocale('/about', config)).toEqual({
			code: undefined,
			rest: '/about'
		});
	});

	it('extracts a 2-letter base locale', () => {
		expect(extractPathLocale('/fr/about', config)).toEqual({
			code: 'fr',
			rest: '/about'
		});
	});

	it('extracts the default locale when explicitly prefixed', () => {
		expect(extractPathLocale('/en/about', config)).toEqual({
			code: 'en',
			rest: '/about'
		});
	});

	it('extracts a locale-region tag (en-GB)', () => {
		expect(extractPathLocale('/en-GB/about', config)).toEqual({
			code: 'en-GB',
			rest: '/about'
		});
	});

	it('extracts a locale-script tag (zh-Hant)', () => {
		expect(extractPathLocale('/zh-Hant/about', config)).toEqual({
			code: 'zh-Hant',
			rest: '/about'
		});
	});

	it('extracts a numeric region (es-419)', () => {
		expect(extractPathLocale('/es-419/about', config)).toEqual({
			code: 'es-419',
			rest: '/about'
		});
	});

	it('case-insensitively matches a region', () => {
		expect(extractPathLocale('/en-gb/about', config)).toEqual({
			code: 'en-GB',
			rest: '/about'
		});
	});

	it('returns rest "/" when locale is the entire path', () => {
		expect(extractPathLocale('/fr', config)).toEqual({
			code: 'fr',
			rest: '/'
		});
	});

	it('returns rest "/" when locale ends with a slash', () => {
		expect(extractPathLocale('/fr/', config)).toEqual({
			code: 'fr',
			rest: '/'
		});
	});

	it('preserves trailing slash on inner path', () => {
		expect(extractPathLocale('/fr/about/', config)).toEqual({
			code: 'fr',
			rest: '/about/'
		});
	});

	it('rejects an unconfigured locale-shaped prefix', () => {
		expect(extractPathLocale('/de/about', config)).toEqual({
			code: undefined,
			rest: '/de/about'
		});
	});

	it('rejects a 3-letter prefix not in the locales map', () => {
		expect(extractPathLocale('/abc/about', config)).toEqual({
			code: undefined,
			rest: '/abc/about'
		});
	});

	it('does not treat a non-locale-shaped first segment as a locale', () => {
		expect(extractPathLocale('/cart/123', config)).toEqual({
			code: undefined,
			rest: '/cart/123'
		});
	});

	it('handles a deep prefixed path', () => {
		expect(extractPathLocale('/pt-BR/cart/checkout/confirm', config)).toEqual({
			code: 'pt-BR',
			rest: '/cart/checkout/confirm'
		});
	});

	it('strips multiple leading slashes', () => {
		expect(extractPathLocale('//fr/about', config)).toEqual({
			code: 'fr',
			rest: '/about'
		});
	});
});
