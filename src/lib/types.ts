export type LanguageCode = string;

export type RoutingMode = 'path' | 'cookie' | 'domain';

export type LanguageDefinition = {
	label?: string;
	nativeLabel?: string;
	rtl?: boolean;
	parent?: LanguageCode;
	domains?: string[];
	load?: LocaleLoader;
};

export type ResolvedLanguageDefinition = {
	code: LanguageCode;
	label?: string;
	nativeLabel?: string;
	rtl: boolean;
	parent?: LanguageCode;
	domains: string[];
};

export type LocaleInfo = {
	code: LanguageCode;
	label?: string;
	nativeLabel?: string;
	rtl: boolean;
};

export type LocaleLoader = () => Promise<unknown>;

export type LocaleLoaderMap = Record<string, LocaleLoader>;

export type Dictionary = { [key: string]: Dictionary | string };

export type LanguagesMap = Record<LanguageCode, LanguageDefinition>;

export type I18nConfig<L extends LanguagesMap = LanguagesMap> = {
	mode: RoutingMode;
	defaultLanguage?: LanguageCode;
	languages: L;
	strict?: boolean;
	cookieName?: string;
	domainFallback?: 'default' | 'reject';
	/**
	 * Emit `<link rel="canonical">` + hreflang alternates from `<I18n />`.
	 * Defaults to `false` — opt in when you want the library to manage SEO
	 * tags for you.
	 */
	seo?: boolean;
};

export type ResolvedI18nConfig = {
	mode: RoutingMode;
	defaultLanguage: LanguageCode;
	languages: Record<LanguageCode, ResolvedLanguageDefinition>;
	codes: LanguageCode[];
	loaders: LocaleLoaderMap;
	strict: boolean;
	cookieName: string;
	domainFallback: 'default' | 'reject';
	seo: boolean;
};

export type SeoLinks = {
	canonical: string;
	alternates: { hreflang: string; href: string }[];
	xDefault?: string;
};

export type I18nPageData = {
	locale: LanguageCode;
	rtl?: boolean;
	dictionaries?: Record<LanguageCode, Dictionary>;
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

type SchemaLeaves<L extends LanguagesMap> = {
	[K in keyof L]: L[K] extends { load: () => Promise<infer M> }
		? M extends { default: infer D }
			? D
			: never
		: never;
}[keyof L];

export type SchemaFromLanguages<L extends LanguagesMap> = [
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
