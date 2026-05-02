import type { LocaleCode } from './types.ts';

export type RequestI18nState = {
	locale: LocaleCode;
};

type Storage = {
	run<T>(state: RequestI18nState, fn: () => T): T;
	getStore(): RequestI18nState | undefined;
};

let storage: Storage = {
	run: (_state, fn) => fn(),
	getStore: () => undefined
};

export function setStorage(s: Storage): void {
	storage = s;
}

export function runWithI18n<T>(state: RequestI18nState, fn: () => T): T {
	return storage.run(state, fn);
}

export function getServerLocale(): LocaleCode | undefined {
	return storage.getStore()?.locale;
}
