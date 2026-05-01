import { normalizeConfig, setCurrentConfig } from './config.ts';
import {
	isLoadingLocale as rawIsLoadingLocale,
	getLoadingLocale as rawGetLoadingLocale
} from './loading.svelte.ts';
import {
	setLocale as rawSetLocale,
	getCurrentLocale as rawGetCurrentLocale,
	getDefaultLocale as rawGetDefaultLocale,
	getLocales as rawGetLocales
} from './locale.ts';
import { t as rawT } from './t.svelte.ts';
import type {
	I18nConfig,
	LocaleInfo,
	LocalesMap,
	SchemaFromLocales,
	TypedArgs,
	TypedKey
} from './types.ts';

export type LocaleCodeOf<L extends LocalesMap> = keyof L & string;

export type TypedLocaleInfo<L extends LocalesMap> = LocaleInfo & {
	code: LocaleCodeOf<L>;
};

export type TypedT<S = undefined> = <K extends TypedKey<S>>(
	key: K,
	...args: TypedArgs<S, K>
) => string;

export type I18nInstance<L extends LocalesMap> = {
	t: TypedT<SchemaFromLocales<L>>;
	setLocale: (code: LocaleCodeOf<L>) => Promise<void>;
	getCurrentLocale: () => TypedLocaleInfo<L>;
	getDefaultLocale: () => TypedLocaleInfo<L>;
	getLocales: () => TypedLocaleInfo<L>[];
	isLoadingLocale: (code?: LocaleCodeOf<L>) => boolean;
	getLoadingLocale: () => LocaleCodeOf<L> | undefined;
};

export function createI18n<L extends LocalesMap>(
	config: I18nConfig<L>
): I18nInstance<L> {
	const resolved = normalizeConfig(config);
	setCurrentConfig(resolved);
	return {
		t: rawT,
		setLocale: rawSetLocale,
		getCurrentLocale: rawGetCurrentLocale,
		getDefaultLocale: rawGetDefaultLocale,
		getLocales: rawGetLocales,
		isLoadingLocale: rawIsLoadingLocale,
		getLoadingLocale: rawGetLoadingLocale
	} as I18nInstance<L>;
}
