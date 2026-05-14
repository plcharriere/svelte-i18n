import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
	vi.resetModules();
});

describe('ssr-store (default no-op storage)', () => {
	it('runWithI18n calls fn synchronously and returns its value', async () => {
		const { runWithI18n } = await import('../../src/lib/ssr-store.ts');
		const result = runWithI18n({ locale: 'fr' }, () => 'hello');
		expect(result).toBe('hello');
	});

	it('getServerLocale returns undefined with the default storage', async () => {
		const { getServerLocale } = await import('../../src/lib/ssr-store.ts');
		expect(getServerLocale()).toBeUndefined();
	});

	it('getServerLocale stays undefined even inside runWithI18n (no-op storage)', async () => {
		const { runWithI18n, getServerLocale } = await import(
			'../../src/lib/ssr-store.ts'
		);
		runWithI18n({ locale: 'fr' }, () => {
			expect(getServerLocale()).toBeUndefined();
		});
	});
});

describe('ssr-store (injected storage)', () => {
	it('runWithI18n delegates to the injected storage', async () => {
		const { runWithI18n, setStorage } = await import('../../src/lib/ssr-store.ts');
		const calls: Array<{ state: unknown; ran: boolean }> = [];
		setStorage({
			run: (state, fn) => {
				const ran = { state, ran: true };
				calls.push(ran);
				return fn();
			},
			getStore: () => undefined
		});
		runWithI18n({ locale: 'fr' }, () => 42);
		expect(calls).toEqual([{ state: { locale: 'fr' }, ran: true }]);
	});

	it('getServerLocale reads through the injected storage', async () => {
		const { getServerLocale, setStorage } = await import(
			'../../src/lib/ssr-store.ts'
		);
		setStorage({
			run: (_state, fn) => fn(),
			getStore: () => ({ locale: 'es' })
		});
		expect(getServerLocale()).toBe('es');
	});

	it('returns undefined when injected getStore returns undefined', async () => {
		const { getServerLocale, setStorage } = await import(
			'../../src/lib/ssr-store.ts'
		);
		setStorage({
			run: (_state, fn) => fn(),
			getStore: () => undefined
		});
		expect(getServerLocale()).toBeUndefined();
	});

});
