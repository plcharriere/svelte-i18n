import type {
	I18nConfig,
	LanguageCode,
	LanguageDefinition,
	LanguagesMap,
	LocaleLoaderMap,
	ResolvedI18nConfig,
	ResolvedLanguageDefinition
} from './types.ts';
const DEFAULT_LANGUAGE_FALLBACK = 'en';

function inheritField<T>(
	code: LanguageCode,
	field: keyof LanguageDefinition,
	raw: Record<LanguageCode, LanguageDefinition>,
	visiting: Set<LanguageCode> = new Set()
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

export function normalizeConfig<L extends LanguagesMap>(
	config: I18nConfig<L>
): ResolvedI18nConfig {
	const defaultLanguage =
		config.defaultLanguage ?? DEFAULT_LANGUAGE_FALLBACK;

	if (!config.languages[defaultLanguage]) {
		throw new Error(
			`[svelte-i18n] defaultLanguage "${defaultLanguage}" is not declared in languages.`
		);
	}

	const languages: Record<LanguageCode, ResolvedLanguageDefinition> = {};
	const loaders: LocaleLoaderMap = {};
	for (const code of Object.keys(config.languages)) {
		const def = config.languages[code];
		languages[code] = {
			code,
			label: def.label ?? inheritField<string>(code, 'label', config.languages),
			nativeLabel:
				def.nativeLabel ??
				inheritField<string>(code, 'nativeLabel', config.languages),
			rtl:
				def.rtl ??
				inheritField<boolean>(code, 'rtl', config.languages) ??
				false,
			parent: def.parent,
			domains:
				def.domains ??
				inheritField<string[]>(code, 'domains', config.languages) ??
				[]
		};
		if (def.load) loaders[code] = def.load;
	}

	return {
		mode: config.mode,
		defaultLanguage,
		languages,
		codes: Object.keys(languages),
		loaders,
		strict: !!config.strict,
		cookieName: config.cookieName ?? 'locale',
		domainFallback: config.domainFallback ?? 'default',
		seo: config.seo ?? false
	};
}

export function fallbackChain(
	code: LanguageCode,
	config: ResolvedI18nConfig
): LanguageCode[] {
	const chain: LanguageCode[] = [];
	const seen = new Set<LanguageCode>();
	let current: LanguageCode | undefined = code;
	while (current && !seen.has(current)) {
		seen.add(current);
		chain.push(current);
		current = config.languages[current]?.parent;
	}
	if (!seen.has(config.defaultLanguage)) {
		chain.push(config.defaultLanguage);
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
