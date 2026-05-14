import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeConfig } from '../../src/lib/config.ts';
import {
	clearDictionaryCache,
	getCachedDictionary,
	primeDictionary,
	resolveMessage
} from '../../src/lib/dictionary.ts';

const config = normalizeConfig({
	mode: 'path',
	defaultLocale: 'en',
	locales: {
		en: {},
		'en-GB': { parent: 'en' },
		pt: {},
		'pt-BR': { parent: 'pt' },
		fr: {}
	}
});

beforeEach(() => {
	clearDictionaryCache();
	vi.restoreAllMocks();
});

describe('resolveMessage', () => {
	it('finds keys in the active locale dict', () => {
		primeDictionary('en', { common: { hello: 'Hello' } });
		expect(resolveMessage('common.hello', 'en', config)?.message).toBe('Hello');
	});

	it('falls back through parent to default', () => {
		primeDictionary('en', { common: { hello: 'Hello', colour: 'Color' } });
		primeDictionary('en-GB', { common: { colour: 'Colour' } });
		const hello = resolveMessage('common.hello', 'en-GB', config);
		expect(hello?.message).toBe('Hello');
		expect(hello?.locale).toBe('en');
		const colour = resolveMessage('common.colour', 'en-GB', config);
		expect(colour?.message).toBe('Colour');
		expect(colour?.locale).toBe('en-GB');
	});

	it('falls back through pt -> en for pt-BR variant', () => {
		primeDictionary('en', { shared: 'en-shared' });
		primeDictionary('pt', { shared: 'pt-shared' });
		primeDictionary('pt-BR', {});
		const res = resolveMessage('shared', 'pt-BR', config);
		expect(res?.message).toBe('pt-shared');
		expect(res?.locale).toBe('pt');
	});

	it('returns undefined for a key missing from every locale in the chain', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		primeDictionary('en', {});
		expect(resolveMessage('missing.key', 'en', config)).toBeUndefined();
	});

	it('dedupes the missing-key warning across calls', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		primeDictionary('en', {});
		resolveMessage('missing.key', 'en', config);
		resolveMessage('missing.key', 'en', config);
		resolveMessage('missing.key', 'en', config);
		const missingCalls = spy.mock.calls.filter((c) =>
			(c[0] as string).includes('missing-key')
		);
		expect(missingCalls).toHaveLength(1);
	});

	it('dedupes fallback-to-default warnings across calls', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		primeDictionary('en', { only: 'from-en' });
		primeDictionary('fr', {});
		resolveMessage('only', 'fr', config);
		resolveMessage('only', 'fr', config);
		const fallbackCalls = spy.mock.calls.filter((c) =>
			(c[0] as string).includes('fallback-to-default')
		);
		expect(fallbackCalls).toHaveLength(1);
	});

	it('warns separately per (locale, key) combination', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		primeDictionary('en', {});
		resolveMessage('a', 'en', config);
		resolveMessage('b', 'en', config);
		const calls = spy.mock.calls.filter((c) =>
			(c[0] as string).includes('missing-key')
		);
		expect(calls).toHaveLength(2);
	});
});

describe('primeDictionary / getCachedDictionary', () => {
	beforeEach(() => clearDictionaryCache());

	it('stores and retrieves a dictionary', () => {
		const dict = { hello: 'Hello' };
		primeDictionary('en', dict);
		expect(getCachedDictionary('en')).toBe(dict);
	});

	it('returns undefined for an un-primed locale', () => {
		expect(getCachedDictionary('fr')).toBeUndefined();
	});

	it('replaces the cached dictionary on re-prime with a different object', () => {
		const a = { hello: 'Hello' };
		const b = { hello: 'Hi' };
		primeDictionary('en', a);
		primeDictionary('en', b);
		expect(getCachedDictionary('en')).toBe(b);
	});

	it('the identity guard skips re-priming with the same object', () => {
		const dict = { hello: 'Hello' };
		primeDictionary('en', dict);
		// Re-prime with the same reference is a no-op (the cache identity check).
		// Verify the cached value is still the original reference.
		primeDictionary('en', dict);
		expect(getCachedDictionary('en')).toBe(dict);
	});

	it('flat-cache is rebuilt after a re-prime (resolve picks up new values)', () => {
		primeDictionary('en', { greeting: 'Hello' });
		expect(resolveMessage('greeting', 'en', config)?.message).toBe('Hello');
		primeDictionary('en', { greeting: 'Howdy' });
		expect(resolveMessage('greeting', 'en', config)?.message).toBe('Howdy');
	});

	it('flat-cache flatten handles deeply nested dictionaries', () => {
		primeDictionary('en', {
			a: { b: { c: { d: { e: 'leaf' } } } }
		});
		expect(resolveMessage('a.b.c.d.e', 'en', config)?.message).toBe('leaf');
	});
});
