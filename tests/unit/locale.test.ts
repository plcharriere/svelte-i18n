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
vi.mock('../../src/lib/context.svelte.ts', () => ({
	createI18nContext: () => ({}),
	getI18nContext: () => undefined
}));

import { normalizeConfig, setCurrentConfig } from '../../src/lib/config.ts';
import { setLocale } from '../../src/lib/locale.ts';

// Focus: the two warning branches of setLocale() that are reachable without a
// browser environment — both short-circuit with `return` before touching
// `$app/navigation` or `window.location`, so we don't need to mock the world.

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('setLocale()', () => {
	it('warns with unknown-locale for a code not in the config', async () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'path',
				defaultLanguage: 'en',
				languages: { en: {}, fr: {} }
			})
		);
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await setLocale('de');
		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining('unknown-locale')
		);
	});

	it('warns with no-domain-mapping when a domain-mode locale has no domains', async () => {
		setCurrentConfig(
			normalizeConfig({
				mode: 'domain',
				defaultLanguage: 'en',
				languages: {
					en: { domains: ['example.com'] },
					// fr is configured but has no domain — setLocale('fr') is a no-op.
					fr: {}
				}
			})
		);
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await setLocale('fr');
		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining('no-domain-mapping')
		);
	});
});
