import type {
	I18nConfig,
	LocaleCode,
	LocaleDefinition,
	LocalesMap,
	LocaleLoaderMap,
	ResolvedI18nConfig,
	ResolvedLocaleDefinition
} from './types.ts';
const DEFAULT_LOCALE_FALLBACK = 'en';

function inheritField<T>(
	code: LocaleCode,
	field: keyof LocaleDefinition,
	raw: Record<LocaleCode, LocaleDefinition>,
	visiting: Set<LocaleCode> = new Set()
): T | undefined {
	if (visiting.has(code)) return undefined;
	visiting.add(code);
	const def = raw[code];
	if (!def) return undefined;
	const own = def[field] as T | undefined;
	if (own !== undefined) return own;
	if (def.parent) return inheritField<T>(def.parent, field, raw, visiting);
	return undefined;
}

export function normalizeConfig<L extends LocalesMap>(
	config: I18nConfig<L>
): ResolvedI18nConfig {
	const defaultLocale =
		config.defaultLocale ?? DEFAULT_LOCALE_FALLBACK;

	if (!config.locales[defaultLocale]) {
		throw new Error(
			`[svelte-i18n] defaultLocale "${defaultLocale}" is not declared in locales.`
		);
	}

	const locales: Record<LocaleCode, ResolvedLocaleDefinition> = {};
	const loaders: LocaleLoaderMap = {};
	for (const code of Object.keys(config.locales)) {
		const def = config.locales[code];
		locales[code] = {
			code,
			label: def.label ?? inheritField<string>(code, 'label', config.locales),
			nativeLabel:
				def.nativeLabel ??
				inheritField<string>(code, 'nativeLabel', config.locales),
			rtl:
				def.rtl ??
				inheritField<boolean>(code, 'rtl', config.locales) ??
				false,
			parent: def.parent,
			domains:
				def.domains ??
				inheritField<string[]>(code, 'domains', config.locales) ??
				[]
		};
		if (def.load) loaders[code] = def.load;
	}

	return {
		mode: config.mode ?? 'path',
		defaultLocale,
		locales,
		codes: Object.keys(locales),
		loaders,
		strict: !!config.strict,
		cookieName: config.cookieName ?? 'locale',
		domainFallback: config.domainFallback ?? 'default',
		seo: config.seo ?? true,
		syncTabs: config.syncTabs ?? true,
		syncChannel: config.syncChannel ?? 'svelte-i18n'
	};
}

export function fallbackChain(
	code: LocaleCode,
	config: ResolvedI18nConfig
): LocaleCode[] {
	const chain: LocaleCode[] = [];
	const seen = new Set<LocaleCode>();
	let current: LocaleCode | undefined = code;
	while (current && !seen.has(current)) {
		seen.add(current);
		chain.push(current);
		current = config.locales[current]?.parent;
	}
	if (!seen.has(config.defaultLocale)) {
		chain.push(config.defaultLocale);
	}
	return chain;
}

let current: ResolvedI18nConfig | undefined;

export function setCurrentConfig(config: ResolvedI18nConfig): void {
	current = config;
}

export function getCurrentConfig(): ResolvedI18nConfig {
	if (!current) {
		throw new Error(
			'[svelte-i18n] createI18n() must be called before using translation APIs.'
		);
	}
	return current;
}

export function peekCurrentConfig(): ResolvedI18nConfig | undefined {
	return current;
}
