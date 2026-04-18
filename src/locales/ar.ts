import { schema, typed } from '$lib';

export default schema({
	home: {
		title: 'svelte-i18n',
		tagline: 'نظام i18n مكتوب الأنواع ومتوافق مع ICU لـ SvelteKit 2 + Svelte 5.',
		active: typed<{ code: string }>('اللغة الحالية: {code}'),
		features: {
			cart: {
				title: 'الجموع والاختيار',
				body: 'جموع مبنية على العدد واختيار حسب الجنس عبر ICU.'
			},
			formatting: {
				title: 'التواريخ والأرقام والعملات',
				body: 'تنسيق خاص بكل لغة — نفس القيم، ناتج أصيل.'
			},
			ordinals: {
				title: 'الأعداد الترتيبية',
				body: 'selectordinal لاختيار الصيغة حسب قواعد CLDR.'
			},
			reactivity: {
				title: 'فخ التفاعلية',
				body: 'لماذا يكسر التقاط t() في const تبديل اللغة.'
			},
			seo: {
				title: 'روابط SEO',
				body: 'canonical و hreflang و x-default — رابط واحد لكل صفحة.'
			},
			about: {
				title: 'حول',
				body: 'ما تغطيه هذه الديمو وكيفية تشغيلها.'
			}
		}
	},
	common: {
		hello: 'مرحبا',
		colour: 'لون',
		language: 'اللغة',
		footer: typed<{ year: number }>('عرض svelte-i18n · {year}')
	},
	nav: {
		home: 'الرئيسية',
		about: 'حول',
		cart: 'السلة',
		formatting: 'التنسيق',
		ordinals: 'الترتيب',
		reactivity: 'التفاعلية',
		seo: 'SEO'
	},
	about: {
		title: 'حول',
		body: 'هذا العرض يختبر مكتبة svelte-i18n.',
		hint: 'استخدم مبدّل اللغة في الأعلى — القوائم والنصوص والتواريخ والجموع والأعداد الترتيبية تتحدث دون إعادة تحميل.'
	},
	cart: {
		title: 'سلتي',
		subtitle: 'جموع واختيارات تُعرض لكل لغة عبر ICU.',
		playground: 'منطقة تجربة',
		empty: 'سلتك فارغة',
		itemsLabel: 'العناصر:',
		discountsLabel: 'الخصومات:',
		selectSectionTitle: 'الرد (select)',
		genderLabel: 'الجنس:',
		items: typed<{ count: number }>(
			'{count, plural, zero {لا عناصر} one {# عنصر} two {# عنصران} few {# عناصر} many {# عنصرا} other {# عنصر}}'
		),
		available: typed<{ count: number }>(
			'{count, plural, zero {لا توجد خصومات} one {لديك # خصم متاح} two {لديك # خصمان متاحان} few {لديك # خصومات متاحة} many {لديك # خصما متاحا} other {لديك # خصم متاح}}'
		),
		summary: typed<{ itemsCount: number; discountCount: number }>(
			'لديك {itemsCount, plural, zero {لا عناصر} one {# عنصر} two {# عنصران} few {# عناصر} many {# عنصرا} other {# عنصر}} و{discountCount, plural, zero {لا خصومات} one {# خصم} two {# خصمان} few {# خصومات} many {# خصما} other {# خصم}}'
		)
	},
	formatting: {
		title: 'التنسيق',
		subtitle: 'نفس القيم، تُعرض باللغة الحالية.',
		localeLabel: 'اللغة',
		dateTime: 'التاريخ والوقت',
		numbers: 'الأرقام',
		dateLabel: 'تاريخ قصير',
		dateFull: 'تاريخ طويل',
		timeLabel: 'الوقت',
		numberLabel: 'رقم',
		currencyLabel: 'عملة',
		percentLabel: 'نسبة مئوية',
		amountLabel: 'المبلغ',
		countLabel: 'العدد',
		ratioLabel: 'نسبة (0–1)',
		refreshNow: 'تحديث',
		footnote: 'العملة خاصة بكل لغة. البقية تستخدم نفس النمط الذي ينسّقه Intl.',
		date: typed<{ d: Date }>('{d, date, ::yMMMd}'),
		dateLong: typed<{ d: Date }>('{d, date, ::yyyyMMMMEEEEd}'),
		time: typed<{ d: Date }>('{d, time, ::Hms}'),
		number: typed<{ n: number }>('{n, number}'),
		currency: typed<{ amount: number }>('{amount, number, ::currency/SAR}'),
		percent: typed<{ n: number }>('{n, number, ::percent}')
	},
	ordinals: {
		title: 'الأعداد الترتيبية',
		subtitle: 'selectordinal يختار الصيغة وفق قواعد CLDR.',
		playground: 'منطقة تجربة',
		series: 'سلسلة',
		placeLabel: 'المرتبة',
		note: 'العربية لا تميّز الأعداد الترتيبية بصيغ متعددة هنا.',
		rank: typed<{ place: number }>('{place, selectordinal, other {#}}')
	},
	seo: {
		title: 'روابط SEO',
		subtitle: 'canonical و hreflang و x-default لهذه الصفحة — تُولَّد من الخادم.',
		disabled: 'SEO معطّل (seo: false).',
		canonicalLabel: 'Canonical',
		alternatesLabel: 'Alternates',
		xDefaultLabel: 'x-default',
		renderedLabel: 'الوسوم المحقونة',
		renderedBody: 'نفس الوسوم التي يحقنها <I18n /> في <head> لهذا الرابط.'
	},
	reactivity: {
		heading: 'فخ التفاعلية',
		explain:
			'بدّل اللغة من الأعلى. البطاقة اليسرى تقرأ t() في const — لن تتحدث. اليمنى تستخدم $derived والقوالب المباشرة — ستتحدث.',
		brokenTitle: 'مكسور: مُلتقط مرة',
		correctTitle: 'صحيح: تفاعلي',
		addToCart: 'أضف إلى السلة',
		outOfStock: 'غير متوفر',
		price: typed<{ amount: number }>(
			'{amount, number, ::currency/SAR} للوحدة'
		)
	},
	profile: {
		pronoun: typed<{ gender: 'male' | 'female' | 'other' }>(
			'{gender, select, male {قال} female {قالت} other {قالوا}}'
		),
		genderOptions: {
			male: 'ذكر',
			female: 'أنثى',
			other: 'آخر'
		}
	}
});
