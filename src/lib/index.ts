export { createI18n, type TypedT } from './create.ts';
export { schema, typed } from './schema.ts';
export { setLocale, getCurrentLocale, getLocales } from './locale.ts';
export { getSeoLinks, type SeoContext } from './seo.ts';
export {
	createI18nContext,
	getI18nContext,
	type I18nContext
} from './context.svelte.ts';
export { default as I18n } from './I18n.svelte';
export {
	primeDictionary,
	getCachedDictionary,
	loadDictionary,
	loadChain
} from './dictionary.ts';
export type {
	I18nConfig,
	LanguageCode,
	LanguageDefinition,
	ResolvedI18nConfig,
	ResolvedLanguageDefinition,
	LocaleInfo,
	LocaleLoader,
	LocaleLoaderMap,
	Dictionary,
	RoutingMode,
	SeoLinks,
	I18nPageData,
	TypedKey,
	TypedArgs,
	TypedMessageBrand,
	SchemaFromLanguages,
	LanguagesMap,
	Leaves,
	ValueAt
} from './types.ts';
