import { describe, expect, it } from 'vitest';
import { fallbackChain, normalizeConfig } from '../../src/lib/config.ts';

describe('normalizeConfig', () => {
	it('defaults defaultLanguage to en when supported', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			languages: { en: { label: 'English' }, fr: { label: 'French' } }
		});
		expect(resolved.defaultLanguage).toBe('en');
	});

	it('rejects a defaultLanguage that is not in languages', () => {
		expect(() =>
			normalizeConfig({
				mode: 'path',
				defaultLanguage: 'de',
				languages: { en: {} }
			})
		).toThrow(/defaultLanguage/);
	});

	it('inherits metadata from parent when missing', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			defaultLanguage: 'en',
			languages: {
				en: { label: 'English', nativeLabel: 'English' },
				'en-GB': { parent: 'en', label: 'English (UK)' },
				ar: { label: 'Arabic', nativeLabel: 'Arabic', rtl: true },
				'ar-AE': { parent: 'ar', label: 'Arabic (AE)' }
			}
		});
		expect(resolved.languages['en-GB'].nativeLabel).toBe('English');
		expect(resolved.languages['en-GB'].rtl).toBe(false);
		expect(resolved.languages['ar-AE'].nativeLabel).toBe('Arabic');
		expect(resolved.languages['ar-AE'].rtl).toBe(true);
	});

	it('rtl defaults to false', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			languages: { en: {} }
		});
		expect(resolved.languages.en.rtl).toBe(false);
	});
});

describe('fallbackChain', () => {
	it('walks parent links to the default', () => {
		const resolved = normalizeConfig({
			mode: 'path',
			defaultLanguage: 'en',
			languages: {
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
			defaultLanguage: 'en',
			languages: { en: {}, 'en-GB': { parent: 'en' } }
		});
		expect(fallbackChain('en-GB', resolved)).toEqual(['en-GB', 'en']);
	});
});
