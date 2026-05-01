import type { LanguageCode } from './types.ts';

let loadingLocale = $state<LanguageCode | undefined>(undefined);

export function setLoadingLocale(code: LanguageCode | undefined): void {
	loadingLocale = code;
}

export function isLoadingLocale(code?: LanguageCode): boolean {
	if (code === undefined) return loadingLocale !== undefined;
	return loadingLocale === code;
}

export function getLoadingLocale(): LanguageCode | undefined {
	return loadingLocale;
}
