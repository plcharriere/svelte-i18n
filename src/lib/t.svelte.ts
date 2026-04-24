import { getActiveLocale } from './active-locale.ts';
import { getCurrentConfig } from './config.ts';
import { resolveMessage } from './dictionary.ts';
import { formatMessage } from './icu.ts';

let revision = $state(0);

export function bumpTranslationRevision(): void {
	revision++;
}

export function t(
	key: string,
	params?: Record<string, unknown>
): string {
	revision;
	const config = getCurrentConfig();
	const locale = getActiveLocale() ?? config.defaultLanguage;
	const resolved = resolveMessage(key, locale, config);
	if (!resolved) return '';
	return formatMessage(resolved.locale, resolved.message, params, { key });
}
