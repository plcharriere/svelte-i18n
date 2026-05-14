import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
import { setClientLocaleAccessor } from './active-locale.ts';
import { getCookieBroadcastChannel } from './broadcast.ts';
import { primeDictionary } from './dictionary.ts';
import { extractPathLocale } from './path-locale.ts';
import { peekCurrentConfig } from './config.ts';
import { isInterceptionSuspended } from './intercept.ts';
import { bumpTranslationRevision } from './t.svelte.ts';
import type {
	Dictionary,
	I18nPageData,
	LocaleCode,
	ResolvedI18nConfig
} from './types.ts';

let code = $state<LocaleCode | undefined>(undefined);

if (typeof window !== 'undefined') {
	setClientLocaleAccessor(() => code);

	if (import.meta.hot) {
		import.meta.hot.on('svelte-i18n:locale-changed', (payload: unknown) => {
			const { code: c, dict } = (payload ?? {}) as {
				code?: LocaleCode;
				dict?: Dictionary;
			};
			if (!c || !dict) return;
			primeDictionary(c, dict);
			bumpTranslationRevision();
		});
	}
}

export function setActiveCode(value: LocaleCode): void {
	code = value;
}

function getActiveCode(): LocaleCode {
	const c = code ?? peekCurrentConfig()?.defaultLocale;
	if (!c) {
		throw new Error(
			'[svelte-i18n] Active locale requested before createI18n() was called.'
		);
	}
	return c;
}

function primeChain(data: I18nPageData): void {
	if (!data.dictionaries) return;
	for (const [c, dict] of Object.entries(data.dictionaries)) {
		primeDictionary(c, dict as Dictionary);
	}
}

export function setupI18n(
	source: I18nPageData | (() => I18nPageData)
): void {
	const read = typeof source === 'function' ? source : () => source;
	if (typeof window === 'undefined') return;

	const initial = read();
	if (code === undefined) code = initial.locale;
	primeChain(initial);

	const data = $derived(read());

	$effect.pre(() => {
		primeChain(data);
		if (code !== data.locale) code = data.locale;
	});

	$effect(() => {
		if (typeof document === 'undefined') return;
		document.documentElement.lang = data.locale;
		document.documentElement.dir = data.rtl ? 'rtl' : 'ltr';

		const config = peekCurrentConfig();
		if (config?.mode === 'path') rewriteAnchors(data.locale, config);
	});

	beforeNavigate((nav) => {
		if (isInterceptionSuspended()) return;
		if (nav.cancel === undefined || !nav.to) return;
		if (nav.to.url.origin !== window.location.origin) return;

		const config = peekCurrentConfig();
		if (!config || config.mode !== 'path') return;

		const { code: urlCode } = extractPathLocale(nav.to.url.pathname, config);
		if (urlCode) return;

		const active = getActiveCode();
		if (active === config.defaultLocale) return;

		nav.cancel();
		const prefix = `/${active}`;
		const target = `${prefix}${nav.to.url.pathname}${nav.to.url.search}${nav.to.url.hash}`;
		goto(target, { replaceState: false });
	});

	const channel = getCookieBroadcastChannel();
	if (channel) {
		const onMessage = (e: MessageEvent) => {
			const config = peekCurrentConfig();
			if (!config || config.mode !== 'cookie') return;
			if (typeof e.data !== 'string') return;
			if (!config.locales[e.data]) return;
			if (e.data === code) return;
			invalidateAll();
		};
		channel.addEventListener('message', onMessage);
		$effect(() => () => channel.removeEventListener('message', onMessage));
	}
}

function rewriteAnchors(
	current: LocaleCode,
	config: ResolvedI18nConfig
): void {
	const prefix = current === config.defaultLocale ? '' : `/${current}`;
	const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href]');
	for (const a of anchors) rewriteAnchor(a, prefix, config);
}

function rewriteAnchor(
	a: HTMLAnchorElement,
	prefix: string,
	config: ResolvedI18nConfig
): void {
	const href = a.getAttribute('href');
	if (!href || !href.startsWith('/') || href.startsWith('//')) return;
	const { rest } = extractPathLocale(href, config);
	const path = rest === '/' ? '/' : rest;
	const target = `${prefix}${path}`;
	if (a.getAttribute('href') !== target) a.setAttribute('href', target);
}
