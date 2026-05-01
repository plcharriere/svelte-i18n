import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeConfig } from '../../src/lib/config.ts';
import {
	clearDictionaryCache,
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

	it('warns when a key is missing entirely', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		primeDictionary('en', {});
		expect(resolveMessage('missing.key', 'en', config)).toBeUndefined();
		expect(spy).toHaveBeenCalled();
	});

	it('warns when a locale falls back to default', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		primeDictionary('en', { only: 'from-en' });
		primeDictionary('fr', {});
		resolveMessage('only', 'fr', config);
		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining('fallback-to-default')
		);
	});
});
