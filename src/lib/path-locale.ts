import type { LanguageCode, ResolvedI18nConfig } from './types.ts';

// Path-segment locale extraction. Lives in its own module (no `RequestEvent`,
// no cookies, no host matching) so the client graph pulls only this piece —
// `resolver.ts`'s server-side helpers stay out of the browser bundle.

// Matches BCP 47-ish language tags:
//   primary (2–3 letters, ISO 639-1/639-3)
//   + optional script (4 letters, ISO 15924, e.g. `Hant`)
//   + optional region (2 letters ISO 3166-1 or 3 digits UN M.49)
// Covers `en`, `en-GB`, `zh-Hant`, `zh-Hant-CN`, `es-419`. We keep the match
// loose and rely on `findCode()` to reject candidates not in the configured
// set, so false positives like `abc-DEF` never win over a real code.
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
	// Case-insensitive match for region part, e.g. en-gb → en-GB
	const lower = candidate.toLowerCase();
	for (const code of config.codes) {
		if (code.toLowerCase() === lower) return code;
	}
	return undefined;
}
