import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearIcuCache, formatMessage } from '../../src/lib/icu.ts';

beforeEach(() => {
	clearIcuCache();
	vi.restoreAllMocks();
});

const ctx = (key: string) => ({ key });

describe('formatMessage', () => {
	it('interpolates simple variables', () => {
		expect(formatMessage('en', 'Hello {name}', { name: 'Paul' }, ctx('g'))).toBe(
			'Hello Paul'
		);
	});

	it('plural one/other in English', () => {
		const msg = '{count, plural, one {# item} other {# items}}';
		expect(formatMessage('en', msg, { count: 1 }, ctx('c'))).toBe('1 item');
		expect(formatMessage('en', msg, { count: 2 }, ctx('c'))).toBe('2 items');
		expect(formatMessage('en', msg, { count: 0 }, ctx('c'))).toBe('0 items');
	});

	it('plural zero in French', () => {
		const msg = '{count, plural, zero {# article} one {# article} other {# articles}}';
		expect(formatMessage('fr', msg, { count: 0 }, ctx('c'))).toBe('0 article');
		expect(formatMessage('fr', msg, { count: 2 }, ctx('c'))).toBe('2 articles');
	});

	it('select returns the matching option', () => {
		const msg =
			'{gender, select, male {He} female {She} other {They}} replied';
		expect(formatMessage('en', msg, { gender: 'female' }, ctx('p'))).toBe(
			'She replied'
		);
	});

	it('multiple plurals in one message', () => {
		const msg =
			'You have {items, plural, one {# item} other {# items}} and {discount, plural, one {# discount} other {# discounts}}';
		expect(
			formatMessage('en', msg, { items: 3, discount: 1 }, ctx('s'))
		).toBe('You have 3 items and 1 discount');
	});

	it('missing plural param defaults to 0 and warns', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const msg = '{count, plural, one {# item} other {# items}}';
		expect(formatMessage('en', msg, {}, ctx('c'))).toBe('0 items');
		expect(spy).toHaveBeenCalledWith(expect.stringContaining('missing-param'));
	});

	it('missing select param falls back to first option', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const msg = '{g, select, male {He} female {She} other {They}}';
		expect(formatMessage('en', msg, {}, ctx('p'))).toBe('He');
		expect(spy).toHaveBeenCalled();
	});

	it('missing plain variable resolves to empty string', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(formatMessage('en', 'Hello {name}', {}, ctx('g'))).toBe('Hello ');
		expect(spy).toHaveBeenCalled();
	});

	it('malformed ICU message emits icu-error and returns empty string', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		// Unclosed brace — IntlMessageFormat throws at construction; our catch
		// path must swallow it into an icu-error warning and return ''.
		expect(formatMessage('en', 'Hi {name', { name: 'x' }, ctx('g'))).toBe('');
		expect(spy).toHaveBeenCalledWith(expect.stringContaining('icu-error'));
	});
});
