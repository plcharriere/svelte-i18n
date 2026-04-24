import type { Dictionary, LanguageCode } from './types.ts';

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

export function hasKey(dict: Dictionary, key: string): boolean {
	const parts = key.split('.');
	let src: unknown = dict;
	for (let i = 0; i < parts.length; i++) {
		if (!src || typeof src !== 'object') return false;
		src = (src as Record<string, unknown>)[parts[i]];
	}
	return src !== undefined;
}

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
