export type LanguageCode = string;

export type RoutingMode = 'path' | 'cookie' | 'domain';

// `load` is optional so tests/mocks can register locales synchronously via
// `primeDictionary`. When present, TS infers each module's default-export
// shape from the literal path in `() => import('./locales/xx')` — that's what
// lets `SchemaFromLanguages<L>` derive the merged schema automatically, with
// no central tuple, barrel, or `declare global` block.
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

// Shape of the `i18n` field on page data. The library's `+layout.server.ts`
// returns `{ i18n: I18nPageData }` so user-land SEO, auth, etc. can live at
// the top level without colliding with library concerns.
export type I18nPageData = {
	locale: LanguageCode;
	rtl?: boolean;
	dictionaries?: Record<LanguageCode, Dictionary>;
	seo?: SeoLinks;
};

// -----------------------------------------------------------------------------
// Typed keys — derived automatically from the `languages` map's `load`
// functions. `createI18n()` is generic over the map; the schema is inferred
// from each loader's literal `import('./locales/xx')` return type. No tuple,
// no `declare global`, no codegen.
// -----------------------------------------------------------------------------

// Brand carried by `typed<T>()`. A `unique symbol` key (non-optional in the
// type, never present at runtime) ensures plain `string` values do NOT match
// this shape structurally — that's what lets `TypedArgs<S, K>` distinguish
// typed leaves from plain ones.
declare const __typedParams: unique symbol;
export type TypedMessageBrand<T> = string & {
	readonly [__typedParams]: T;
};

// Convert a union type `A | B | C` into the intersection `A & B & C`.
// Classic variance trick: put the union in contravariant position so the
// compiler widens by intersecting.
type UnionToIntersection<U> = (
	U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
	? I
	: never;

// Extract each locale's default-export type (the schema) from `L[K].load`.
// Locales without `load` contribute `never`, which is absorbed by the union
// (no effect on the final intersection).
type SchemaLeaves<L extends LanguagesMap> = {
	[K in keyof L]: L[K] extends { load: () => Promise<infer M> }
		? M extends { default: infer D }
			? D
			: never
		: never;
}[keyof L];

// Public: derive the merged schema from a languages map. Per SPEC §10, the
// resulting `t()` param type for any key is the intersection of every
// locale's declared params for that key — `TypedMessageBrand<A> &
// TypedMessageBrand<B>` collapses to `TypedMessageBrand<A & B>` thanks to
// the `unique symbol` brand key. When no loaders are registered the schema
// is `undefined`, which `TypedKey` / `TypedArgs` treat as "untyped".
export type SchemaFromLanguages<L extends LanguagesMap> = [
	SchemaLeaves<L>
] extends [never]
	? undefined
	: UnionToIntersection<SchemaLeaves<L>>;

// Dotted leaf paths of a schema object. `string` (including TypedMessageBrand)
// is a leaf; arrays are excluded so stray `as const` tuples don't produce
// numeric-indexed paths; only plain object shapes recurse.
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

// Walk a dotted path into T.
export type ValueAt<T, K extends string> = K extends `${infer Head}.${infer Rest}`
	? Head extends keyof T
		? ValueAt<T[Head], Rest>
		: never
	: K extends keyof T
		? T[K]
		: never;

// Dotted keys of a schema. Fallback to `string` when S is unknown/undefined.
export type TypedKey<S> = [S] extends [undefined]
	? string
	: Leaves<S> & string;

// Argument tuple used by `t()` — tri-state so call sites behave correctly:
//   - no schema            → `[params?]`  (optional, loose)
//   - typed leaf           → `[params]`   (required, exact shape)
//   - plain string leaf    → `[params?]`  (optional, loose)
export type TypedArgs<S, K extends string> = [S] extends [undefined]
	? [params?: Record<string, unknown>]
	: ValueAt<S, K> extends TypedMessageBrand<infer P>
		? [params: P]
		: [params?: Record<string, unknown>];
