import { describe, expect, it } from 'vitest';
import { hasKey, pickKeys, pruneDicts } from '../../src/lib/prune.ts';

describe('pickKeys', () => {
	const dict = {
		home: {
			title: 'Home',
			features: {
				cart: { title: 'Cart', body: 'items' },
				seo: { title: 'SEO', body: 'links' }
			}
		},
		cart: {
			title: 'My cart',
			empty: 'Empty'
		},
		nav: { home: 'Home', cart: 'Cart' }
	};

	it('copies only listed leaf keys', () => {
		const out = pickKeys(dict, ['home.title', 'nav.home']);
		expect(out).toEqual({
			home: { title: 'Home' },
			nav: { home: 'Home' }
		});
	});

	it('creates nested objects as needed', () => {
		const out = pickKeys(dict, ['home.features.cart.title']);
		expect(out).toEqual({
			home: { features: { cart: { title: 'Cart' } } }
		});
	});

	it('silently skips missing keys', () => {
		const out = pickKeys(dict, ['nonexistent.key', 'home.title']);
		expect(out).toEqual({ home: { title: 'Home' } });
	});

	it('stops traversal when path hits a non-object', () => {
		const out = pickKeys(dict, ['home.title.extra', 'cart.title']);
		expect(out).toEqual({ cart: { title: 'My cart' } });
	});

	it('handles top-level keys', () => {
		const out = pickKeys(dict, ['cart']);
		expect(out).toEqual({
			cart: { title: 'My cart', empty: 'Empty' }
		});
	});

	it('returns empty dict when no keys match', () => {
		expect(pickKeys(dict, ['unknown.a', 'unknown.b'])).toEqual({});
	});

	it('returns empty dict for empty key list', () => {
		expect(pickKeys(dict, [])).toEqual({});
	});

	it('does not mutate input', () => {
		const snapshot = JSON.stringify(dict);
		pickKeys(dict, ['home.title', 'cart.title']);
		expect(JSON.stringify(dict)).toBe(snapshot);
	});
});

describe('hasKey', () => {
	const dict = {
		a: { b: { c: 'leaf' } },
		flat: 'x'
	};

	it('returns true for a leaf at the path', () => {
		expect(hasKey(dict, 'flat')).toBe(true);
		expect(hasKey(dict, 'a.b.c')).toBe(true);
	});

	it('returns true for an intermediate object node', () => {
		expect(hasKey(dict, 'a.b')).toBe(true);
	});

	it('returns false for missing branches', () => {
		expect(hasKey(dict, 'a.missing')).toBe(false);
		expect(hasKey(dict, 'nope')).toBe(false);
	});

	it('returns false when traversal hits a non-object', () => {
		expect(hasKey(dict, 'flat.more')).toBe(false);
	});
});

describe('pruneDicts (fallback-aware)', () => {
	it('child claims every key it has; ancestor ships only the gaps', () => {
		const dicts = {
			fr: { cart: { title: 'Panier', empty: 'Vide' }, nav: { home: 'Accueil' } },
			en: {
				cart: { title: 'Cart', empty: 'Empty', more: 'More' },
				nav: { home: 'Home' }
			}
		};
		const out = pruneDicts(['fr', 'en'], dicts, [
			'cart.title',
			'cart.empty',
			'cart.more',
			'nav.home'
		]);
		expect(out.fr).toEqual({
			cart: { title: 'Panier', empty: 'Vide' },
			nav: { home: 'Accueil' }
		});
		// Only the key missing from fr:
		expect(out.en).toEqual({ cart: { more: 'More' } });
	});

	it('ships empty `{}` for a fallback when the child is complete', () => {
		const dicts = {
			fr: { cart: { title: 'Panier' } },
			en: { cart: { title: 'Cart' } }
		};
		const out = pruneDicts(['fr', 'en'], dicts, ['cart.title']);
		expect(out.fr).toEqual({ cart: { title: 'Panier' } });
		expect(out.en).toEqual({});
	});

	it('handles multi-hop chains (child → parent → default)', () => {
		const dicts = {
			'en-GB': { common: { colour: 'Colour' } },
			en: {
				common: { colour: 'Color', footer: 'Footer' },
				nav: { home: 'Home' }
			}
		};
		const out = pruneDicts(
			['en-GB', 'en'],
			dicts,
			['common.colour', 'common.footer', 'nav.home']
		);
		expect(out['en-GB']).toEqual({ common: { colour: 'Colour' } });
		// Everything en-GB didn't have:
		expect(out.en).toEqual({
			common: { footer: 'Footer' },
			nav: { home: 'Home' }
		});
	});

	it('silently skips locales absent from the dicts map', () => {
		const dicts = { en: { cart: { title: 'Cart' } } };
		const out = pruneDicts(['fr', 'en'], dicts, ['cart.title']);
		expect(out.fr).toBeUndefined();
		expect(out.en).toEqual({ cart: { title: 'Cart' } });
	});
});
