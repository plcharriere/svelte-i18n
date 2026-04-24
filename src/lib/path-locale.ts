import type { LanguageCode, ResolvedI18nConfig } from './types.ts';

const LANG_SEGMENT_RE =
	/^([A-Za-z]{2,3}(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|\d{3}))?)(?=\/|$)/;

export function extractPathLocale(
	pathname: string,
	config: ResolvedI18nConfig
): { code: LanguageCode | undefined; rest: string } {
	const trimmed = pathname.replace(/^\/+/, '');
	const match = trimmed.match(LANG_SEGMENT_RE);
	if (!match) return { code: undefined, rest: pathname };
	const candidate = match[1];
	const code = findCode(candidate, config);
	if (!code) return { code: undefined, rest: pathname };
	const rest = '/' + trimmed.slice(candidate.length).replace(/^\/+/, '');
	return { code, rest: rest === '/' ? '/' : rest };
}

function findCode(
	candidate: string,
	config: ResolvedI18nConfig
): LanguageCode | undefined {
	if (config.languages[candidate]) return candidate;
	const lower = candidate.toLowerCase();
	for (const code of config.codes) {
		if (code.toLowerCase() === lower) return code;
	}
	return undefined;
}
