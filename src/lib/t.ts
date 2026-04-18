import { getActiveLocale } from './active-locale.ts';
import { getCurrentConfig } from './config.ts';
import { resolveMessage } from './dictionary.ts';
import { formatMessage } from './icu.ts';

// Untyped internal translator. The generic, schema-typed wrapper is returned
// from `createI18n<S>()` — users should call that one, not this.
export function t(
	key: string,
	params?: Record<string, unknown>
): string {
	const config = getCurrentConfig();
	const locale = getActiveLocale() ?? config.defaultLanguage;
	const resolved = resolveMessage(key, locale, config);
	if (!resolved) return '';
	return formatMessage(resolved.locale, resolved.message, params, { key });
}
