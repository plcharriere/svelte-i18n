import type { LocaleCode } from './types.ts';

export type RequestI18nState = {
	locale: LocaleCode;
};

type Storage = {
	run<T>(state: RequestI18nState, fn: () => T): T;
	getStore(): RequestI18nState | undefined;
};

let storage: Storage | null = null;

if (typeof window === 'undefined') {
	const mod = await import('node:async_hooks');
	const als = new mod.AsyncLocalStorage<RequestI18nState>();
	storage = {
		run: (state, fn) => als.run(state, fn),
		getStore: () => als.getStore()
	};
}

export function runWithI18n<T>(state: RequestI18nState, fn: () => T): T {
	return storage ? storage.run(state, fn) : fn();
}

export function getServerLocale(): LocaleCode | undefined {
	return storage?.getStore()?.locale;
}
