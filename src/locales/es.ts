import { schema, typed } from '$lib';

export default schema({
	home: {
		title: '@plcharriere/svelte-i18n',
		tagline: 'i18n tipado y con ICU para SvelteKit 2 + Svelte 5.',
		active: typed<{ code: string }>('Idioma activo: {code}'),
		features: {
			cart: {
				title: 'Plurales y select',
				body: 'Pluralización por cantidad y selección por género mediante ICU.'
			},
			formatting: {
				title: 'Fechas, números, moneda',
				body: 'Formato según el idioma — mismos valores, salida nativa.'
			},
			ordinals: {
				title: 'Ordinales',
				body: 'selectordinal para 1.º / 2.º / 3.º — y 1st / 2nd / 3rd en inglés.'
			},
			reactivity: {
				title: 'Trampa de reactividad',
				body: 'Por qué capturar t() en un const rompe el cambio de idioma.'
			},
			seo: {
				title: 'Enlaces SEO',
				body: 'Canonical, hreflang y x-default — una URL por página.'
			},
			inspect: {
				title: 'Alcance por ruta',
				body: 'Mira exactamente qué claves envió el servidor para esta página.'
			}
		}
	},
	common: {
		hello: 'Hola',
		colour: 'Color',
		language: 'Idioma'
	},
	nav: {
		home: 'Inicio',
		inspect: 'Inspeccionar',
		cart: 'Carrito',
		formatting: 'Formato',
		ordinals: 'Ordinales',
		reactivity: 'Reactividad',
		seo: 'SEO'
	},
	cart: {
		title: 'Mi carrito',
		subtitle: 'Plurales y select renderizados por idioma vía ICU.',
		playground: 'Zona de prueba',
		empty: 'Tu carrito está vacío',
		itemsLabel: 'Artículos:',
		discountsLabel: 'Descuentos:',
		selectSectionTitle: 'Respuesta (select)',
		genderLabel: 'Género:',
		items: typed<{ count: number }>(
			'{count, plural, one {# artículo} other {# artículos}}'
		),
		available: typed<{ count: number }>(
			'{count, plural, one {Tienes # descuento disponible} other {Tienes # descuentos disponibles}}'
		),
		summary: typed<{ itemsCount: number; discountCount: number }>(
			'Tienes {itemsCount, plural, one {# artículo} other {# artículos}} y {discountCount, plural, one {# descuento} other {# descuentos}}'
		)
	},
	formatting: {
		title: 'Formato',
		subtitle: 'Los mismos valores, renderizados en el idioma activo.',
		localeLabel: 'Idioma',
		dateTime: 'Fecha y hora',
		numbers: 'Números',
		dateLabel: 'Fecha corta',
		dateFull: 'Fecha larga',
		timeLabel: 'Hora',
		numberLabel: 'Número',
		currencyLabel: 'Moneda',
		percentLabel: 'Porcentaje',
		amountLabel: 'Importe',
		countLabel: 'Cantidad',
		ratioLabel: 'Ratio (0–1)',
		refreshNow: 'Actualizar',
		footnote:
			'La moneda es específica del idioma (USD / EUR / SAR). El resto usa el mismo patrón ICU, formateado por Intl.',
		date: typed<{ d: Date }>('{d, date, ::yMMMd}'),
		dateLong: typed<{ d: Date }>('{d, date, ::yyyyMMMMEEEEd}'),
		time: typed<{ d: Date }>('{d, time, ::Hms}'),
		number: typed<{ n: number }>('{n, number}'),
		currency: typed<{ amount: number }>('{amount, number, ::currency/EUR}'),
		percent: typed<{ n: number }>('{n, number, ::percent}')
	},
	ordinals: {
		title: 'Ordinales',
		subtitle: 'selectordinal elige la forma según reglas CLDR — cambia de idioma.',
		playground: 'Zona de prueba',
		series: 'Serie',
		placeLabel: 'Puesto',
		note: 'En español los ordinales usan mayoritariamente "º" tras el número.',
		rank: typed<{ place: number }>('{place, selectordinal, other {#.º}}')
	},
	seo: {
		title: 'Enlaces SEO',
		subtitle: 'Canonical, hreflang y x-default para esta página — generados en el servidor.',
		disabled: 'SEO desactivado (seo: false en la config).',
		canonicalLabel: 'Canonical',
		alternatesLabel: 'Alternates',
		xDefaultLabel: 'x-default',
		renderedLabel: '<head> renderizado',
		renderedBody: 'Las etiquetas que <I18n /> inyecta en <head> para esta URL.'
	},
	reactivity: {
		heading: 'Trampa de reactividad',
		explain:
			'Cambia el idioma arriba. La tarjeta izquierda lee t() en un const — NO se actualiza. La derecha usa $derived y llamadas inline — SÍ se actualiza.',
		brokenTitle: 'Roto: capturado una vez',
		correctTitle: 'Correcto: reactivo',
		addToCart: 'Añadir al carrito',
		outOfStock: 'Agotado',
		price: typed<{ amount: number }>(
			'{amount, number, ::currency/EUR} por unidad'
		)
	},
	profile: {
		pronoun: typed<{ gender: 'male' | 'female' | 'other' }>(
			'{gender, select, male {Él respondió} female {Ella respondió} other {Elle respondió}}'
		),
		genderOptions: {
			male: 'hombre',
			female: 'mujer',
			other: 'otro'
		}
	},
	modal: {
		title: 'Añadido al carrito',
		body: typed<{ name: string }>('{name} ya está en tu carrito.'),
		close: 'Cerrar'
	},
	inspect: {
		subtitle:
			'Exactamente lo que el servidor envió a esta página, para cada idioma de la cadena de respaldo. Cambia de idioma — el conjunto se actualiza.',
		routeLabel: 'Ruta',
		activeLabel: 'Idioma activo',
		chainLabel: 'Cadena de respaldo',
		payloadLabel: 'Carga útil',
		payload: typed<{ bytes: number }>(
			'{bytes, number} bytes (JSON sin comprimir)'
		),
		keyCount: typed<{ count: number }>(
			'{count, plural, =0 {ninguna clave} one {# clave} other {# claves}}'
		),
		noKeys: 'Sin claves.',
		activeBadge: 'activo'
	}
});
