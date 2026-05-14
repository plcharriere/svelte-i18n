import { beforeEach, describe, expect, it } from 'vitest';
import {
	getLoadingLocale,
	isLoadingLocale,
	setLoadingLocale
} from '../../src/lib/loading.svelte.ts';

beforeEach(() => {
	setLoadingLocale(undefined);
});

describe('loading-locale state', () => {
	it('is initially undefined / not loading', () => {
		expect(getLoadingLocale()).toBeUndefined();
		expect(isLoadingLocale()).toBe(false);
		expect(isLoadingLocale('fr')).toBe(false);
	});

	it('reflects the in-flight code (with and without filter)', () => {
		setLoadingLocale('fr');
		expect(getLoadingLocale()).toBe('fr');
		expect(isLoadingLocale()).toBe(true);
		expect(isLoadingLocale('fr')).toBe(true);
		expect(isLoadingLocale('en')).toBe(false);
	});

	it('replaces the in-flight code on subsequent set, clears on undefined', () => {
		setLoadingLocale('fr');
		setLoadingLocale('es');
		expect(getLoadingLocale()).toBe('es');
		setLoadingLocale(undefined);
		expect(getLoadingLocale()).toBeUndefined();
		expect(isLoadingLocale()).toBe(false);
	});
});
