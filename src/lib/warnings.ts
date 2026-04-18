import { peekCurrentConfig } from './config.ts';

export function warn(code: string, message: string): void {
	const formatted = `[svelte-i18n] ${code}: ${message}`;
	if (peekCurrentConfig()?.strict) {
		throw new Error(formatted);
	}
	if (typeof console !== 'undefined') {
		console.warn(formatted);
	}
}
