import type { LocaleCode } from './types.ts';

type Accessor = () => LocaleCode | undefined;

let clientAccessor: Accessor | null = null;
let serverAccessor: Accessor | null = null;

export function setClientLocaleAccessor(fn: Accessor): void {
	clientAccessor = fn;
}

export function setServerLocaleAccessor(fn: Accessor): void {
	serverAccessor = fn;
}

export function getActiveLocale(): LocaleCode | undefined {
	return clientAccessor?.() ?? serverAccessor?.();
}
