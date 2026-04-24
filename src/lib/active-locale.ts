import type { LanguageCode } from './types.ts';

type Accessor = () => LanguageCode | undefined;

let clientAccessor: Accessor | null = null;
let serverAccessor: Accessor | null = null;

export function setClientLocaleAccessor(fn: Accessor): void {
	clientAccessor = fn;
}

export function setServerLocaleAccessor(fn: Accessor): void {
	serverAccessor = fn;
}

export function getActiveLocale(): LanguageCode | undefined {
	return clientAccessor?.() ?? serverAccessor?.();
}
