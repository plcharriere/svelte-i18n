import { beforeEach, describe, expect, it, vi } from 'vitest';
import { schema, typed } from '../../src/lib/schema.ts';

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('schema()', () => {
	it('returns the passed-in object', () => {
		const dict = schema({ a: 'A' });
		expect(dict).toEqual({ a: 'A' });
	});

	it('warns when a dotted key is used', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		schema({ 'cart.items': 'bad' });
		expect(spy).toHaveBeenCalledWith(expect.stringContaining('dotted-schema-key'));
	});

	it('recurses into nested objects', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		schema({ nested: { 'bad.key': 'x' } });
		expect(spy).toHaveBeenCalledWith(expect.stringContaining('dotted-schema-key'));
	});
});

describe('typed()', () => {
	it('returns the message string unchanged', () => {
		const msg = typed<{ name: string }>('Hello {name}');
		expect(msg).toBe('Hello {name}');
	});
});
