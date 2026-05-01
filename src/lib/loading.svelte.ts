import type { LocaleCode } from './types.ts';

let loadingLocale = $state<LocaleCode | undefined>(undefined);

export function setLoadingLocale(code: LocaleCode | undefined): void {
	loadingLocale = code;
}

export function isLoadingLocale(code?: LocaleCode): boolean {
	if (code === undefined) return loadingLocale !== undefined;
	return loadingLocale === code;
}

export function getLoadingLocale(): LocaleCode | undefined {
	return loadingLocale;
}
