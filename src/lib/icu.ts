import IntlMessageFormat from 'intl-messageformat';
import { warn } from './warnings.ts';

type Cache = Map<string, IntlMessageFormat>;
type ArgInfo = Map<string, ArgKind>;

type ArgKind =
	| { type: 'variable' }
	| { type: 'plural' | 'selectordinal' | 'number' }
	| { type: 'select'; options: string[] };

const formatterCache: Map<string, Cache> = new Map();
const argInfoCache: Map<string, ArgInfo> = new Map();

function getFormatter(locale: string, message: string): IntlMessageFormat {
	let perLocale = formatterCache.get(locale);
	if (!perLocale) {
		perLocale = new Map();
		formatterCache.set(locale, perLocale);
	}
	let formatter = perLocale.get(message);
	if (!formatter) {
		formatter = new IntlMessageFormat(message, locale, undefined, {
			ignoreTag: true
		});
		perLocale.set(message, formatter);
	}
	return formatter;
}

function collectArgInfo(message: string, formatter: IntlMessageFormat): ArgInfo {
	const cached = argInfoCache.get(message);
	if (cached) return cached;
	const info: ArgInfo = new Map();
	const ast = formatter.getAst();
	if (Array.isArray(ast)) walkAst(ast as unknown[], info);
	argInfoCache.set(message, info);
	return info;
}

function walkAst(nodes: unknown[], info: ArgInfo): void {
	for (const node of nodes) {
		if (!node || typeof node !== 'object') continue;
		const n = node as Record<string, unknown>;
		const type = n.type;
		const value = n.value as string | undefined;
		if (type === 1 && value) {
			if (!info.has(value)) info.set(value, { type: 'variable' });
		} else if (type === 2 && value) {
			info.set(value, { type: 'number' });
		} else if (type === 6 && value) {
			info.set(value, { type: 'plural' });
			const options = n.options as Record<string, { value: unknown[] }> | undefined;
			if (options) {
				for (const opt of Object.values(options)) {
					if (opt && Array.isArray(opt.value)) walkAst(opt.value, info);
				}
			}
		} else if (type === 5 && value) {
			const options = n.options as Record<string, { value: unknown[] }> | undefined;
			const optKeys = options ? Object.keys(options) : [];
			info.set(value, { type: 'select', options: optKeys });
			if (options) {
				for (const opt of Object.values(options)) {
					if (opt && Array.isArray(opt.value)) walkAst(opt.value, info);
				}
			}
		}
	}
}

export function formatMessage(
	locale: string,
	message: string,
	params: Record<string, unknown> | undefined,
	context: { key: string }
): string {
	try {
		const formatter = getFormatter(locale, message);
		const info = collectArgInfo(message, formatter);

		let input: Record<string, unknown> | undefined = params;
		if (info.size > 0) {
			let missing: Record<string, unknown> | null = null;
			for (const [name, kind] of info) {
				if (params && params[name] !== undefined) continue;
				warn(
					'missing-param',
					`Missing param "${name}" for key "${context.key}" (locale "${locale}").`
				);
				if (!missing) missing = params ? { ...params } : {};
				if (kind.type === 'select') {
					missing[name] = kind.options[0] ?? '';
				} else if (
					kind.type === 'plural' ||
					kind.type === 'selectordinal' ||
					kind.type === 'number'
				) {
					missing[name] = 0;
				} else {
					missing[name] = '';
				}
			}
			if (missing) input = missing;
		}

		const result = formatter.format(input);
		return typeof result === 'string'
			? result
			: Array.isArray(result)
				? result.join('')
				: String(result ?? '');
	} catch (err) {
		const msg = (err as Error).message ?? '';
		if (msg.startsWith('[svelte-i18n]')) throw err;
		warn(
			'icu-error',
			`Error formatting key "${context.key}" (locale "${locale}"): ${msg}`
		);
		return '';
	}
}

export function clearIcuCache(): void {
	formatterCache.clear();
	argInfoCache.clear();
}
