import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeConfig } from '../../src/lib/config.ts';
import {
	clearDictionaryCache,
	getCachedDictionary,
	loadChain,
	loadDictionary
} from '../../src/lib/dictionary.ts';

// Test the async loader path: lazy load via `config.loaders`, cache, in-flight
// dedup, and chain-loading for fallback.

beforeEach(() => {
	clearDictionaryCache();
	vi.restoreAllMocks();
});

describe('loadDictionary', () => {
	it('calls the registered loader and caches the result', async () => {
		const loader = vi.fn(async () => ({ default: { a: 'A' } }));
		const config = normalizeConfig({
			mode: 'path',
			defaultLanguage: 'en',
			languages: { en: { load: loader } }
		});
		const first = await loadDictionary('en', config);
		expect(first).toEqual({ a: 'A' });
		expect(loader).toHaveBeenCalledTimes(1);

		const second = await loadDictionary('en', config);
		expect(second).toEqual({ a: 'A' });
		// Cache hit — loader not called twice.
		expect(loader).toHaveBeenCalledTimes(1);
	});

	it('dedupes concurrent in-flight loads', async () => {
		let resolve: (v: unknown) => void = () => {};
		const loader = vi.fn(
			() =>
				new Promise((r) => {
					resolve = r;
				})
		);
		const config = normalizeConfig({
			mode: 'path',
			defaultLanguage: 'en',
			languages: { en: { load: loader } }
		});
		const p1 = loadDictionary('en', config);
		const p2 = loadDictionary('en', config);
		resolve({ default: { a: 'A' } });
		await Promise.all([p1, p2]);
		// Both callers share the single in-flight promise — loader invoked once.
		expect(loader).toHaveBeenCalledTimes(1);
	});

	it('warns and returns undefined when no loader is registered', async () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const config = normalizeConfig({
			mode: 'path',
			defaultLanguage: 'en',
			languages: { en: {} } // no load
		});
		const res = await loadDictionary('en', config);
		expect(res).toBeUndefined();
		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining('missing-loader')
		);
	});

	it('unwraps module.default or uses the module directly', async () => {
		const configA = normalizeConfig({
			mode: 'path',
			defaultLanguage: 'en',
			languages: {
				en: { load: async () => ({ default: { wrapped: 'yes' } }) }
			}
		});
		expect(await loadDictionary('en', configA)).toEqual({ wrapped: 'yes' });

		clearDictionaryCache();

		const configB = normalizeConfig({
			mode: 'path',
			defaultLanguage: 'en',
			languages: {
				en: { load: async () => ({ bare: 'yes' }) }
			}
		});
		expect(await loadDictionary('en', configB)).toEqual({ bare: 'yes' });
	});
});

describe('loadChain', () => {
	it('loads every locale in the fallback chain in parallel', async () => {
		const loaders = {
			en: vi.fn(async () => ({ default: { shared: 'en' } })),
			pt: vi.fn(async () => ({ default: { shared: 'pt' } })),
			'pt-BR': vi.fn(async () => ({ default: {} }))
		};
		const config = normalizeConfig({
			mode: 'path',
			defaultLanguage: 'en',
			languages: {
				en: { load: loaders.en },
				pt: { load: loaders.pt },
				'pt-BR': { parent: 'pt', load: loaders['pt-BR'] }
			}
		});
		await loadChain('pt-BR', config);
		expect(loaders['pt-BR']).toHaveBeenCalledTimes(1);
		expect(loaders.pt).toHaveBeenCalledTimes(1);
		expect(loaders.en).toHaveBeenCalledTimes(1);
		expect(getCachedDictionary('pt-BR')).toEqual({});
		expect(getCachedDictionary('pt')).toEqual({ shared: 'pt' });
		expect(getCachedDictionary('en')).toEqual({ shared: 'en' });
	});
});
