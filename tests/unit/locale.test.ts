import { beforeEach, describe, expect, it, vi } from 'vitest';

// Stub the SvelteKit alias (unresolvable in a plain node vitest env) and the
// rune-using context module (`$state` needs Svelte compilation). Both stubs
// are harmless for the two warning branches we're testing — they short-circuit
// with `return` before ever touching these modules.
vi.mock('$app/navigation', () => ({
	beforeNavigate: vi.fn(),
	goto: vi.fn(async () => {}),
	invalidateAll: vi.fn(async () => {})
}));
vi.mock('../../src/lib/client.svelte.ts', () => ({
	setupI18n: () => {},
	setActiveCode: () => {}
}));

import { setClientLocaleAccessor, setServerLocaleAccessor } from '../../src/lib/active-locale.ts';
import { normalizeConfig, setCurrentConfig } from '../../src/lib/config.ts';
import {
	getCurrentLocale,
	getDefaultLocale,
	getLocales,
	setLocale
} from '../../src/lib/locale.ts';

// Focus: the two warning branches of setLocale() that are reachable without a
// browser environment — both short-circuit with `return` before touching
// `$app/navigation` or `window.location`, so we don't need to mock the world.

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('setLocale()', () => {
	it('is a no-op when called with an unknown locale code', async () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: { en: {}, fr: {} }
			})
		);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { goto } = await import('$app/navigation');
		await setLocale('de');
		expect(goto).not.toHaveBeenCalled();
	});

	it('is a no-op in domain mode when the locale has no configured domains', async () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'domain',
				defaultLocale: 'en',
				locales: {
					en: { domains: ['example.com'] },
					fr: {}
				}
			})
		);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { goto } = await import('$app/navigation');
		await setLocale('fr');
		expect(goto).not.toHaveBeenCalled();
	});
});

describe('getCurrentLocale / getDefaultLocale / getLocales', () => {
	beforeEach(() => {
		setClientLocaleAccessor(() => undefined);
		setServerLocaleAccessor(() => undefined);
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLocale: 'en',
				locales: {
					en: { label: 'English', nativeLabel: 'English' },
					fr: { label: 'French', nativeLabel: 'Français' },
					ar: { label: 'Arabic', nativeLabel: 'العربية', rtl: true }
				}
			})
		);
	});

	it('getCurrentLocale falls back to default when no accessor is set', () => {
		expect(getCurrentLocale().code).toBe('en');
	});

	it('getCurrentLocale returns the active accessor value', () => {
		setServerLocaleAccessor(() => 'fr');
		expect(getCurrentLocale()).toEqual({
			code: 'fr',
			label: 'French',
			nativeLabel: 'Français',
			rtl: false
		});
	});

	it('getCurrentLocale falls back to default when accessor returns an unknown code', () => {
		setServerLocaleAccessor(() => 'xx');
		expect(getCurrentLocale().code).toBe('en');
	});

	it('getDefaultLocale returns the configured default locale metadata', () => {
		setServerLocaleAccessor(() => 'fr');
		expect(getDefaultLocale()).toEqual({
			code: 'en',
			label: 'English',
			nativeLabel: 'English',
			rtl: false
		});
	});

	it('getLocales returns all configured locales with metadata', () => {
		const locales = getLocales();
		expect(locales).toHaveLength(3);
		expect(locales.find((l) => l.code === 'ar')).toEqual({
			code: 'ar',
			label: 'Arabic',
			nativeLabel: 'العربية',
			rtl: true
		});
	});

	it('getLocales preserves declaration order via config.codes', () => {
		expect(getLocales().map((l) => l.code)).toEqual(['en', 'fr', 'ar']);
	});
});
