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

	it('missing plural param defaults to 0', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const msg = '{count, plural, one {# item} other {# items}}';
		expect(formatMessage('en', msg, {}, ctx('c'))).toBe('0 items');
	});

	it('missing select param falls back to the first option', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const msg = '{g, select, male {He} female {She} other {They}}';
		expect(formatMessage('en', msg, {}, ctx('p'))).toBe('He');
	});

	it('missing plain variable resolves to empty string', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(formatMessage('en', 'Hello {name}', {}, ctx('g'))).toBe('Hello ');
	});

	it('malformed ICU message returns empty string instead of throwing', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		// Unclosed brace — IntlMessageFormat throws at construction; our catch
		// path must swallow it and return ''.
		expect(formatMessage('en', 'Hi {name', { name: 'x' }, ctx('g'))).toBe('');
	});

	it('formats a number with the ICU number type', () => {
		expect(
			formatMessage('en', '{n, number}', { n: 1234567 }, ctx('n'))
		).toBe('1,234,567');
	});

	it('formats selectordinal (1st, 2nd, 3rd in English)', () => {
		const msg =
			'{place, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}';
		expect(formatMessage('en', msg, { place: 1 }, ctx('p'))).toBe('1st');
		expect(formatMessage('en', msg, { place: 2 }, ctx('p'))).toBe('2nd');
		expect(formatMessage('en', msg, { place: 3 }, ctx('p'))).toBe('3rd');
		expect(formatMessage('en', msg, { place: 4 }, ctx('p'))).toBe('4th');
	});

	it('formats a date with the ICU date type', () => {
		const out = formatMessage(
			'en',
			'{d, date, short}',
			{ d: new Date('2024-03-15T00:00:00Z') },
			ctx('d')
		);
		// Locale-specific format, but should at least be non-empty and contain a digit.
		expect(out.length).toBeGreaterThan(0);
		expect(/\d/.test(out)).toBe(true);
	});

	it('formats currency via ICU number format', () => {
		const out = formatMessage(
			'en',
			'{amount, number, ::currency/USD}',
			{ amount: 9.99 },
			ctx('a')
		);
		expect(out).toContain('9.99');
	});

	it('handles nested plural-inside-select', () => {
		const msg =
			'{g, select, male {{n, plural, one {# guy} other {# guys}}} other {{n, plural, one {# person} other {# people}}}}';
		expect(formatMessage('en', msg, { g: 'male', n: 1 }, ctx('m'))).toBe(
			'1 guy'
		);
		expect(formatMessage('en', msg, { g: 'other', n: 5 }, ctx('m'))).toBe(
			'5 people'
		);
	});

	it('treats undefined params the same as an empty params object', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(formatMessage('en', 'Hello {name}', undefined, ctx('g'))).toBe(
			'Hello '
		);
	});
});
