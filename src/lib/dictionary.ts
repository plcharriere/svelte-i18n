import { fallbackChain } from './config.ts';
import type {
	Dictionary,
	LanguageCode,
	ResolvedI18nConfig
} from './types.ts';
import { warn } from './warnings.ts';

type FlatEntry = { locale: LanguageCode; message: string };

const cache: Map<LanguageCode, Dictionary> = new Map();
const pending: Map<LanguageCode, Promise<Dictionary>> = new Map();
const flatCache: Map<LanguageCode, Map<string, FlatEntry>> = new Map();

export function primeDictionary(code: LanguageCode, dict: Dictionary): void {
	if (cache.get(code) === dict) return;
	cache.set(code, dict);
	flatCache.clear();
}

export function getCachedDictionary(code: LanguageCode): Dictionary | undefined {
	return cache.get(code);
}

export async function loadDictionary(
	code: LanguageCode,
	config: ResolvedI18nConfig
): Promise<Dictionary | undefined> {
	const existing = cache.get(code);
	if (existing) return existing;
	const inFlight = pending.get(code);
	if (inFlight) return inFlight;
	const loader = config.loaders[code];
	if (!loader) {
		warn('missing-loader', `No locale loader registered for "${code}".`);
		return undefined;
	}
	const promise = (async () => {
		const mod = await loader();
		const dict =
			mod && typeof mod === 'object' && 'default' in mod
				? (mod as { default: Dictionary }).default
				: (mod as Dictionary);
		cache.set(code, dict);
		flatCache.clear();
		return dict;
	})();
	pending.set(code, promise);
	try {
		return await promise;
	} finally {
		pending.delete(code);
	}
}

export async function loadChain(
	code: LanguageCode,
	config: ResolvedI18nConfig
): Promise<void> {
	const chain = fallbackChain(code, config);
	await Promise.all(chain.map((c) => loadDictionary(c, config)));
}

function flattenInto(
	dict: Dictionary,
	prefix: string,
	locale: LanguageCode,
	out: Map<string, FlatEntry>
): void {
	for (const key of Object.keys(dict)) {
		const value = dict[key];
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value === 'string') {
			if (!out.has(path)) out.set(path, { locale, message: value });
		} else if (value && typeof value === 'object') {
			flattenInto(value as Dictionary, path, locale, out);
		}
	}
}

function getFlatView(
	locale: LanguageCode,
	config: ResolvedI18nConfig
): Map<string, FlatEntry> {
	let flat = flatCache.get(locale);
	if (flat) return flat;
	flat = new Map();
	const chain = fallbackChain(locale, config);
	for (const c of chain) {
		const dict = cache.get(c);
		if (dict) flattenInto(dict, '', c, flat);
	}
	flatCache.set(locale, flat);
	return flat;
}

const warnedFallback = new Set<string>();
const warnedMissing = new Set<string>();

export function resolveMessage(
	key: string,
	locale: LanguageCode,
	config: ResolvedI18nConfig
): FlatEntry | undefined {
	const entry = getFlatView(locale, config).get(key);
	if (!entry) {
		const warnKey = `${locale}::${key}`;
		if (!warnedMissing.has(warnKey)) {
			warnedMissing.add(warnKey);
			warn('missing-key', `Translation key "${key}" not found in any locale.`);
		}
		return undefined;
	}
	if (
		entry.locale === config.defaultLanguage &&
		locale !== config.defaultLanguage
	) {
		const warnKey = `${locale}::${key}`;
		if (!warnedFallback.has(warnKey)) {
			warnedFallback.add(warnKey);
			warn(
				'fallback-to-default',
				`Key "${key}" missing from "${locale}"; used default "${config.defaultLanguage}".`
			);
		}
	}
	return entry;
}

export function clearDictionaryCache(): void {
	cache.clear();
	pending.clear();
	flatCache.clear();
	warnedFallback.clear();
	warnedMissing.clear();
}
