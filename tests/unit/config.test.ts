import { describe, expect, it } from 'vitest';
import { fallbackChain, normalizeConfig } from '../../src/lib/config.ts';

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
