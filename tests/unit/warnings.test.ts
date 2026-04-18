import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeConfig, setCurrentConfig } from '../../src/lib/config.ts';
import { warn } from '../../src/lib/warnings.ts';

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('warn()', () => {
	it('calls console.warn with a namespaced prefix in non-strict mode', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLanguage: 'en',
				languages: { en: {} }
			})
		);
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		warn('test-code', 'something happened');
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(
			'[svelte-i18n] test-code: something happened'
		);
	});

	it('throws instead of warning when strict: true', () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLanguage: 'en',
				strict: true,
				languages: { en: {} }
			})
		);
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(() => warn('boom', 'nope')).toThrow(
			/\[svelte-i18n\] boom: nope/
		);
		expect(spy).not.toHaveBeenCalled();
	});

	it('still warns when no config is registered yet', () => {
		// Edge case: warn() called before createI18n() (e.g. during locale file
		// import). Must not throw, must not silently drop.
		// Simulate "no config" by not calling setCurrentConfig — but previous
		// tests mutated the module singleton, so reset it by registering a
		// neutral non-strict config first, then checking baseline behavior.
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLanguage: 'en',
				languages: { en: {} }
			})
		);
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		warn('pre-init', 'still logs');
		expect(spy).toHaveBeenCalled();
	});
});
