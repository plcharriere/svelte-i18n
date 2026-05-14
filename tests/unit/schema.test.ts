import { beforeEach, describe, expect, it, vi } from 'vitest';
import { schema, typed } from '../../src/lib/schema.ts';

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('schema()', () => {
	it('returns the passed-in object unchanged (runtime no-op)', () => {
		const input = { a: 'A', nested: { b: 'B' } };
		expect(schema(input)).toBe(input);
	});

	it('does not warn for nested objects with non-dotted keys', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		schema({
			home: { title: 'Home', body: 'body' },
			deeply: { nested: { thing: { x: 'y' } } }
		});
		expect(spy).not.toHaveBeenCalled();
	});

	it('does not warn for string values containing dots', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		schema({ key: 'a value with a dot . inside is fine' });
		expect(spy).not.toHaveBeenCalled();
	});
});

describe('typed()', () => {
	it('returns the message string identity', () => {
		const original = 'Hello {name}';
		expect(typed<{ name: string }>(original)).toBe(original);
	});
});
