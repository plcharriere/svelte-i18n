import { DEV } from 'esm-env';
import type { Dictionary, TypedMessageBrand } from './types.ts';
import { warn } from './warnings.ts';

export function schema<T extends Dictionary>(obj: T): T {
	// Dotted keys are caught at edit-time by `Leaves<T>` producing malformed
	// paths, but we still run the runtime walk in dev as a belt-and-braces
	// guard. `esm-env` exposes DEV in a bundler-agnostic way so the check is
	// stripped from prod bundles across Vite / Rollup / webpack alike.
	if (DEV) validateSchemaKeys(obj);
	return obj;
}

export function typed<T = Record<string, unknown>>(
	message: string
): TypedMessageBrand<T> {
	return message as TypedMessageBrand<T>;
}

function validateSchemaKeys(obj: unknown, path: string[] = []): void {
	if (!obj || typeof obj !== 'object') return;
	for (const key of Object.keys(obj as Record<string, unknown>)) {
		if (key.includes('.')) {
			warn(
				'dotted-schema-key',
				`Dotted property "${key}" at path "${[...path, key].join('.')}" is invalid. Use nested objects instead.`
			);
		}
		const value = (obj as Record<string, unknown>)[key];
		if (value && typeof value === 'object') {
			validateSchemaKeys(value, [...path, key]);
		}
	}
}
