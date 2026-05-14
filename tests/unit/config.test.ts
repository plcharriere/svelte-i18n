import { describe, expect, it } from 'vitest';
import { fallbackChain, normalizeConfig } from '../../src/lib/config.ts';

describe('normalizeConfig — defaults', () => {
	it('applies all documented defaults when only locales is given', () => {
		const resolved = normalizeConfig({ locales: { en: {} } });
		expect(resolved.mode).toBe('path');
		expect(resolved.defaultLocale).toBe('en');
		expect(resolved.defaultLocalePath).toBe('redirect');
		expect(resolved.strict).toBe(false);
		expect(resolved.cookieName).toBe('locale');
		expect(resolved.domainFallback).toBe('default');
		expect(resolved.seo).toBe(true);
		expect(resolved.syncTabs).toBe(true);
		expect(resolved.syncChannel).toBe('svelte-i18n');
	});

	it('honors explicitly-set values over defaults', () => {
		const resolved = normalizeConfig({
			mode: 'cookie',
			defaultLocalePath: '404',
			strict: true,
			cookieName: 'lang',
			domainFallback: '404',
			seo: false,
			syncTabs: false,
			syncChannel: 'my-app',
			locales: { en: {} }
		});
		expect(resolved.mode).toBe('cookie');
		expect(resolved.defaultLocalePath).toBe('404');
		expect(resolved.strict).toBe(true);
		expect(resolved.cookieName).toBe('lang');
		expect(resolved.domainFallback).toBe('404');
		expect(resolved.seo).toBe(false);
		expect(resolved.syncTabs).toBe(false);
		expect(resolved.syncChannel).toBe('my-app');
	});
});

describe('normalizeConfig', () => {
	it('defaults defaultLocale to en when supported', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			locales: { en: { label: 'English' }, fr: { label: 'French' } }
		});
		expect(resolved.defaultLocale).toBe('en');
	});

	it('rejects a defaultLocale that is not in locales', () => {
		expect(() =>
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'de',
				locales: { en: {} }
			})
		).toThrow(/defaultLocale/);
	});

	it('inherits metadata from parent when missing', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			defaultLocale: 'en',
			locales: {
				en: { label: 'English', nativeLabel: 'English' },
				'en-GB': { parent: 'en', label: 'English (UK)' },
				ar: { label: 'Arabic', nativeLabel: 'Arabic', rtl: true },
				'ar-AE': { parent: 'ar', label: 'Arabic (AE)' }
			}
		});
		expect(resolved.locales['en-GB'].nativeLabel).toBe('English');
		expect(resolved.locales['en-GB'].rtl).toBe(false);
		expect(resolved.locales['ar-AE'].nativeLabel).toBe('Arabic');
		expect(resolved.locales['ar-AE'].rtl).toBe(true);
	});

	it('rtl defaults to false', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			locales: { en: {} }
		});
		expect(resolved.locales.en.rtl).toBe(false);
	});

	it('does not loop on cyclic parent chains', () => {
		expect(() =>
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: {
					en: {},
					a: { parent: 'b' },
					b: { parent: 'a' }
				}
			})
		).not.toThrow();
	});

	it('codes lists every configured locale', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			defaultLocale: 'en',
			locales: { en: {}, fr: {}, ar: {} }
		});
		expect(resolved.codes.sort()).toEqual(['ar', 'en', 'fr']);
	});

	it('loaders map captures every locale that declared one', () => {
		const enLoad = async () => ({ default: {} });
		const frLoad = async () => ({ default: {} });
		const resolved = normalizeConfig({
			mode: 'path',
			defaultLocale: 'en',
			locales: {
				en: { load: enLoad },
				fr: { load: frLoad },
				es: {}
			}
		});
		expect(resolved.loaders.en).toBe(enLoad);
		expect(resolved.loaders.fr).toBe(frLoad);
		expect(resolved.loaders.es).toBeUndefined();
	});
});

describe('fallbackChain', () => {
	it('walks parent links to the default', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			defaultLocale: 'en',
			locales: {
				en: {},
				pt: {},
				'pt-BR': { parent: 'pt' }
			}
		});
		expect(fallbackChain('pt-BR', resolved)).toEqual(['pt-BR', 'pt', 'en']);
		expect(fallbackChain('en', resolved)).toEqual(['en']);
		expect(fallbackChain('pt', resolved)).toEqual(['pt', 'en']);
	});

	it('avoids duplicate default entries when chain already ends on default', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			defaultLocale: 'en',
			locales: { en: {}, 'en-GB': { parent: 'en' } }
		});
		expect(fallbackChain('en-GB', resolved)).toEqual(['en-GB', 'en']);
	});
});
