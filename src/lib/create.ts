import { normalizeConfig, setCurrentConfig } from './config.ts';
import { t as rawT } from './t.svelte.ts';
import type {
	I18nConfig,
	LanguagesMap,
	SchemaFromLanguages,
	TypedArgs,
	TypedKey
} from './types.ts';

// Bundle returned by `createI18n()`. Only `t` is carried here — the merged
// schema `S`, derived from every `languages[code].load` in the config, has to
// flow through a factory-bound function so keys autocomplete and per-key
// params are inferred from `typed<T>()` brands. Everything else
// (`setLocale`, `getCurrentLocale`, `getLocales`, `getSeoLinks`) is
// schema-agnostic and is imported directly from `@plcharriere/svelte-i18n`.
export type I18nInstance<S = undefined> = {
	t: <K extends TypedKey<S>>(key: K, ...args: TypedArgs<S, K>) => string;
};

export function createI18n<L extends LanguagesMap>(
	config: I18nConfig<L>
): I18nInstance<SchemaFromLanguages<L>> {
	const resolved = normalizeConfig(config);
	setCurrentConfig(resolved);
	return {
		// Runtime `t` is schema-agnostic; the cast binds it to the schema
		// derived from the languages map. No behavioral change.
		t: rawT as I18nInstance<SchemaFromLanguages<L>>['t']
	};
}
