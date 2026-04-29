import { normalizeConfig, setCurrentConfig } from './config.ts';
import { t as rawT } from './t.svelte.ts';
import type {
	I18nConfig,
	LanguagesMap,
	SchemaFromLanguages,
	TypedArgs,
	TypedKey
} from './types.ts';

export type TypedT<S = undefined> = <K extends TypedKey<S>>(
	key: K,
	...args: TypedArgs<S, K>
) => string;

export function createI18n<L extends LanguagesMap>(
	config: I18nConfig<L>
): TypedT<SchemaFromLanguages<L>> {
	const resolved = normalizeConfig(config);
	setCurrentConfig(resolved);
	return rawT as TypedT<SchemaFromLanguages<L>>;
}
