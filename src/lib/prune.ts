import type { Dictionary, LanguageCode } from './types.ts';

// Split the route's required keys across the fallback chain such that each
// locale only carries the keys it *actually contributes*. Walk child → ancestor:
// the first dict that has a given key claims it, ancestors skip it. When a
// locale is complete for this route, its fallback ships as an empty subset.
//
// Example for `/cart` with chain `['fr', 'en']` where `fr` has everything:
//   fr → { cart: {…all keys…} }
//   en → {}                    // nothing to add; client never looks past fr
export function pruneDicts(
	chain: LanguageCode[],
	dicts: Record<LanguageCode, Dictionary>,
	keys: string[]
): Record<LanguageCode, Dictionary> {
	const out: Record<LanguageCode, Dictionary> = {};
	const claimed = new Set<string>();
	for (const code of chain) {
		const dict = dicts[code];
		if (!dict) continue;
		const owned = keys.filter((k) => !claimed.has(k) && hasKey(dict, k));
		out[code] = pickKeys(dict, owned);
		for (const k of owned) claimed.add(k);
	}
	return out;
}

// Does `dict` contain a value at this dotted path? Matches both leaf strings
// and intermediate objects (the same shapes `pickKeys` would copy).
export function hasKey(dict: Dictionary, key: string): boolean {
	const parts = key.split('.');
	let src: unknown = dict;
	for (let i = 0; i < parts.length; i++) {
		if (!src || typeof src !== 'object') return false;
		src = (src as Record<string, unknown>)[parts[i]];
	}
	return src !== undefined;
}

// Build a nested dictionary containing only the given dotted paths. Missing
// branches are skipped (no placeholder objects). If `key` points at an
// intermediate node (no dot past that segment), the entire subtree is copied.
export function pickKeys(dict: Dictionary, keys: string[]): Dictionary {
	const out: Dictionary = {};
	for (const key of keys) {
		const parts = key.split('.');
		let src: unknown = dict;
		for (let i = 0; i < parts.length - 1; i++) {
			if (!src || typeof src !== 'object') {
				src = undefined;
				break;
			}
			src = (src as Record<string, unknown>)[parts[i]];
		}
		if (!src || typeof src !== 'object') continue;
		const leafKey = parts[parts.length - 1];
		const value = (src as Record<string, unknown>)[leafKey];
		if (value === undefined) continue;

		let dst: Record<string, unknown> = out as Record<string, unknown>;
		for (let i = 0; i < parts.length - 1; i++) {
			const p = parts[i];
			if (typeof dst[p] !== 'object' || dst[p] === null) dst[p] = {};
			dst = dst[p] as Record<string, unknown>;
		}
		dst[leafKey] = value;
	}
	return out;
}
