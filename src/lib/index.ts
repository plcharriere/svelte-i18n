export {
	createI18n,
	type I18nInstance,
	type LocaleCodeOf,
	type TypedLocaleInfo,
	type TypedT
} from './create.ts';
export { schema, typed } from './schema.ts';
export { setLocale, getCurrentLocale, getDefaultLocale, getLocales } from './locale.ts';
export { isLoadingLocale, getLoadingLocale } from './loading.svelte.ts';
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
	LocaleCode,
	LocaleDefinition,
	ResolvedI18nConfig,
	ResolvedLocaleDefinition,
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
	SchemaFromLocales,
	LocalesMap,
	Leaves,
	ValueAt
} from './types.ts';
