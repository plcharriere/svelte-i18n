import { schema, typed } from '$lib';

export default schema({
	home: {
		title: 'svelte-i18n',
		tagline: 'Typed, ICU-aware i18n for SvelteKit 2 + Svelte 5.',
		active: typed<{ code: string }>('Active locale: {code}'),
		features: {
			cart: {
				title: 'Plurals & select',
				body: 'Count-aware pluralization and gender selection via ICU messages.'
			},
			formatting: {
				title: 'Dates, numbers, currency',
				body: 'Locale-aware formatting — same input, native output in every language.'
			},
			ordinals: {
				title: 'Ordinals',
				body: 'selectordinal gives you 1st / 2nd / 3rd — and 1er / 2e in French.'
			},
			reactivity: {
				title: 'Reactivity pitfall',
				body: 'Why capturing t() into a const breaks locale switching — and the fix.'
			},
			seo: {
				title: 'SEO links',
				body: 'Canonical, hreflang alternates, and x-default — one URL per page.'
			},
			about: {
				title: 'About',
				body: 'What this demo covers and how to run it locally.'
			}
		}
	},
	common: {
		hello: 'Hello',
		colour: 'Color',
		language: 'Language',
		footer: typed<{ year: number }>('svelte-i18n demo · {year}')
	},
	nav: {
		home: 'Home',
		about: 'About',
		cart: 'Cart',
		formatting: 'Formatting',
		ordinals: 'Ordinals',
		reactivity: 'Reactivity',
		seo: 'SEO'
	},
	about: {
		title: 'About',
		body: 'This demo exercises the svelte-i18n library.',
		hint: 'Use the locale picker in the header to flip every page — nav, body, dates, plurals and ordinals all update without a full reload.'
	},
	cart: {
		title: 'My cart',
		subtitle: 'Pluralization and select rules, rendered per-locale via ICU.',
		playground: 'Playground',
		empty: 'Your cart is empty',
		itemsLabel: 'Items:',
		discountsLabel: 'Discounts:',
		selectSectionTitle: 'Reply (select)',
		genderLabel: 'Gender:',
		items: typed<{ count: number }>(
			'{count, plural, one {# item} other {# items}}'
		),
		available: typed<{ count: number }>(
			'{count, plural, one {You have # discount available} other {You have # discounts available}}'
		),
		summary: typed<{ itemsCount: number; discountCount: number }>(
			'You have {itemsCount, plural, one {# item} other {# items}} and {discountCount, plural, one {# discount} other {# discounts}}'
		)
	},
	formatting: {
		title: 'Formatting',
		subtitle: 'One set of values, rendered through the active locale.',
		localeLabel: 'Locale',
		dateTime: 'Date & time',
		numbers: 'Numbers',
		dateLabel: 'Short date',
		dateFull: 'Long date',
		timeLabel: 'Time',
		numberLabel: 'Number',
		currencyLabel: 'Currency',
		percentLabel: 'Percent',
		amountLabel: 'Amount',
		countLabel: 'Count',
		ratioLabel: 'Ratio (0–1)',
		refreshNow: 'Refresh now',
		footnote:
			'Currency is locale-specific (USD / EUR / SAR) — each locale overrides the message. Everything else is the same ICU pattern, formatted per-locale by Intl.',
		date: typed<{ d: Date }>('{d, date, ::yMMMd}'),
		dateLong: typed<{ d: Date }>('{d, date, ::yyyyMMMMEEEEd}'),
		time: typed<{ d: Date }>('{d, time, ::Hms}'),
		number: typed<{ n: number }>('{n, number}'),
		currency: typed<{ amount: number }>('{amount, number, ::currency/USD}'),
		percent: typed<{ n: number }>('{n, number, ::percent}')
	},
	ordinals: {
		title: 'Ordinals',
		subtitle: 'selectordinal picks a form based on CLDR ordinal rules — try switching locale.',
		playground: 'Playground',
		series: 'Series',
		placeLabel: 'Place',
		note: 'Rules vary: English splits one/two/few (1st, 2nd, 3rd, 4th), French collapses almost everything to "e" (except "1er").',
		rank: typed<{ place: number }>(
			'{place, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}'
		)
	},
	seo: {
		title: 'SEO links',
		subtitle: 'Canonical, hreflang alternates and x-default for this page — generated server-side.',
		disabled: 'SEO is disabled in the current config (seo: false).',
		canonicalLabel: 'Canonical',
		alternatesLabel: 'Alternates',
		xDefaultLabel: 'x-default',
		renderedLabel: 'Rendered <head>',
		renderedBody:
			'These are the exact tags <I18n /> injects into the document head for this URL.'
	},
	reactivity: {
		heading: 'Reactivity pitfall',
		explain:
			'Switch locale using the selector above. The left card reads t() into a const — it will NOT update. The right card uses $derived and inline template calls — it WILL update.',
		brokenTitle: 'Broken: captured once',
		correctTitle: 'Correct: reactive',
		addToCart: 'Add to cart',
		outOfStock: 'Out of stock',
		price: typed<{ amount: number }>(
			'{amount, number, ::currency/USD} per unit'
		)
	},
	profile: {
		pronoun: typed<{ gender: 'male' | 'female' | 'other' }>(
			'{gender, select, male {He replied} female {She replied} other {They replied}}'
		),
		genderOptions: {
			male: 'male',
			female: 'female',
			other: 'other'
		}
	}
});
