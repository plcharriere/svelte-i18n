import { schema, typed } from '$lib';

export default schema({
	home: {
		title: 'svelte-i18n',
		tagline: 'i18n typé et ICU pour SvelteKit 2 + Svelte 5.',
		active: typed<{ code: string }>('Langue active : {code}'),
		features: {
			cart: {
				title: 'Pluriels et select',
				body: 'Pluralisation en fonction du nombre et sélection par genre via ICU.'
			},
			formatting: {
				title: 'Dates, nombres, monnaie',
				body: 'Formatage propre à chaque langue — mêmes valeurs, rendu natif.'
			},
			ordinals: {
				title: 'Ordinaux',
				body: 'selectordinal gère 1er / 2e / 3e — et 1st / 2nd / 3rd en anglais.'
			},
			reactivity: {
				title: 'Piège de réactivité',
				body: 'Pourquoi capturer t() dans un const casse le changement de langue.'
			},
			seo: {
				title: 'Liens SEO',
				body: 'Canonique, hreflang et x-default — une seule URL par page.'
			},
			about: {
				title: 'À propos',
				body: 'Ce que cette démo couvre et comment la lancer.'
			}
		}
	},
	common: {
		hello: 'Bonjour',
		colour: 'Couleur',
		language: 'Langue',
		footer: typed<{ year: number }>('démo svelte-i18n · {year}')
	},
	nav: {
		home: 'Accueil',
		about: 'À propos',
		cart: 'Panier',
		formatting: 'Formatage',
		ordinals: 'Ordinaux',
		reactivity: 'Réactivité',
		seo: 'SEO'
	},
	about: {
		title: 'À propos',
		body: 'Cette démo met à l’épreuve la librairie svelte-i18n.',
		hint: 'Utilisez le sélecteur de langue en haut — la navigation, les textes, les dates, les pluriels et les ordinaux se mettent à jour sans recharger.'
	},
	cart: {
		title: 'Mon panier',
		subtitle: 'Pluriels et select, rendus par langue via ICU.',
		playground: 'Aire de test',
		empty: 'Votre panier est vide',
		itemsLabel: 'Articles :',
		discountsLabel: 'Réductions :',
		selectSectionTitle: 'Réponse (select)',
		genderLabel: 'Genre :',
		items: typed<{ count: number }>(
			'{count, plural, zero {# article} one {# article} other {# articles}}'
		),
		available: typed<{ count: number }>(
			'{count, plural, zero {Vous avez # réduction disponible} one {Vous avez # réduction disponible} other {Vous avez # réductions disponibles}}'
		),
		summary: typed<{ itemsCount: number; discountCount: number }>(
			'Vous avez {itemsCount, plural, one {# article} other {# articles}} et {discountCount, plural, one {# réduction} other {# réductions}}'
		)
	},
	formatting: {
		title: 'Formatage',
		subtitle: 'Les mêmes valeurs, rendues dans la langue active.',
		localeLabel: 'Langue',
		dateTime: 'Date et heure',
		numbers: 'Nombres',
		dateLabel: 'Date courte',
		dateFull: 'Date longue',
		timeLabel: 'Heure',
		numberLabel: 'Nombre',
		currencyLabel: 'Monnaie',
		percentLabel: 'Pourcentage',
		amountLabel: 'Montant',
		countLabel: 'Nombre',
		ratioLabel: 'Ratio (0–1)',
		refreshNow: 'Actualiser',
		footnote:
			'La monnaie dépend de la langue (USD / EUR / SAR). Le reste utilise le même motif ICU, rendu par Intl.',
		date: typed<{ d: Date }>('{d, date, ::yMMMd}'),
		dateLong: typed<{ d: Date }>('{d, date, ::yyyyMMMMEEEEd}'),
		time: typed<{ d: Date }>('{d, time, ::Hms}'),
		number: typed<{ n: number }>('{n, number}'),
		currency: typed<{ amount: number }>('{amount, number, ::currency/EUR}'),
		percent: typed<{ n: number }>('{n, number, ::percent}')
	},
	ordinals: {
		title: 'Ordinaux',
		subtitle: 'selectordinal choisit la forme selon les règles CLDR — changez de langue.',
		playground: 'Aire de test',
		series: 'Série',
		placeLabel: 'Place',
		note: 'Le français ne distingue quasiment que le premier (1er), tout le reste devient "e".',
		rank: typed<{ place: number }>(
			'{place, selectordinal, one {#er} other {#e}}'
		)
	},
	seo: {
		title: 'Liens SEO',
		subtitle: 'Canonique, hreflang et x-default pour cette page — générés côté serveur.',
		disabled: 'Le SEO est désactivé (seo: false dans la config).',
		canonicalLabel: 'Canonique',
		alternatesLabel: 'Alternatives',
		xDefaultLabel: 'x-default',
		renderedLabel: '<head> rendu',
		renderedBody:
			'Exactement les balises que <I18n /> injecte dans le <head> pour cette URL.'
	},
	reactivity: {
		heading: 'Piège de réactivité',
		explain:
			'Changez de langue avec le sélecteur. La carte de gauche lit t() dans un const — elle NE changera PAS. Celle de droite utilise $derived et des appels dans le template — elle SE mettra à jour.',
		brokenTitle: 'Cassé : capturé une seule fois',
		correctTitle: 'Correct : réactif',
		addToCart: 'Ajouter au panier',
		outOfStock: 'Rupture de stock',
		price: typed<{ amount: number }>(
			'{amount, number, ::currency/EUR} par unité'
		)
	},
	profile: {
		pronoun: typed<{ gender: 'male' | 'female' | 'other' }>(
			'{gender, select, male {Il a répondu} female {Elle a répondu} other {Iel a répondu}}'
		),
		genderOptions: {
			male: 'homme',
			female: 'femme',
			other: 'autre'
		}
	}
});
