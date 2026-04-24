import { schema, typed } from '$lib';

export default schema({
	home: {
		title: 'svelte-i18n',
		tagline: 'i18n tipado e com ICU para SvelteKit 2 + Svelte 5.',
		active: typed<{ code: string }>('Idioma ativo: {code}'),
		features: {
			cart: {
				title: 'Plurais e select',
				body: 'Pluralização por quantidade e seleção por género via ICU.'
			},
			formatting: {
				title: 'Datas, números, moeda',
				body: 'Formatação por idioma — mesmos valores, saída nativa.'
			},
			ordinals: {
				title: 'Ordinais',
				body: 'selectordinal para 1.º / 2.º / 3.º.'
			},
			reactivity: {
				title: 'Armadilha de reatividade',
				body: 'Porque capturar t() num const quebra a troca de idioma.'
			},
			seo: {
				title: 'Ligações SEO',
				body: 'Canonical, hreflang e x-default — um URL por página.'
			},
			inspect: {
				title: 'Escopo por rota',
				body: 'Veja exatamente quais chaves o servidor enviou para esta página.'
			}
		}
	},
	common: {
		hello: 'Olá',
		colour: 'Cor',
		language: 'Idioma',
		footer: typed<{ year: number }>('demo svelte-i18n · {year}')
	},
	nav: {
		home: 'Início',
		inspect: 'Inspecionar',
		cart: 'Carrinho',
		formatting: 'Formatação',
		ordinals: 'Ordinais',
		reactivity: 'Reatividade',
		seo: 'SEO'
	},
	cart: {
		title: 'Meu carrinho',
		subtitle: 'Plurais e select renderizados por idioma via ICU.',
		playground: 'Área de testes',
		empty: 'Seu carrinho está vazio',
		itemsLabel: 'Itens:',
		discountsLabel: 'Descontos:',
		selectSectionTitle: 'Resposta (select)',
		genderLabel: 'Género:',
		items: typed<{ count: number }>(
			'{count, plural, one {# item} other {# itens}}'
		),
		available: typed<{ count: number }>(
			'{count, plural, one {Tens # desconto disponível} other {Tens # descontos disponíveis}}'
		),
		summary: typed<{ itemsCount: number; discountCount: number }>(
			'Tens {itemsCount, plural, one {# item} other {# itens}} e {discountCount, plural, one {# desconto} other {# descontos}}'
		)
	},
	formatting: {
		title: 'Formatação',
		subtitle: 'Os mesmos valores, renderizados no idioma ativo.',
		localeLabel: 'Idioma',
		dateTime: 'Data e hora',
		numbers: 'Números',
		dateLabel: 'Data curta',
		dateFull: 'Data longa',
		timeLabel: 'Hora',
		numberLabel: 'Número',
		currencyLabel: 'Moeda',
		percentLabel: 'Percentagem',
		amountLabel: 'Valor',
		countLabel: 'Quantidade',
		ratioLabel: 'Razão (0–1)',
		refreshNow: 'Atualizar',
		footnote:
			'A moeda depende do idioma (USD / EUR / SAR). O resto usa o mesmo padrão ICU, formatado por Intl.',
		date: typed<{ d: Date }>('{d, date, ::yMMMd}'),
		dateLong: typed<{ d: Date }>('{d, date, ::yyyyMMMMEEEEd}'),
		time: typed<{ d: Date }>('{d, time, ::Hms}'),
		number: typed<{ n: number }>('{n, number}'),
		currency: typed<{ amount: number }>('{amount, number, ::currency/EUR}'),
		percent: typed<{ n: number }>('{n, number, ::percent}')
	},
	ordinals: {
		title: 'Ordinais',
		subtitle: 'selectordinal escolhe a forma via regras CLDR — troque de idioma.',
		playground: 'Área de testes',
		series: 'Série',
		placeLabel: 'Posição',
		note: 'Em português os ordinais usam "º" após o número.',
		rank: typed<{ place: number }>('{place, selectordinal, other {#.º}}')
	},
	seo: {
		title: 'Ligações SEO',
		subtitle: 'Canonical, hreflang e x-default para esta página — gerados no servidor.',
		disabled: 'SEO desativado (seo: false na config).',
		canonicalLabel: 'Canonical',
		alternatesLabel: 'Alternates',
		xDefaultLabel: 'x-default',
		renderedLabel: '<head> renderizado',
		renderedBody: 'As etiquetas que <I18n /> injeta no <head> para este URL.'
	},
	reactivity: {
		heading: 'Armadilha de reatividade',
		explain:
			'Troque de idioma no topo. O cartão esquerdo lê t() num const — NÃO atualiza. O direito usa $derived e chamadas inline — atualiza.',
		brokenTitle: 'Quebrado: capturado uma vez',
		correctTitle: 'Correto: reativo',
		addToCart: 'Adicionar ao carrinho',
		outOfStock: 'Esgotado',
		price: typed<{ amount: number }>(
			'{amount, number, ::currency/EUR} por unidade'
		)
	},
	profile: {
		pronoun: typed<{ gender: 'male' | 'female' | 'other' }>(
			'{gender, select, male {Ele respondeu} female {Ela respondeu} other {Elu respondeu}}'
		),
		genderOptions: {
			male: 'homem',
			female: 'mulher',
			other: 'outro'
		}
	},
	modal: {
		title: 'Adicionado ao carrinho',
		body: typed<{ name: string }>('{name} já está no seu carrinho.'),
		close: 'Fechar'
	},
	inspect: {
		subtitle:
			'Exatamente o que o servidor enviou para esta página, para cada idioma da cadeia de recurso. Troque de idioma — o conjunto atualiza.',
		routeLabel: 'Rota',
		activeLabel: 'Idioma ativo',
		chainLabel: 'Cadeia de recurso',
		payloadLabel: 'Carga',
		payload: typed<{ bytes: number }>(
			'{bytes, number} bytes (JSON não compactado)'
		),
		keyCount: typed<{ count: number }>(
			'{count, plural, =0 {nenhuma chave} one {# chave} other {# chaves}}'
		),
		noKeys: 'Sem chaves.',
		activeBadge: 'ativo'
	}
});
