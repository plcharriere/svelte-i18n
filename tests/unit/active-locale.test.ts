import { beforeEach, describe, expect, it } from 'vitest';
import {
	getActiveLocale,
	setClientLocaleAccessor,
	setServerLocaleAccessor
} from '../../src/lib/active-locale.ts';

beforeEach(() => {
	setClientLocaleAccessor(() => undefined);
	setServerLocaleAccessor(() => undefined);
});

describe('getActiveLocale', () => {
	it('returns undefined when no slot has a value', () => {
		expect(getActiveLocale()).toBeUndefined();
	});

	it('client wins; falls through to server when client returns undefined', () => {
		setClientLocaleAccessor(() => 'fr');
		setServerLocaleAccessor(() => 'es');
		expect(getActiveLocale()).toBe('fr');

		setClientLocaleAccessor(() => undefined);
		expect(getActiveLocale()).toBe('es');
	});

	it('reads accessors lazily on every call', () => {
		let value: string | undefined = 'fr';
		setClientLocaleAccessor(() => value);
		expect(getActiveLocale()).toBe('fr');
		value = 'es';
		expect(getActiveLocale()).toBe('es');
		value = undefined;
		expect(getActiveLocale()).toBeUndefined();
	});
});
