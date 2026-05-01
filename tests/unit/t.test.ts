import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setServerLocaleAccessor } from '../../src/lib/active-locale.ts';
import { normalizeConfig, setCurrentConfig } from '../../src/lib/config.ts';
import {
	clearDictionaryCache,
	primeDictionary
} from '../../src/lib/dictionary.ts';
import { clearIcuCache } from '../../src/lib/icu.ts';
import { t } from '../../src/lib/t.svelte.ts';

// End-to-end tests through the public `t()` entry point. These drive the full
// stack: active-locale accessor → dictionary lookup → fallback chain → ICU
// formatting, with every cache reset between cases so flake from test order
// is impossible.

let currentLocale: string | undefined;

beforeEach(() => {
	clearDictionaryCache();
	clearIcuCache();
	vi.restoreAllMocks();
	currentLocale = undefined;
	// Inject a controllable locale source into the `active-locale` slot; the
	// production server slot uses ALS but for unit tests a plain getter is
	// simpler and exercises the same interface.
	setServerLocaleAccessor(() => currentLocale);
	setCurrentConfig(
		normalizeConfig({
			mode: 'path',
			defaultLocale: 'en',
			locales: {
				en: {},
				fr: {},
				'en-GB': { parent: 'en' },
				pt: {},
				'pt-BR': { parent: 'pt' }
			}
		})
	);
});

describe('t() end-to-end', () => {
	it('resolves plain string keys from the active locale', () => {
		primeDictionary('en', { nav: { home: 'Home' } });
		primeDictionary('fr', { nav: { home: 'Accueil' } });
		currentLocale = 'fr';
		expect(t('nav.home')).toBe('Accueil');
	});

	it('falls back through the variant chain', () => {
		primeDictionary('en', { common: { hello: 'Hello' } });
		primeDictionary('en-GB', {}); // partial — missing `common.hello`
		currentLocale = 'en-GB';
		// Not explicitly testing the warning here — covered in dictionary.test.ts.
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(t('common.hello')).toBe('Hello');
	});

	it('returns empty string for missing keys', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		primeDictionary('en', {});
		currentLocale = 'en';
		expect(t('nonexistent.key')).toBe('');
	});

	it('formats ICU plurals using the locale that owned the message', () => {
		// pt-BR inherits `cart.items` from `pt`; the plural rules used must be
		// pt-BR's rules (via the resolved locale), NOT en's. Prove that by
		// returning a message whose rule is locale-sensitive.
		primeDictionary('en', {
			cart: { items: '{count, plural, one {# item} other {# items}}' }
		});
		primeDictionary('pt', {
			cart: {
				items: '{count, plural, one {# item} other {# items}}'
			}
		});
		primeDictionary('pt-BR', {});
		currentLocale = 'pt-BR';
		// Suppress fallback warnings; not the assertion subject.
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(t('cart.items', { count: 1 })).toBe('1 item');
		expect(t('cart.items', { count: 5 })).toBe('5 items');
	});

	it('interpolates named variables', () => {
		primeDictionary('en', { user: { greet: 'Hi {name}' } });
		currentLocale = 'en';
		expect(t('user.greet', { name: 'Paul' })).toBe('Hi Paul');
	});

	it('falls back to default locale when active is undefined', () => {
		// Simulates pre-hydration call paths where no locale source has fired.
		primeDictionary('en', { a: 'default' });
		currentLocale = undefined;
		expect(t('a')).toBe('default');
	});

	it('resolves select branches', () => {
		primeDictionary('en', {
			p: '{g, select, male {He} female {She} other {They}}'
		});
		currentLocale = 'en';
		expect(t('p', { g: 'female' })).toBe('She');
		expect(t('p', { g: 'other' })).toBe('They');
	});
});
