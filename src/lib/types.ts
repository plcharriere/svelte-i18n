export type LocaleCode = string;

export type RoutingMode = 'path' | 'cookie' | 'domain';

export type LocaleDefinition = {
	label?: string;
	nativeLabel?: string;
	rtl?: boolean;
	parent?: LocaleCode;
	domains?: string[];
	load?: LocaleLoader;
};

export type ResolvedLocaleDefinition = {
	code: LocaleCode;
	label?: string;
	nativeLabel?: string;
	rtl: boolean;
	parent?: LocaleCode;
	domains: string[];
};

export type LocaleInfo = {
	code: LocaleCode;
	label?: string;
	nativeLabel?: string;
	rtl: boolean;
};

export type LocaleLoader = () => Promise<unknown>;

export type LocaleLoaderMap = Record<string, LocaleLoader>;

export type Dictionary = { [key: string]: Dictionary | string };

export type LocalesMap = Record<LocaleCode, LocaleDefinition>;

export type I18nConfig<L extends LocalesMap = LocalesMap> = {
	/**
	 * How the active locale is resolved per request. Defaults to `'path'`.
	 */
	mode?: RoutingMode;
	defaultLocale?: LocaleCode;
	locales: L;
	strict?: boolean;
	cookieName?: string;
	domainFallback?: 'default' | 'reject';
	/**
	 * Emit `<link rel="canonical">` + hreflang alternates from `<I18n />`.
	 * Defaults to `true`. Pass `false` to suppress the library's SEO output
	 * (e.g. when another tool manages canonical / hreflang tags).
	 */
	seo?: boolean;
	/**
	 * Cross-tab locale sync via `BroadcastChannel`. Cookie mode only —
	 * ignored in path/domain modes. Defaults to `true`.
	 */
	syncTabs?: boolean;
	/**
	 * `BroadcastChannel` name used when `syncTabs` is enabled. Defaults to
	 * `'svelte-i18n'`. Override if you have multiple apps on the same origin
	 * that should not share the channel.
	 */
	syncChannel?: string;
};

export type ResolvedI18nConfig = {
	mode: RoutingMode;
	defaultLocale: LocaleCode;
	locales: Record<LocaleCode, ResolvedLocaleDefinition>;
	codes: LocaleCode[];
	loaders: LocaleLoaderMap;
	strict: boolean;
	cookieName: string;
	domainFallback: 'default' | 'reject';
	seo: boolean;
	syncTabs: boolean;
	syncChannel: string;
};

export type SeoLinks = {
	canonical: string;
	alternates: { hreflang: string; href: string }[];
	xDefault?: string;
};

export type I18nPageData = {
	locale: LocaleCode;
	rtl?: boolean;
	dictionaries?: Record<LocaleCode, Dictionary>;
	seo?: SeoLinks;
};

declare const __typedParams: unique symbol;
export type TypedMessageBrand<T> = string & {
	readonly [__typedParams]: T;
};

type UnionToIntersection<U> = (
	U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
	? I
	: never;

type SchemaLeaves<L extends LocalesMap> = {
	[K in keyof L]: L[K] extends { load: () => Promise<infer M> }
		? M extends { default: infer D }
			? D
			: never
		: never;
}[keyof L];

export type SchemaFromLocales<L extends LocalesMap> = [
	SchemaLeaves<L>
] extends [never]
	? undefined
	: UnionToIntersection<SchemaLeaves<L>>;

export type Leaves<T, P extends string = ''> = T extends string
	? P
	: T extends readonly unknown[]
		? never
		: T extends Record<string, unknown>
			? {
					[K in keyof T & string]: Leaves<
						T[K],
						P extends '' ? K : `${P}.${K}`
					>;
				}[keyof T & string]
			: never;

export type ValueAt<T, K extends string> = K extends `${infer Head}.${infer Rest}`
	? Head extends keyof T
		? ValueAt<T[Head], Rest>
		: never
	: K extends keyof T
		? T[K]
		: never;

export type TypedKey<S> = [S] extends [undefined]
	? string
	: Leaves<S> & string;

export type TypedArgs<S, K extends string> = [S] extends [undefined]
	? [params?: Record<string, unknown>]
	: ValueAt<S, K> extends TypedMessageBrand<infer P>
		? [params: P]
		: [params?: Record<string, unknown>];
